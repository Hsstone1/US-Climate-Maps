from datetime import datetime
import io
import os
import time
import boto3
from dotenv import load_dotenv
import pandas as pd
from io import BytesIO
import psycopg2
import logging


# Configure logging
log_filename = datetime.now().strftime("log_%Y%m%d_%H%M%S.txt")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s: %(levelname)s: %(message)s",
    handlers=[logging.FileHandler(log_filename), logging.StreamHandler()],
)

load_dotenv()  # This loads the variables from .env


def get_connection():
    return psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
    )


# Initialize a session using Boto3
s3 = boto3.client("s3")

# Define the bucket name and the base path for the station files
bucket_name = "noaa-ghcn-pds"
base_path = "csv/by_station/"

# Load the station details from your CSV file
stations_df = pd.read_csv("station_ids_with_details_1980_with_elevation.csv")


# Function to fetch and print data for a specific station
def fetch_and_format_station_data(station_name, station_index):
    object_key = f"{base_path}{station_name}.csv"

    try:
        # Get the object from S3
        response = s3.get_object(Bucket=bucket_name, Key=object_key)
        content = response["Body"].read()

        # Read the content into a DataFrame
        df = pd.read_csv(BytesIO(content))

        # Filter for the desired elements
        df = df[df["ELEMENT"].isin(["TMAX", "TMIN", "PRCP", "SNOW"])]

        # Convert DATE from YYYYMMDD to a datetime object
        df["DATE"] = pd.to_datetime(df["DATE"], format="%Y%m%d")

        # Pivot the table to have one row per date and columns for TMAX, TMIN, PRCP, SNOW
        climate_data_df = df.pivot(
            index="DATE", columns="ELEMENT", values="DATA_VALUE"
        ).reset_index()
        climate_data_df.columns.name = None  # Remove the pivot table's column hierarchy

        min_date = climate_data_df["DATE"].min()
        max_date = climate_data_df["DATE"].max()
        all_dates = pd.date_range(start=min_date, end=max_date, freq="D")
        all_dates_df = pd.DataFrame(all_dates, columns=["DATE"])

        # Merge with the existing data
        complete_data_df = all_dates_df.merge(climate_data_df, on="DATE", how="left")

        # Ensure all columns (TMAX, TMIN, PRCP, SNOW) exist, fill with 0 if they don't
        for element in ["TMAX", "TMIN", "PRCP", "SNOW"]:
            if element not in complete_data_df:
                complete_data_df[element] = 0

        complete_data_df["PRCP"].fillna(0, inplace=True)
        complete_data_df["SNOW"].fillna(0, inplace=True)

        complete_data_df["TMAX"] = complete_data_df["TMAX"] * 9 / 50 + 32
        complete_data_df["TMIN"] = complete_data_df["TMIN"] * 9 / 50 + 32
        complete_data_df["PRCP"] = complete_data_df["PRCP"] / 254
        complete_data_df["SNOW"] = complete_data_df["SNOW"] / 254

        complete_data_df["TMAX"].fillna(9999, inplace=True)
        complete_data_df["TMIN"].fillna(-9999, inplace=True)
        logging.info(f"Successfully processed station {station_index} ({station_name})")

        insert_climate_data_copy(station_index, complete_data_df, station_name)

    except Exception as e:
        logging.error(
            f"Failed to retrieve or parse data for station {station_index} ({station_name}). Error: {e}"
        )


def insert_stations_info(df):
    conn = get_connection()

    cur = conn.cursor()
    insert_query = """
    INSERT INTO public.stations_info (latitude, longitude, elevation, geom)
    VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
    RETURNING id;
    """

    for index, row in df.iterrows():
        cur.execute(
            insert_query,
            (
                row["latitude"],
                row["longitude"],
                row["elevation"],
                row["longitude"],
                row["latitude"],
            ),
        )
        station_id = cur.fetchone()[0]
        conn.commit()  # Commit after each insert
        print(f"Inserted station {station_id}")

    cur.close()
    conn.close()


def insert_climate_data_copy(station_index, df, station_name):
    conn = get_connection()
    cur = conn.cursor()
    df["station_id"] = station_index  # Set all rows to have the station_id

    # Reorder DataFrame columns to match the table schema: station_id, date, tmax, tmin, prcp, snow
    df = df[["station_id", "DATE", "TMAX", "TMIN", "PRCP", "SNOW"]]

    # Create an in-memory text stream
    buffer = io.StringIO()
    # Write the DataFrame to buffer
    df.to_csv(buffer, header=False, index=False)
    buffer.seek(0)  # Move to the start of the buffer

    # Define the COPY command
    copy_query = """
    COPY public.stations_climate_data (station_id, date, tmax, tmin, prcp, snow)
    FROM STDIN WITH CSV;
    """

    try:
        # Execute the COPY command
        cur.copy_expert(sql=copy_query, file=buffer)
        conn.commit()  # Commit after the copy is done
        print(
            f"Inserted climate data for station {station_index} ({station_name}) using COPY"
        )
        logging.info(
            f"Inserted climate data for station {station_index} ({station_name}) using COPY"
        )

    except Exception as e:
        print(
            f"Failed to copy data for station {station_index} ({station_name}). Error: {e}"
        )
        logging.error(
            f"Failed to copy data for station {station_index} ({station_name}). Error: {e}"
        )

        conn.rollback()  # Rollback in case of error
    finally:
        cur.close()
        conn.close()


# This is used to insert the station details into the database, like lat, lng, elevation
"""
start_time = time.time()
insert_stations_info(stations_df)
print("Total Elapsed Time (STATIONS_INFO):", time.time() - start_time, "seconds")
"""


index = 1
start_time = time.time()


try:
    fetch_and_format_station_data("USC00155640", 8532)
except Exception as general_error:
    logging.error("An unexpected error occurred: %s", general_error)
    print("An unexpected error occurred", general_error)

"""
try:
    # Iterate over the station IDs and fetch their data
    for station_name in stations_df["station_id"]:
        fetch_and_format_station_data(station_name, index)
        # print("Printing data for station: ", station_id)

        index += 1

    logging.info(
        "Total Elapsed Time (STATIONS_CLIMATE): %s seconds", time.time() - start_time
    )
    print("Total Elapsed Time (STATIONS_CLIMATE):", time.time() - start_time, "seconds")
except Exception as general_error:
    logging.error("An unexpected error occurred: %s", general_error)
    print("An unexpected error occurred", general_error)
    
    
"""
