import os
from flask import Flask, request, jsonify
from climate_point_interpolation import optimized_climate_data
import time
from flask_cors import CORS


"""
This is a flask file, used solely for local development. The production build will use the lambda
Function, which is in lambda_climate_data.py. This file is not used in the production build.
"""

application = Flask(__name__)
# URL = "https://*.usclimatemaps.com"
# CORS(application, resources={r"/climate_data": {"origins": URL}})
CORS(application)


@application.route("/climate_data", methods=["POST"])
def climate_data():
    data = request.get_json()
    if "latitude" in data and "longitude" in data and "elevation" in data:
        latitude = data["latitude"]
        longitude = data["longitude"]
        elevation = data["elevation"]

    start_time = time.time()  # Start timer
    climate_data, location_data = optimized_climate_data(latitude, longitude, elevation)
    print("Backend Server Elapsed Time:", time.time() - start_time, "seconds")

    data = {
        "climate_data": climate_data,
        "location_data": location_data,
    }
    return jsonify(data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Default to port 5000 for local development
    application.run(host="0.0.0.0", port=port, debug=True)
