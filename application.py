import os
import json  # Import the json library
from flask import Flask, request, jsonify
from climate_point_interpolation import optimized_climate_data
import time
from flask_cors import CORS

application = Flask(__name__)
CORS(application)


@application.route("/climate_data", methods=["POST"])
def climate_data():
    # Get the raw JSON from the request
    data = request.get_json()

    # Check if the 'body' key is in the data dictionary
    if "body" in data:
        # Parse the inner JSON string
        inner_data = json.loads(data["body"])

        # Now we expect inner_data to be a dictionary, check for the expected keys
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
                # Handle the error if the values cannot be converted to float
                return (
                    jsonify(
                        {"error": "Invalid latitude, longitude, or elevation format."}
                    ),
                    400,
                )

            start_time = time.time()  # Start timer
            climate_data, location_data = optimized_climate_data(
                latitude, longitude, elevation
            )
            print("Backend Server Elapsed Time:", time.time() - start_time, "seconds")

            data = {
                "climate_data": climate_data,
                "location_data": location_data,
            }
            return jsonify(data)
        else:
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    application.run(host="0.0.0.0", port=port, debug=True)
