from flask import Flask, request, jsonify
from climate_data import WeatherDataEncoder
from climate_point_interpolation import get_climate_avg_at_point, get_climate_data_year
from read_from_csv_to_dataframe import put_NOAA_csvs_name_into_df
import pandas as pd
import time
from flask_cors import CORS
from geopy.geocoders import Nominatim
import json

app = Flask(__name__) 
CORS(app)

df_stations_NWS_names = pd.read_csv('lat_lon_identifier_elev_name.csv')
df_stations_NOAA_names = put_NOAA_csvs_name_into_df()

@app.route('/climate_data', methods=["POST"])
def climate_data():
    data = request.get_json()
    if 'latitude' in data and 'longitude' in data and 'elevation' in data:
        latitude = data['latitude']
        longitude = data['longitude']
        elevation = data['elevation']

    
    '''
    # Process the latitude and longitude values and retrieve the necessary data
    start_time = time.time()  # Start timer

    annual_data, monthly_data, location_data = get_climate_avg_at_point(latitude, longitude, elevation, df_stations_NWS_names, df_stations_NOAA_names)
    print("Backend Server Elapsed Time:", time.time() - start_time, "seconds")
    

    monthly_data_dict = {
        'monthly_high_avg': monthly_data['weighted_monthly_high_avg'],
        'monthly_low_avg': monthly_data['weighted_monthly_low_avg'],
        'monthly_mean_avg': monthly_data['weighted_monthly_mean_avg'],
        'monthly_mean_maximum': monthly_data['weighted_monthly_mean_maximum'],
        'monthly_record_high': monthly_data['weighted_monthly_record_high'],
        'monthly_mean_minimum': monthly_data['weighted_monthly_mean_minimum'],
        'monthly_record_low': monthly_data['weighted_monthly_record_low'],
        'monthly_HDD_avg': monthly_data['weighted_monthly_HDD_avg'],
        'monthly_CDD_avg': monthly_data['weighted_monthly_CDD_avg'],
        'monthly_precip_avg': monthly_data['weighted_monthly_precip_avg'],
        'monthly_snow_avg': monthly_data['weighted_monthly_snow_avg'],    
        'monthly_precip_days_avg': monthly_data['weighted_monthly_precip_days_avg'],
        'monthly_snow_days_avg': monthly_data['weighted_monthly_snow_days_avg'],
        'monthly_frost_free_days_avg': monthly_data['weighted_monthly_frost_free_days_avg'],
        'monthly_dewpoint_avg': monthly_data['weighted_monthly_dewpoint_avg'],
        'monthly_humidity_avg': monthly_data['weighted_monthly_humidity_avg'],
        'monthly_apparent_high': monthly_data['weighted_monthly_apparent_temp_high'],
        'monthly_apparent_low': monthly_data['weighted_monthly_apparent_temp_low'],
        'monthly_wind_avg': monthly_data['weighted_monthly_wind_avg'],
        'monthly_wind_gust_avg': monthly_data['weighted_monthly_wind_gust_avg'],
        'monthly_sunshine_avg': monthly_data['weighted_monthly_sunshine_avg'],
        'monthly_sunshine_days_avg': monthly_data['weighted_monthly_sunshine_days_avg'],
        'monthly_wind_dir_avg': monthly_data['weighted_monthly_wind_dir_avg'],
        'monthly_wind_gust_peak': monthly_data['weighted_monthly_wind_gust_peak'],
        'monthly_daylight_hours_avg': monthly_data['monthly_daylight_hours_avg'],
        'monthly_sunshine_hours_avg': monthly_data['monthly_sunshine_hours_avg'],
        'monthly_sun_angle': monthly_data['monthly_sun_angle'],
        'monthly_uv_index': monthly_data['monthly_uv_index'],
        'monthly_comfort_index': monthly_data['monthly_comfort_index']
    }

    # Create a response containing the data to be sent back to the JavaScript code
    annual_data_dict = {
        'annual_high_avg': annual_data['weighted_annual_high_avg'],
        'annual_low_avg': annual_data['weighted_annual_low_avg'],
        'annual_mean_avg': annual_data['weighted_annual_mean_avg'],
        'annual_mean_maximum': annual_data['weighted_annual_mean_maximum'],
        'annual_record_high': annual_data['weighted_annual_record_high'],
        'annual_mean_minimum': annual_data['weighted_annual_mean_minimum'],
        'annual_record_low': annual_data['weighted_annual_record_low'],
        'annual_HDD_avg': annual_data['weighted_annual_HDD_avg'],
        'annual_CDD_avg': annual_data['weighted_annual_CDD_avg'],
        'annual_precip_avg': annual_data['weighted_annual_precip_avg'],
        'annual_snow_avg': annual_data['weighted_annual_snow_avg'],
        'annual_precip_days_avg': annual_data['weighted_annual_precip_days_avg'],
        'annual_snow_days_avg': annual_data['weighted_annual_snow_days_avg'],
        'annual_frost_free_days_avg': annual_data['weighted_annual_frost_free_days_avg'],
        'annual_dewpoint_avg': annual_data['weighted_annual_dewpoint_avg'],
        'annual_humidity_avg': annual_data['weighted_annual_humidity_avg'],
        'annual_apparent_high': annual_data['weighted_annual_apparent_temp_high'],
        'annual_apparent_low': annual_data['weighted_annual_apparent_temp_low'],
        'annual_wind_avg': annual_data['weighted_annual_wind_avg'],
        'annual_wind_gust_avg': annual_data['weighted_annual_wind_gust_avg'],
        'annual_sunshine_avg': annual_data['weighted_annual_sunshine_avg'],
        'annual_sunshine_days_avg': annual_data['weighted_annual_sunshine_days_avg'],
        'annual_wind_dir_avg': annual_data['weighted_annual_wind_dir_avg'],
        'annual_wind_gust_peak': annual_data['weighted_annual_wind_gust_peak'],
        'annual_daylight_hours_avg': annual_data['annual_daylight_hours_avg'],
        'annual_sunshine_hours_avg': annual_data['annual_sunshine_hours_avg'],
        'annual_uv_index_avg': annual_data['annual_uv_index_avg'],
        'annual_sun_angle_avg': annual_data['annual_sun_angle_avg'],
        'annual_comfort_index': annual_data['annual_comfort_index']


    }


    location_data_dict = {
        'elevation': elevation,
        'location': "",
        'koppen': location_data['koppen'],
        'plant_hardiness': location_data['plant_hardiness'],
    }

    '''
    start_time = time.time()  # Start timer
    historical_data, historical_location_data = get_climate_data_year(latitude, longitude, elevation, df_stations_NWS_names, df_stations_NOAA_names)
    print("Historical Backend Server Elapsed Time:", time.time() - start_time, "seconds")
    data = {
        #'annual_data': annual_data_dict,
        #'monthly_data': monthly_data_dict,
        #'location_data': location_data_dict,
        'climate_data': json.loads(json.dumps(historical_data, cls=WeatherDataEncoder)),
        'location_data': json.loads(json.dumps(historical_location_data, cls=WeatherDataEncoder))
    }

    # Return the response as JSON
    #print(data)
    return jsonify(data)




if __name__ == '__main__':
    app.run(debug=True) 
    

