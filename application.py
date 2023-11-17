import os
import json  # Import the json library
from flask import Flask, request, jsonify
import requests
from dotenv import load_dotenv

from lambda_climate_data.climate_point_interpolation import optimized_climate_data
import time
from flask_cors import CORS

application = Flask(__name__)
CORS(application)
load_dotenv()  # This loads the variables from .env


"""
THIS FILE IS FOR LOCAL DEVELOPMENT ONLY
This file is used to run the backend server locally.
It is not used in production.
"""


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


"""
@application.route("/elevation", methods=["POST"])
def elevation():
    data = request.get_json()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude is not None and longitude is not None:
        try:
            latitude = float(latitude)
            longitude = float(longitude)
            elevation = get_elevation(latitude, longitude)
            if elevation is not None:
                return jsonify({"elevation": elevation}), 200
            else:
                return jsonify({"error": "Error fetching elevation."}), 500
        except ValueError:
            return jsonify({"error": "Invalid latitude or longitude format."}), 400
    else:
        return jsonify({"error": "Missing latitude or longitude data."}), 400


@application.route("/geolocate", methods=["POST"])
def geolocation():
    data = request.get_json()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude is not None and longitude is not None:
        try:
            latitude = float(latitude)
            longitude = float(longitude)
            geolocation = get_geolocation(latitude, longitude)
            if geolocation is not None:
                return jsonify({"geolocation": geolocation}), 200
            else:
                return jsonify({"error": "Error fetching geolocation."}), 500
        except ValueError:
            return jsonify({"error": "Invalid latitude or longitude format."}), 400
    else:
        return jsonify({"error": "Missing latitude or longitude data."}), 400


# This function is used to get the elevation of a given latitude and longitude.
# It uses the google maps api to get the elevation.
def get_elevation(latitude, longitude):
    api_key = os.environ.get("GOOGLE_API_KEY")
    url = "https://maps.googleapis.com/maps/api/elevation/json"
    params = {
        "locations": f"{latitude},{longitude}",
        "key": api_key,
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        result = response.json()
        if result["status"] == "OK":
            elevation_meters = result["results"][0]["elevation"]
            elevation_feet = elevation_meters * 3.28

            # If the elevation is below sea level, set it to 0,
            # otherwise the climate data API will return an error
            # But there are special cases, like death valley, which are bellow sea level.
            if elevation_feet < -300:
                elevation_feet = 0
            print("ELEVATION: ", elevation_feet)

            return elevation_feet
        else:
            print(f"Error finding elevation: {result['status']}")
            return 0
    else:
        print(f"HTTP error: {response.status_code}")
        return None


# This function is used to get the geolation of a given latitude and longitude.
# It uses the google maps api to get the formatted location name.
def get_geolocation(latitude, longitude):
    api_key = os.environ.get("GOOGLE_API_KEY")
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "latlng": f"{latitude},{longitude}",
        "key": api_key,
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        result = response.json()
        if result["status"] == "OK" and result["results"]:
            components = result["results"][0]["address_components"]
            locality, state, country = None, None, None

            for component in components:
                if "locality" in component["types"]:
                    locality = component["long_name"]
                elif "administrative_area_level_1" in component["types"]:
                    state = component["long_name"]
                elif "country" in component["types"]:
                    country = component["short_name"]

            formatted_address = ", ".join(
                filter(None, [locality, state, country if country != "US" else None])
            )

            if formatted_address:
                print("GEOLOCATION: ", formatted_address)
                return formatted_address
            else:
                return (
                    f"{latitude:.2f}, {longitude:.2f}"  # Formatting to 2 decimal places
                )
        else:
            print(f"Error finding location: {result['status']}")
            return f"{latitude:.2f}, {longitude:.2f}"
    else:
        print(f"HTTP error: {response.status_code}")
        return None


@application.route("/get_google_maps_api_key", methods=["GET"])
def get_api_key():
    api_key = os.environ.get("GOOGLE_API_KEY")
    return jsonify({"api_key": api_key}), 200

"""
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    application.run(host="0.0.0.0", port=port, debug=True)
