from flask import Flask, request, jsonify
from climate_point_interpolation import get_climate_avg_at_point
import pandas as pd
import time
from flask_cors import CORS
from geopy.geocoders import Nominatim
import random
import string

app = Flask(__name__)
CORS(app)

df_stations = pd.read_csv('lat_lon_identifier_elev_name.csv')

@app.route('/climate_data', methods=["POST"])
def climate_data():
    data = request.get_json()
    if 'latitude' in data and 'longitude' in data:
        latitude = data['latitude']
        longitude = data['longitude']
    
    #target_coordinates = (37.938259402679584, -107.11396906315399)

    #print("LAT, LON: ", latitude, ", ", longitude)

    # Process the latitude and longitude values and retrieve the necessary data
    start_time = time.time()  # Start timer

    annual_data, monthly_data, location_data = get_climate_avg_at_point(latitude, longitude, df_stations)
    end_time = time.time()  # Stop timer
    elapsed_time = end_time - start_time
    print("Elapsed Time:", elapsed_time, "seconds")
    #annual_data = get_annual_avg_at_point(target_coordinates[0], target_coordinates[1], df_stations)
    
    # Create a response containing the data to be sent back to the JavaScript code
    annual_data = {
        'weighted_annual_high_avg': annual_data['weighted_annual_high_avg'],
        'weighted_annual_low_avg': annual_data['weighted_annual_low_avg'],
        'weighted_annual_mean_avg': annual_data['weighted_annual_mean_avg'],
        'weighted_annual_percentile_90_max_avg': annual_data['weighted_annual_percentile_90_max_avg'],
        'weighted_annual_percentile_100_max_avg': annual_data['weighted_annual_percentile_100_max_avg'],
        'weighted_annual_percentile_10_min_avg': annual_data['weighted_annual_percentile_10_min_avg'],
        'weighted_annual_percentile_00_min_avg': annual_data['weighted_annual_percentile_00_min_avg'],
        'weighted_annual_DEP_avg': annual_data['weighted_annual_DEP_avg'],
        'weighted_annual_HDD_avg': annual_data['weighted_annual_HDD_avg'],
        'weighted_annual_CDD_avg': annual_data['weighted_annual_CDD_avg'],
        'weighted_annual_precip_avg': annual_data['weighted_annual_precip_avg'],
        'weighted_annual_snow_avg': annual_data['weighted_annual_snow_avg'],
        'weighted_annual_snow_depth_avg': annual_data['weighted_annual_snow_depth_avg'],
        'weighted_annual_wind_avg': annual_data['weighted_annual_wind_avg'],
        'weighted_annual_wind_gust_avg': annual_data['weighted_annual_wind_gust_avg'],
        'weighted_annual_sunshine_avg': annual_data['weighted_annual_sunshine_avg'],
        'weighted_annual_wind_dir_avg': annual_data['weighted_annual_wind_dir_avg'],
    }

    monthly_data = {
        'weighted_monthly_high_avg': monthly_data['weighted_monthly_high_avg'],
        'weighted_monthly_low_avg': monthly_data['weighted_monthly_low_avg'],
        'weighted_monthly_mean_avg': monthly_data['weighted_monthly_mean_avg'],
        'weighted_monthly_percentile_90_max_avg': monthly_data['weighted_monthly_percentile_90_max_avg'],
        'weighted_monthly_percentile_100_max_avg': monthly_data['weighted_monthly_percentile_100_max_avg'],
        'weighted_monthly_percentile_10_min_avg': monthly_data['weighted_monthly_percentile_10_min_avg'],
        'weighted_monthly_percentile_00_min_avg': monthly_data['weighted_monthly_percentile_00_min_avg'],
        'weighted_monthly_DEP_avg': monthly_data['weighted_monthly_DEP_avg'],
        'weighted_monthly_HDD_avg': monthly_data['weighted_monthly_HDD_avg'],
        'weighted_monthly_CDD_avg': monthly_data['weighted_monthly_CDD_avg'],
        'weighted_monthly_precip_avg': monthly_data['weighted_monthly_precip_avg'],
        'weighted_monthly_snow_avg': monthly_data['weighted_monthly_snow_avg'],
        'weighted_monthly_snow_depth_avg': monthly_data['weighted_monthly_snow_depth_avg'],
        'weighted_monthly_wind_avg': monthly_data['weighted_monthly_wind_avg'],
        'weighted_monthly_wind_gust_avg': monthly_data['weighted_monthly_wind_gust_avg'],
        'weighted_monthly_sunshine_avg': monthly_data['weighted_monthly_sunshine_avg'],
        'weighted_monthly_wind_dir_avg': monthly_data['weighted_monthly_wind_dir_avg'],
    }

    location_data = {
        'elevation': location_data['elevation'],
        'location': get_city_name(latitude, longitude)
    }

    data = {
        'annual_data': annual_data,
        'monthly_data': monthly_data,
        'location_data': location_data,
    }

    
    # Return the response as JSON
    return jsonify(data)


def get_city_name(latitude, longitude):
    try:
        generate_user_agent = lambda: ''.join(random.choices(string.ascii_letters + string.digits, k=15))
        geolocator = Nominatim(user_agent=str(generate_user_agent))  # Initialize Nominatim geolocator
        location = geolocator.reverse(f"{latitude}, {longitude}")  # Reverse geocode the coordinates

        if location:
            address = location.raw['address']
            city = address.get('city')
            state = address.get('state')
            county = address.get('county')
            country = address.get('country')
            print(city, ', ', state, ', ' ', ', address)

            values = {}
            if city and state:
                return city + ', ' + state
            elif county and state:
                return county + ', ' + state
            else:
                return country


    except Exception as e:
        print("Error occurred during geolocation:", str(e))

    return None

if __name__ == '__main__':
    app.run(debug=True)