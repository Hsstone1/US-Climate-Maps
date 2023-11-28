from datetime import time
import os
import time
import platform
from flask import Flask, request, jsonify
import json
from flask_cors import CORS
from db_helper import *
from db_climate_data import *

app = Flask(__name__)
CORS(app)


def get_connection():
    return psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
    )


# This function is used to get the climate data for the given latitude, longitude, and elevation
# This is only called once on locaiton creation, so the location_data is returned with the climate_data
@app.route("/climate_data_db", methods=["POST"])
def get_climate_data():
    data = request.get_json()

    try:
        conn = get_connection()

        if "latitude" in data and "longitude" in data and "elevation" in data:
            try:
                latitude = float(data["latitude"])
                longitude = float(data["longitude"])
                elevation = float(data["elevation"])

            except ValueError:
                # The values cannot be converted to float
                return (
                    jsonify(
                        {"error": "Invalid latitude, longitude, or elevation format."}
                    ),
                    400,
                )

            start_time = time.time()  # Start timer
            result = find_closest_from_db(latitude, longitude, None, conn)

            if result is not None:
                climate_data, weighted_elevation, num_days = result
                calc_additional_climate_parameters(
                    climate_data, elevation, weighted_elevation, num_days
                )
                print(
                    "Total Retrieval Elapsed Time:", time.time() - start_time, "seconds"
                )

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
                return jsonify(data)

            else:
                print("Failed to retrieve data.")
                return jsonify({"error": "Failed to retrieve data"}), 500

        else:
            print("400 ERROR: Missing data for latitude, longitude, or elevation.")
            return (
                jsonify(
                    {"error": "Missing data for latitude, longitude, or elevation."}
                ),
                400,
            )

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            conn.close()


# This function is used to get the climate data for a given year
@app.route("/climate_data_db_year", methods=["POST"])
def get_climate_data_year():
    data = request.get_json()

    if (
        "latitude" in data
        and "longitude" in data
        and "elevation" in data
        and "year" in data
    ):
        try:
            latitude = float(data["latitude"])
            longitude = float(data["longitude"])
            elevation = float(data["elevation"])
            year = int(data["year"])

        except ValueError:
            # The values cannot be converted to float or int
            return (
                jsonify(
                    {"error": "Invalid latitude, longitude, elevation, or year format."}
                ),
                400,
            )

        try:
            conn = get_connection()
            start_time = time.time()  # Start timer
            result = find_closest_from_db(latitude, longitude, year, conn)

            if result is not None:
                climate_data, weighted_elevation, num_days = result

                calc_additional_climate_parameters(
                    climate_data, elevation, weighted_elevation
                )
                print(
                    "Total Year Retrieval Elapsed Time:",
                    time.time() - start_time,
                    "seconds",
                )

                climate_data_json = dataframe_time_granularity_agg_to_json(climate_data)

                data = {
                    "climate_data": climate_data_json,
                }
                return jsonify(data)

            else:
                print("Failed to retrieve data.")
                return jsonify({"error": "Failed to retrieve data"}), 500

        except Exception as e:
            print(f"An error occurred: {e}")
            return jsonify({"error": "Internal server error"}), 500

        finally:
            if conn:
                conn.close()

    else:
        # If one of the keys is missing, send an appropriate response
        print("400 ERROR: Missing data for latitude, longitude, elevation, or year.")
        return (
            jsonify(
                {"error": "Missing data for latitude, longitude, elevation, or year."}
            ),
            400,
        )


if __name__ == "__main__":
    # Run the application
    app.run(debug=True, host="")
