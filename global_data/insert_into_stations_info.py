import os
from dotenv import load_dotenv
import pandas as pd
import psycopg2
import logging

# Set up logging
logging.basicConfig(
    filename="station_inserts.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
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


# Function to insert data into the database with transaction management
def insert_data(df):
    # Connect to the PostgreSQL database
    conn = get_connection()
    cursor = conn.cursor()

    # SQL to update data
    update_query = """
    UPDATE public.stations_info
    SET TMAX_INVALID_PERC = %s, TMIN_INVALID_PERC = %s, station_identifier = %s
    WHERE id = %s;
    """

    for index, row in df.iterrows():
        try:
            # Execute the insert statement
            cursor.execute(
                update_query,
                (
                    row["TMAX_INVALID_PERC"],
                    row["TMIN_INVALID_PERC"],
                    row["station_id"],
                    index + 1,
                ),
            )

            # Commit the transaction
            conn.commit()
            logging.info(
                f"Row {index} - Station {row['station_id']} inserted successfully."
            )
        except Exception as e:
            # Rollback the transaction in case of error
            conn.rollback()
            logging.error(
                f"Row {index} - Error inserting station {row['station_id']}: {e}"
            )

    # Close the database connection
    cursor.close()
    conn.close()


if __name__ == "__main__":
    # Load the DataFrame from CSV
    df = pd.read_csv("updated_station_details.csv")
    # Run the function
    insert_data(df)
