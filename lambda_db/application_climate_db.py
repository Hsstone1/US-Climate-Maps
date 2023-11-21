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


# This function is used to get the climate data for the given latitude, longitude, and elevation
# This is only called once on locaiton creation, so the location_data is returned with the climate_data
@app.route("/climate_data_db", methods=["POST"])
def get_climate_data():
    data = request.get_json()
    # print(data)

    if "body" in data:
        inner_data = json.loads(data["body"])

        if (
            "latitude" in inner_data
            and "longitude" in inner_data
            and "elevation" in inner_data
        ):
            try:
                latitude = float(inner_data["latitude"])
                longitude = float(inner_data["longitude"])
                elevation = float(inner_data["elevation"])

            except ValueError:
                # The values cannot be converted to float
                return (
                    jsonify(
                        {"error": "Invalid latitude, longitude, or elevation format."}
                    ),
                    400,
                )

            start_time = time.time()  # Start timer
            result = find_closest_from_db(latitude, longitude)

            if result is not None:
                climate_data, weighted_elevation, num_days = result
                calc_additional_climate_parameters(
                    climate_data, elevation, weighted_elevation, num_days
                )
                print(
                    "Total Retrieval Elapsed Time:", time.time() - start_time, "seconds"
                )
                # climate_data.to_csv("climate_data.csv")

                climate_data_json = dataframe_time_granularity_agg_to_json(climate_data)

                # json.dump(climate_data_json, open("climate_data.json", "w"))

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

        else:
            print("400 ERROR: Missing data for latitude, longitude, or elevation.")
            # If one of the keys is missing, send an appropriate response
            return (
                jsonify(
                    {"error": "Missing data for latitude, longitude, or elevation."}
                ),
                400,
            )
    else:
        # If 'body' key is not in data, send an appropriate response
        return jsonify({"error": "No body key in JSON."}), 400


# This function is used to get the climate data for a given year
@app.route("/climate_data_db_year", methods=["POST"])
def get_climate_data_year():
    data = request.get_json()
    # print(data)
    if "body" in data:
        inner_data = json.loads(data["body"])

        if (
            "latitude" in inner_data
            and "longitude" in inner_data
            and "elevation" in inner_data
            and "year" in inner_data
        ):
            try:
                latitude = float(inner_data["latitude"])
                longitude = float(inner_data["longitude"])
                elevation = float(inner_data["elevation"])
                year = int(inner_data["year"])

            except ValueError:
                # The values cannot be converted to float
                return (
                    jsonify(
                        {"error": "Invalid latitude, longitude, or elevation format."}
                    ),
                    400,
                )

            start_time = time.time()  # Start timer
            result = find_closest_from_db(latitude, longitude, year)

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
                # json.dump(climate_data_json, open("climate_data.json", "w"))

                data = {
                    "climate_data": climate_data_json,
                }
                return jsonify(data)

            else:
                print("Failed to retrieve data.")

        else:
            # If one of the keys is missing, send an appropriate response
            print("400 ERROR: Missing data for latitude, longitude, or elevation.")
            return (
                jsonify(
                    {"error": "Missing data for latitude, longitude, or elevation."}
                ),
                400,
            )
    else:
        # If 'body' key is not in data, send an appropriate response
        return jsonify({"error": "No body key in JSON."}), 400


if __name__ == "__main__":
    # Run the application
    app.run(debug=True, host="")
