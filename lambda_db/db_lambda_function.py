from datetime import time
import os
from psycopg2.pool import SimpleConnectionPool
import json

from db_helper import *
from db_climate_data import *

import logging
import os
import json
import time
from psycopg2.pool import SimpleConnectionPool
from db_helper import *
from db_climate_data import *

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


# Define the connection pool outside the handler
def get_connection():
    return psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
    )


def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))

    # Early exit for warm-up invocation
    if (
        event.get("source") == "aws.events"
        and event.get("detail-type") == "Scheduled Event"
    ):
        logger.info("Warm-up invocation - exiting early.")
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Warm-up successful"}),
        }

    try:
        # Get a connection from the pool
        logger.info("Getting a DB connection from the pool")
        conn = get_connection()
        logger.info("DB connection acquired")

        # Parse the incoming JSON from the event body
        logger.info("Parsing the event body")
        body = json.loads(
            event.get("body", "{}")
        )  # Default to empty dict if body is missing

        logger.info("Body: %s", body)

        # Differentiate events based on path
        logger.info("Determining the path")
        path = event.get("path")
        logger.info("Path: %s", path)
        logger.info("PathParameters: %s", event.get("pathParameters"))

        if path == "/climate_data_db":
            logger.info("Handling climate_data_db")
            response = handle_climate_data_db(body, conn)
        elif path == "/climate_data_db_year":
            logger.info("Handling climate_data_db_year")
            response = handle_climate_data_db_year(body, conn)
        else:
            logger.warning("No matching route found")
            response = {
                "statusCode": 404,
                "body": json.dumps({"message": "Route not found", "path": path}),
            }

        return response

    except Exception as e:
        logger.error("An error occurred: %s", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"}),
        }

    finally:
        # Always return the connection to the pool
        logger.info("Returning the DB connection to the pool")
        conn.close()


def handle_climate_data_db(body, conn):
    try:
        logger.info("Handling climate_data_db request with body: %s", body)

        # Validate and extract parameters
        latitude = float(body["latitude"])
        longitude = float(body["longitude"])
        elevation = float(body["elevation"])

        # Perform database query and process data
        start_time = time.time()
        result = find_closest_from_db(latitude, longitude, None, conn)
        if result is not None:
            climate_data, weighted_elevation, num_days = result
            calc_additional_climate_parameters(
                climate_data, elevation, weighted_elevation, num_days
            )
            elapsed_time = time.time() - start_time
            logger.info("Total Retrieval Elapsed Time: %s seconds", elapsed_time)

            # Construct response data
            climate_data_json = dataframe_time_granularity_agg_to_json(climate_data)
            location_data = {
                "elevation": elevation,
                "koppen": calc_koppen_climate(
                    climate_data_json["mean_temperature"]["monthly"],
                    climate_data_json["precipitation"]["monthly"],
                ),
                "plant_hardiness": calc_plant_hardiness(
                    climate_data_json["record_low"]["annual"]
                ),
            }
            data = {
                "climate_data": climate_data_json,
                "location_data": location_data,
            }

            # Return successful response
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "https://www.usclimatemaps.com",  # Adjust if you have a specific domain
                },
                "body": json.dumps(data),
            }
        else:
            logger.warning("No data found for the given parameters.")
            return {
                "statusCode": 404,
                "body": json.dumps({"message": "Data not found"}),
            }

    except KeyError as e:
        logger.error("Missing parameter in request: %s", e)
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Missing parameters"}),
        }
    except Exception as e:
        logger.exception("Error handling climate_data_db request.")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"}),
        }


def handle_climate_data_db_year(body, conn):
    # Check if the necessary data is in the body of the request
    if "latitude" in body and "longitude" in body and "elevation" in body:
        latitude = float(body["latitude"])
        longitude = float(body["longitude"])
        elevation = float(body["elevation"])
        year = int(body["year"])

        start_time = time.time()
        result = find_closest_from_db(latitude, longitude, year, conn)
        if result is not None:
            climate_data, weighted_elevation, num_days = result
            calc_additional_climate_parameters(
                climate_data, elevation, weighted_elevation
            )
            print(
                "Year Total Retrieval Elapsed Time:",
                time.time() - start_time,
                "seconds",
            )
            climate_data_json = dataframe_time_granularity_agg_to_json(climate_data)

            data = {
                "climate_data": climate_data_json,
            }

            response = {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "https://www.usclimatemaps.com",  # Adjust if you have a specific domain
                },
                "body": json.dumps(data),
            }
            return response

        else:
            print("Failed to retrieve data.")
