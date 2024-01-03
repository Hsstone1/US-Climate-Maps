from datetime import datetime
import logging
import time
import boto3
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from io import BytesIO

# Configure logging
log_filename = datetime.now().strftime("log_%Y%m%d_%H%M%S.txt")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s: %(levelname)s: %(message)s",
    handlers=[logging.FileHandler(log_filename), logging.StreamHandler()],
)

load_dotenv()  # This loads the variables from .env

# Initialize a session using Boto3
s3 = boto3.client("s3")

# Define the bucket name and the base path for the station files
bucket_name = "noaa-ghcn-pds"
base_path = "csv/by_station/"

# Load the station details from your CSV file
stations_df = pd.read_csv("station_ids_with_details_1980_with_elevation.csv")
stations_df["TMAX_INVALID_PERC"] = np.nan
stations_df["TMIN_INVALID_PERC"] = np.nan


def count_consecutive_invalid(series, invalid_values=[0, np.nan]):
    """Count the longest streak of invalid values."""
    max_streak = 0
    current_streak = 0
    for value in series:
        if value in invalid_values:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0
    return max_streak


def calculate_invalid_percentage(df, column, threshold=10):
    """Calculate the percentage of invalid data in a column."""

    # Check if the column exists in the DataFrame
    if column not in df.columns:
        return 100  # Return 100% invalid if the column is missing

    n_total = len(df)
    n_invalid = df[column].isnull().sum() + (df[column] == 0).sum()
    n_repeated = (df[column].diff() == 0).sum()  # Count of consecutive repeated values

    # Calculate the longest streak of invalid values
    max_streak = count_consecutive_invalid(df[column])

    # Consider data invalid if there's a long streak of invalid values
    if max_streak > threshold:
        n_invalid += max_streak

    invalid_percentage = (n_invalid + n_repeated) / n_total * 100
    return invalid_percentage


# Function to fetch and print data for a specific station
def fetch_and_validate_station_data(station_name, station_index):
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
        df = df[df["DATE"] >= pd.to_datetime("1980-01-01")]

        # Pivot the table to have one row per date and columns for TMAX, TMIN, PRCP, SNOW
        climate_data_df = df.pivot(
            index="DATE", columns="ELEMENT", values="DATA_VALUE"
        ).reset_index()
        climate_data_df.columns.name = None  # Remove the pivot table's column hierarchy

        # Calculate invalid data percentage for TMAX and TMIN
        tmax_invalid_pct = calculate_invalid_percentage(climate_data_df, "TMAX")
        tmin_invalid_pct = calculate_invalid_percentage(climate_data_df, "TMIN")

        logging.info(
            f"Station {station_index} ({station_name}) - Invalid Data Percentage - TMAX: {tmax_invalid_pct}%, TMIN: {tmin_invalid_pct}%"
        )
        return tmax_invalid_pct, tmin_invalid_pct

    except Exception as e:
        logging.error(
            f"Failed for station {station_index} ({station_name}). Error: {e}"
        )
        return np.nan, np.nan  # Return NaN values in case of an error


if __name__ == "__main__":
    start_time = time.time()
    try:
        # Iterate over the specified range of indices
        for index, station_name in enumerate(stations_df["station_id"], start=1):
            tmax_invalid_pct, tmin_invalid_pct = fetch_and_validate_station_data(
                station_name, index
            )
            stations_df.loc[index - 1, "TMAX_INVALID_PERC"] = tmax_invalid_pct
            stations_df.loc[index - 1, "TMIN_INVALID_PERC"] = tmin_invalid_pct

        stations_df.to_csv("updated_station_details.csv", index=False)
        logging.info("Total Elapsed Time: %s seconds", time.time() - start_time)

    except Exception as e:
        logging.error("An unexpected error occurred: %s", e)
