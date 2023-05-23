from flask import Flask, request, jsonify
from climate_point_interpolation import get_annual_avg_at_point
import pandas as pd
from flask_cors import CORS

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

    print("LAT, LON: ", latitude, ", ", longitude)

    # Process the latitude and longitude values and retrieve the necessary data

    annual_data = get_annual_avg_at_point(latitude, longitude, df_stations)
    #annual_data = get_annual_avg_at_point(target_coordinates[0], target_coordinates[1], df_stations)

    # Create a response containing the data to be sent back to the JavaScript code
    data = {
        'weighted_annual_high_avg': annual_data['weighted_annual_high_avg'],
        'weighted_annual_low_avg': annual_data['weighted_annual_low_avg'],
        'weighted_annual_mean_avg': annual_data['weighted_annual_mean_avg'],
        'weighted_percentile_90_max_avg': annual_data['weighted_percentile_90_max_avg'],
        'weighted_percentile_100_max_avg': annual_data['weighted_percentile_100_max_avg'],
        'weighted_percentile_10_min_avg': annual_data['weighted_percentile_10_min_avg'],
        'weighted_percentile_00_min_avg': annual_data['weighted_percentile_00_min_avg'],
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
        'elevation': annual_data['elevation'],
    }
    
    # Return the response as JSON
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)