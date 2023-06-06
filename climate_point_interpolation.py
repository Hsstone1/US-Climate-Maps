import pandas as pd
import requests
import urllib
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
from read_from_csv_to_dataframe import df_from_NWS_csv, get_NOAA_csv_content, humidity_regr_from_temp_max_min
import time



def calculate_days_from_reference(date_str, ref_date_str):

    # Convert the date strings to datetime objects
    date = datetime.strptime(date_str, '%Y-%m-%d')
    reference_date = datetime.strptime(ref_date_str, '%Y-%m-%d')

    # Calculate the difference in days
    days_difference = (date - reference_date).days

    return days_difference

def calculate_humidity_percentage(dew_points_F, temperatures_F):
    humidity_percentages = []
    for dew_point, temperature in zip(dew_points_F, temperatures_F):
        # Convert Fahrenheit to Celsius
        dew_point_C = (dew_point - 32) * 5/9
        temperature_C = (temperature - 32) * 5/9

        # Calculate actual vapor pressure
        vapor_pressure = 6.112 * 10 ** (7.5 * dew_point_C / (237.7 + dew_point_C))

        # Calculate saturation vapor pressure
        saturation_vapor_pressure = 6.112 * 10 ** (7.5 * temperature_C / (237.7 + temperature_C))

        # Calculate humidity percentage
        humidity_percentage = (vapor_pressure / saturation_vapor_pressure) * 100
        humidity_percentages.append(humidity_percentage)

    return humidity_percentages

def get_elevation_from_coords(lat,lon):
    '''
    USGS API for elevation retrieval. Only needs lat lon coords
    '''
    params = {
            'output': 'json',
            'x': lon,
            'y': lat,
            'units': 'Feet'
        }
    
    elevations = []
    url = r'https://epqs.nationalmap.gov/v1/json?'
    try:
        result = requests.get(url + urllib.parse.urlencode(params), timeout=2.000)

        elevations.append(result.json()['value'])
        #print("ELEVATIONS: ", elevations)
    except (requests.exceptions.JSONDecodeError, KeyError, requests.exceptions.ReadTimeout):
        elevations.append(-999)
        print("ERROR: ELEVATION NOT FOUND")
    return elevations[0]

  
def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the haversine distance between two points on the Earth.
    Returns the distance in miles by diving result km by 1.6
    """
    R = 6371  # Radius of the Earth in kilometers

    # Convert latitude and longitude to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    a = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c / 1.6


def nearest_coordinates_to_point_NWS(target_lat, target_lon, df, num_results=3):
    """
    Find the closest coordinates to a target point using NWS CF6 stations(NWS, CITY_CODE).
    """
    distances = []

    for index, row in df.iterrows():
        lat = row['LAT']
        lon = row['LON']
        distance = haversine_distance(target_lat, target_lon, lat, lon)
        distances.append((lat, lon, row['NWS_PROVIDER'], row['CITY_CODE'], row['ELEVATION'], row['STATION'], distance))

    distances.sort(key=lambda x: x[6])  # Sort by distance, which is 7th value, 6th index
    closest = distances[:num_results]
    #print("NWS: ", closest)

    return closest


def nearest_coordinates_to_point_NOAA(target_lat, target_lon, df, num_results=3):
    """
    Find the closest coordinates to a target point using NOAA stations (USCxxxxxxxxx.csv).
    """
    distances = []
    
    #["STATION", "LAT", "LON", "ELEVATION", "NAME"]
    #USC00010160    32.935  -85.95556   660     ALEXANDER CITY, AL US
    for index, row in df.iterrows():
        lat = row['LAT']
        lon = row['LON']
        distance = haversine_distance(target_lat, target_lon, lat, lon)
        distances.append((lat, lon, row['STATION'], row['ELEVATION'], row['NAME'], distance))

    distances.sort(key=lambda x: x[5])  # Sort by distance, which is 6th value, 5th index
    closest = distances[:num_results]
    #print("NOAA: ", closest)

    return closest


def inverse_dist_weights(closest_points_list):
    dist_values = [entry[-1] for entry in closest_points_list]
    # Squared to give increased weight to closest
    inverses = [(1 / value) ** 1 for value in dist_values]
    sum_inverses = sum(inverses)
    weights = [inverse / sum_inverses for inverse in inverses]
    
    return weights

'''
NWS STATIONS: Has information on the average wind speed, direction, gust and sunlight
NOAA STATIONS: Has all other information, including temperature, precip, snow

There are many more NOAA stations, with a much longer history for improved accuracy.
The NWS stations are used largely to get sunlight data. 

'''
def get_climate_avg_at_point(target_lat, target_lon, target_elevation, df_stations_NWS, df_stations_NOAA):
    
    # Get closest points to coordinate
    closest_points_NWS = nearest_coordinates_to_point_NWS(target_lat, target_lon, df_stations_NWS)
    closest_points_NOAA = nearest_coordinates_to_point_NOAA(target_lat, target_lon, df_stations_NOAA)

    # Compute inverse weighted average so closest distance has most weight
    weights_NWS = inverse_dist_weights(closest_points_NWS)
    weights_NOAA = inverse_dist_weights(closest_points_NOAA)

    #print("NWS WEIGHTS: ", weights_NWS)
    print("NOAA WEIGHTS: ", weights_NOAA)


    

    nws_annual_metrics = {
        'annual_wind_avg': [],
        'annual_wind_gust_avg': [],
        'annual_sunshine_avg': [],
        'annual_wind_dir_avg': [],

    }

    noaa_annual_metrics = {
        'annual_high_avg': [],
        'annual_low_avg': [],
        'annual_mean_avg': [],
        'annual_mean_maximum': [],
        'annual_record_high': [],
        'annual_mean_minimum': [],
        'annual_record_low': [],
        'annual_HDD_avg': [],
        'annual_CDD_avg': [],
        'annual_precip_avg': [],
        'annual_snow_avg': [],
        'annual_snow_depth_avg': [],
        'annual_precip_days_avg': [],
        'annual_snow_days_avg': [],
        'annual_dewpoint_avg': [],
        'annual_humidity_avg': [],
        'annual_frost_free_days_avg':[],
    }

    nws_monthly_metrics = {
        'monthly_wind_avg': [],
        'monthly_wind_gust_avg': [],
        'monthly_sunshine_avg': [],
        'monthly_wind_dir_avg': [],

    }

    noaa_monthly_metrics = {
        'monthly_record_high': [],
        'monthly_mean_maximum': [],
        'monthly_high_avg': [],
        'monthly_mean_avg': [],
        'monthly_low_avg': [],
        'monthly_mean_minimum': [],
        'monthly_record_low': [],
        'monthly_HDD_avg': [],
        'monthly_CDD_avg': [],
        'monthly_precip_avg': [],
        'monthly_snow_avg': [],
        'monthly_precip_days_avg': [],
        'monthly_snow_days_avg': [],
        'monthly_dewpoint_avg':[],
        'monthly_humidity_avg':[],
        'monthly_frost_free_days_avg':[],

    }

    # Get the annual weather for each location
    nws_station_identifiers = [(entry[2],entry[3]) for entry in closest_points_NWS]

    start_time = time.time()  # Start timer

    for NWS_PROVIDER, CITY_CODE in nws_station_identifiers:
        df, num_entries = df_from_NWS_csv(NWS_PROVIDER, CITY_CODE)

        #TODO Average Wind values apear to be off, close to zero
        
        nws_annual_metrics['annual_wind_avg'].append(df.loc[:, 'AVG SPD'].mean())
        nws_annual_metrics['annual_wind_gust_avg'].append(df.loc[:, 'MAX SPD'].mean())

        #TODO in some situations if the sun data is missing, such as in SF, readings can be way off
        # If large majority of days missing, maybe look to other station with lower weight
        nws_annual_metrics['annual_sunshine_avg'].append(1 - (df.loc[df['S-S'] > 0, 'S-S'].sum() / (num_entries / 12)) / 3650)
        nws_annual_metrics['annual_wind_dir_avg'].append(df.loc[:, 'DR'].mean())
        

        months_arr = {
            'wind_avg': [],
            'wind_gust_avg': [],
            'sunshine_avg': [],
            'wind_dir_avg': [],
        }

        months_index_str = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        for month in months_index_str:
            months_arr['wind_avg'].append(df.loc[df['MONTH'] == month, 'AVG SPD'].mean() if not pd.isna(df.loc[df['MONTH'] == month, 'AVG SPD'].mean()) else 0)
            months_arr['wind_gust_avg'].append(df.loc[df['MONTH'] == month, 'MAX SPD'].mean() if not pd.isna(df.loc[df['MONTH'] == month, 'MAX SPD'].mean()) else 0)
            months_arr['sunshine_avg'].append(1 - (df.loc[(df['MONTH'] == month) & (df['S-S'] > 0), 'S-S'].sum()/len(nws_station_identifiers)/300))
            months_arr['wind_dir_avg'].append(df.loc[df['MONTH'] == month, 'DR'].mean() if not pd.isna(df.loc[df['MONTH'] == month, 'DR'].mean()) else 0)
        
        nws_monthly_metrics['monthly_wind_avg'].append(months_arr['wind_avg'])
        nws_monthly_metrics['monthly_wind_gust_avg'].append(months_arr['wind_gust_avg'])
        nws_monthly_metrics['monthly_sunshine_avg'].append(months_arr['sunshine_avg'])
        nws_monthly_metrics['monthly_wind_dir_avg'].append(months_arr['wind_dir_avg'])
    
    print("NWS Elapsed Time:", time.time() - start_time, "seconds")

    start_time = time.time()  # Start timer

    for station in closest_points_NOAA:
        # Correctly reassemble file name from closest points parameters
        file_name = station[2] + "_" + str(station[0]) + "_" + str(station[1]) + "_" + str(round(station[3])) + "_" + station[4] + ".csv"
        df = get_NOAA_csv_content(file_name, '2000-01-01', '2019-04-01')
        days = abs(calculate_days_from_reference('2000-01-01', '2019-04-01'))

        #Units are in tenths of degrees C, so divide by 9/50 instead of 9/5
        noaa_annual_metrics['annual_record_high'].append((df["TMAX"].quantile(1) * 9/50) + 32)
        noaa_annual_metrics['annual_mean_maximum'].append((df["TMAX"].quantile(.95) * 9/50) + 32)
        noaa_annual_metrics['annual_high_avg'].append((df["TMAX"].mean() * 9/50) + 32)
        noaa_annual_metrics['annual_mean_avg'].append((df["TAVG"].mean() * 9/50) + 32)
        noaa_annual_metrics['annual_low_avg'].append((df["TMIN"].mean() * 9/50) + 32)
        noaa_annual_metrics['annual_mean_minimum'].append((df["TMIN"].quantile(.05) * 9/50) + 32)
        noaa_annual_metrics['annual_record_low'].append((df["TMIN"].quantile(0) * 9/50) + 32)
        noaa_annual_metrics['annual_HDD_avg'].append((df["HDD"].sum() /(days / 365.25)))
        noaa_annual_metrics['annual_CDD_avg'].append((df["CDD"].sum() /(days / 365.25)))
        noaa_annual_metrics['annual_precip_avg'].append((df["PRCP"].mean() / 254 * 365.25))
        noaa_annual_metrics['annual_snow_avg'].append((df["SNOW"].mean() / 25.4 * 365.25) if not pd.isna(df["SNOW"].mean()) else 0)
        noaa_annual_metrics['annual_precip_days_avg'].append(round((df.loc[df['PRCP'] > 0.01, 'PRCP'].count() /(days / 365.25))))
        noaa_annual_metrics['annual_snow_days_avg'].append(round((df.loc[df['SNOW'] > 0.01, 'SNOW'].count() /(days / 365.25))))
        noaa_annual_metrics['annual_frost_free_days_avg'].append(round((df.loc[df['TMIN'] > 0, 'TMIN'].count() /(days / 365.25))))

        dewpoint = humidity_regr_from_temp_max_min([((df["TMAX"].mean() * 9/50) + 32)], [((df["TMIN"].mean() * 9/50) + 32)], [((df["PRCP"].mean() / 254 * 365.25)/12)])
        noaa_annual_metrics['annual_dewpoint_avg'].append(round(dewpoint[0]))
        noaa_annual_metrics['annual_humidity_avg'].append(round(calculate_humidity_percentage(dewpoint, [((df["TAVG"].mean() * 9/50) + 32)] )[0]))

        months_arr = {
            'high_avg': [],
            'low_avg': [],
            'mean_avg': [],
            'mean_maximum': [],
            'record_high': [],
            'mean_minimum': [],
            'record_low': [],
            'HDD_avg': [],
            'CDD_avg': [],
            'precip_avg': [],
            'snow_avg': [],
            'snow_depth_avg': [],
            'precip_days_avg': [],
            'snow_days_avg': [],
            'frost_free_days_avg': []

        }

        for month in range(1, 13):
            # Filter the DataFrame for the specific month
            month_df = df[df['DATE'].dt.month == month]
            num_days = int(pd.DatetimeIndex(month_df['DATE']).days_in_month[0])
            months_arr['record_high'].append((month_df["TMAX"].quantile(1)* 9/50) + 32)
            months_arr['mean_maximum'].append((month_df["TMAX"].quantile(.95)* 9/50) + 32)
            months_arr['high_avg'].append((month_df["TMAX"].mean()* 9/50) + 32)
            months_arr['mean_avg'].append((month_df["TAVG"].mean()* 9/50) + 32)
            months_arr['low_avg'].append((month_df["TMIN"].mean()* 9/50) + 32)
            months_arr['mean_minimum'].append((month_df["TMIN"].quantile(.05)* 9/50) + 32)
            months_arr['record_low'].append((month_df["TMIN"].quantile(0)* 9/50) + 32)
            months_arr['HDD_avg'].append((month_df["HDD"].sum() /num_days))
            months_arr['CDD_avg'].append((month_df["CDD"].sum() /num_days))
            months_arr['precip_avg'].append((month_df["PRCP"].mean() / 254 * num_days))

            # Sometimes nan values would apear and break the json request, preventing marker from being placed
            # This converts any nan values to 0
            months_arr['snow_avg'].append((month_df["SNOW"].mean() / 25.4 * num_days) if not pd.isna(month_df["SNOW"].mean()) else 0)
            months_arr['precip_days_avg'].append(round((month_df.loc[month_df['PRCP'] > 0.01, 'PRCP'].count() / num_days),0))
            months_arr['snow_days_avg'].append(round((month_df.loc[month_df['SNOW'] > 0.01, 'SNOW'].count() / num_days),0))
            
            #TODO this might not be returning correct number of days
            months_arr['frost_free_days_avg'].append(round((month_df.loc[month_df['TMIN'] > 0, 'TMIN'].count() /len(month_df)),0))

        

    
        noaa_monthly_metrics['monthly_record_high'].append(months_arr['record_high'])
        noaa_monthly_metrics['monthly_mean_maximum'].append(months_arr['mean_maximum'])
        noaa_monthly_metrics['monthly_high_avg'].append(months_arr['high_avg'])
        noaa_monthly_metrics['monthly_mean_avg'].append(months_arr['mean_avg'])
        noaa_monthly_metrics['monthly_low_avg'].append(months_arr['low_avg'])
        noaa_monthly_metrics['monthly_mean_minimum'].append(months_arr['mean_minimum'])
        noaa_monthly_metrics['monthly_record_low'].append(months_arr['record_low'])
        noaa_monthly_metrics['monthly_HDD_avg'].append(months_arr['HDD_avg'])
        noaa_monthly_metrics['monthly_CDD_avg'].append(months_arr['CDD_avg'])
        noaa_monthly_metrics['monthly_precip_avg'].append(months_arr['precip_avg'])
        noaa_monthly_metrics['monthly_snow_avg'].append(months_arr['snow_avg'])
        noaa_monthly_metrics['monthly_precip_days_avg'].append(months_arr['precip_days_avg'])
        noaa_monthly_metrics['monthly_snow_days_avg'].append(months_arr['snow_days_avg'])
        noaa_monthly_metrics['monthly_frost_free_days_avg'].append(months_arr['frost_free_days_avg'])

        dewpoints = humidity_regr_from_temp_max_min(months_arr['high_avg'], months_arr['low_avg'], months_arr['precip_avg'])
        noaa_monthly_metrics['monthly_dewpoint_avg'].append(dewpoints)
        noaa_monthly_metrics['monthly_humidity_avg'].append(calculate_humidity_percentage(dewpoints, months_arr['mean_avg']))

    print("NOAA Elapsed Time:", time.time() - start_time, "seconds")

    start_time = time.time()  # Start timer

    nws_annual_weighted_metrics = {}
    nws_monthly_weighted_metrics = {}
    noaa_annual_weighted_metrics = {}
    noaa_monthly_weighted_metrics = {}
    # Computes the weighted average value for each key.
    '''
    If station weights were .5, .3, .15, .05 then the values would be multiplied and summed by those values
    Generating a weighted averaged value of the cooresponding stations, weighted by distance.

    In short, the methods bellow combine all querried stations into one result, with respective weights 
    '''
    for key in nws_annual_metrics:
        nws_annual_weighted_metrics[key] = sum(value * weight for value, weight in zip(nws_annual_metrics[key], weights_NWS))
    for key in noaa_annual_metrics:
        noaa_annual_weighted_metrics[key] = sum(value * weight for value, weight in zip(noaa_annual_metrics[key], weights_NOAA))

    for key in nws_monthly_metrics:
        weighted_list = []
        for month_num in range(12):
            weighted_value = 0
            for i in range(len(weights_NWS)):
                weighted_value += nws_monthly_metrics[key][i][month_num] * weights_NWS[i]
            weighted_list.append(weighted_value)
        nws_monthly_weighted_metrics[key] = weighted_list
        

    for key in noaa_monthly_metrics:
        weighted_list = []
        for month_num in range(12):
            weighted_value = 0
            for i in range(len(weights_NOAA)):
                weighted_value += noaa_monthly_metrics[key][i][month_num] * weights_NOAA[i]
            weighted_list.append(weighted_value)
        noaa_monthly_weighted_metrics[key] = weighted_list
        


    
    # Compute difference between average weighted elevation
    # Example Index for entry: 39.4607, -105.6785, 'USC00053530', 8673.0, 'GRANT, CO US', 3.4029709128638763)
    elev_values = [entry[3] for entry in closest_points_NOAA]
    average_weighted_elev = sum(elevation * weight for elevation, weight in zip(elev_values, weights_NOAA))
    target_dif_elev = target_elevation - average_weighted_elev

    
    '''
    Generate annual weather for new point given weighted averages
    Perform adjustments using elevation difference
    Temperature drops by constant amount for elevation gained, varies based on cloudiness
    With no clouds, temperature drops by 5.5 degrees per 1000ft, 3 degrees with 100% cloud
    '''
    
    ELEV_TEMP_CHANGE = 5.5
    temp_adj = max(ELEV_TEMP_CHANGE * nws_annual_weighted_metrics['annual_sunshine_avg'],3) * (target_dif_elev / 1000)
    temp_adj_monthly = [max(ELEV_TEMP_CHANGE * sunshine, 3) * (target_dif_elev / 1000) for sunshine in nws_monthly_weighted_metrics['monthly_sunshine_avg']]
    annual_values = {}
    monthly_values = {}
    location_values = {}

    #TODO add temperature adjustment to frost free days, HDD, CDD calculations
    
    annual_values['weighted_annual_high_avg'] = noaa_annual_weighted_metrics['annual_high_avg'] - temp_adj
    annual_values['weighted_annual_low_avg'] = noaa_annual_weighted_metrics['annual_low_avg'] - temp_adj
    annual_values['weighted_annual_mean_avg'] = noaa_annual_weighted_metrics['annual_mean_avg'] - temp_adj
    annual_values['weighted_annual_mean_maximum'] = noaa_annual_weighted_metrics['annual_mean_maximum'] - temp_adj
    annual_values['weighted_annual_record_high'] = noaa_annual_weighted_metrics['annual_record_high'] - temp_adj
    annual_values['weighted_annual_mean_minimum'] = noaa_annual_weighted_metrics['annual_mean_minimum'] - temp_adj
    annual_values['weighted_annual_record_low'] = noaa_annual_weighted_metrics['annual_record_low'] - temp_adj
    annual_values['weighted_annual_HDD_avg'] = noaa_annual_weighted_metrics['annual_HDD_avg']
    annual_values['weighted_annual_CDD_avg'] = noaa_annual_weighted_metrics['annual_CDD_avg']
    annual_values['weighted_annual_precip_avg'] = noaa_annual_weighted_metrics['annual_precip_avg']
    annual_values['weighted_annual_snow_avg'] = noaa_annual_weighted_metrics['annual_snow_avg']
    annual_values['weighted_annual_snow_depth_avg'] = noaa_annual_weighted_metrics['annual_snow_depth_avg']
    annual_values['weighted_annual_precip_days_avg'] = noaa_annual_weighted_metrics['annual_precip_days_avg']
    annual_values['weighted_annual_snow_days_avg'] = noaa_annual_weighted_metrics['annual_snow_days_avg']
    annual_values['weighted_annual_frost_free_days_avg'] = noaa_annual_weighted_metrics['annual_frost_free_days_avg']

    annual_values['weighted_annual_dewpoint_avg'] = noaa_annual_weighted_metrics['annual_dewpoint_avg'] - temp_adj
    annual_values['weighted_annual_humidity_avg'] = noaa_annual_weighted_metrics['annual_humidity_avg']

    annual_values['weighted_annual_wind_avg'] = nws_annual_weighted_metrics['annual_wind_avg']
    annual_values['weighted_annual_wind_gust_avg'] = nws_annual_weighted_metrics['annual_wind_gust_avg']
    annual_values['weighted_annual_sunshine_avg'] = nws_annual_weighted_metrics['annual_sunshine_avg']
    annual_values['weighted_annual_wind_dir_avg'] = nws_annual_weighted_metrics['annual_wind_dir_avg']
    
    monthly_values = {
    'weighted_monthly_high_avg': [noaa_monthly_weighted_metrics['monthly_high_avg'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_low_avg': [noaa_monthly_weighted_metrics['monthly_low_avg'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_mean_avg': [noaa_monthly_weighted_metrics['monthly_mean_avg'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_mean_maximum': [noaa_monthly_weighted_metrics['monthly_mean_maximum'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_record_high': [noaa_monthly_weighted_metrics['monthly_record_high'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_mean_minimum': [noaa_monthly_weighted_metrics['monthly_mean_minimum'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_record_low': [noaa_monthly_weighted_metrics['monthly_record_low'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_dewpoint_avg': [noaa_monthly_weighted_metrics['monthly_dewpoint_avg'][i] - temp_adj_monthly[i] for i in range(12)],

    }

    monthly_values['weighted_monthly_HDD_avg'] = noaa_monthly_weighted_metrics['monthly_HDD_avg']
    monthly_values['weighted_monthly_CDD_avg'] = noaa_monthly_weighted_metrics['monthly_CDD_avg']
    monthly_values['weighted_monthly_precip_avg'] = noaa_monthly_weighted_metrics['monthly_precip_avg']
    monthly_values['weighted_monthly_snow_avg'] = noaa_monthly_weighted_metrics['monthly_snow_avg']
    monthly_values['weighted_monthly_precip_days_avg'] = noaa_monthly_weighted_metrics['monthly_precip_days_avg']
    monthly_values['weighted_monthly_snow_days_avg'] = noaa_monthly_weighted_metrics['monthly_snow_days_avg']
    monthly_values['weighted_monthly_frost_free_days_avg'] = noaa_monthly_weighted_metrics['monthly_frost_free_days_avg']
    monthly_values['weighted_monthly_humidity_avg'] = noaa_monthly_weighted_metrics['monthly_humidity_avg']
 
    monthly_values['weighted_monthly_wind_avg'] = nws_monthly_weighted_metrics['monthly_wind_avg']
    monthly_values['weighted_monthly_wind_gust_avg'] = nws_monthly_weighted_metrics['monthly_wind_gust_avg']
    monthly_values['weighted_monthly_sunshine_avg'] = nws_monthly_weighted_metrics['monthly_sunshine_avg']
    monthly_values['weighted_monthly_wind_dir_avg'] = nws_monthly_weighted_metrics['monthly_wind_dir_avg']

    location_values['elevation'] = target_elevation
    print("Remainder Elapsed Time:", time.time() - start_time, "seconds")

    return annual_values, monthly_values, location_values



def main():
    df_stations = pd.read_csv('lat_lon_identifier_elev_name.csv')

    #Crashes when using elevaetion point in ocean
    target_coordinates = (37.938259402679584, -107.11396906315399)
    

    




if __name__ == '__main__':
    #main()
    pass