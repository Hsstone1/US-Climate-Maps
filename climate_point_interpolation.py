import pandas as pd
import requests
import urllib
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
from read_from_csv_to_dataframe import df_from_NWS_csv, get_NOAA_csv_content, humidity_regr_from_temp_max_min
import time
import ephem
from datetime import datetime
import calendar

DAYS_IN_MONTH = 30.417

#https://en.wikipedia.org/wiki/K%C3%B6ppen_climate_classification#Overview
def calculate_koppen_climate(temp_f, precip_in):
    avg_month_precip_mm = [value * 25.4 for value in precip_in]
    avg_month_temp_c = [(value-32) * (5/9) for value in temp_f]
    annual_temp_c = sum(avg_month_temp_c) / len(avg_month_temp_c)
    annual_precipitation_mm = sum(avg_month_precip_mm)
    driest_month_precip_mm = min(avg_month_precip_mm)
    #These indicies only work for the norther hemisphere, need to be reversed for southern
    warm_month_indices = [3,4,5,6,7,8]
    cold_month_indices = [0,1,2,9,10,11]
    sum_precipitation_warm = sum(avg_month_precip_mm[idx] for idx in warm_month_indices)
    sum_precipitation_cold = sum(avg_month_precip_mm[idx] for idx in cold_month_indices)
    percent_precip_warm = sum_precipitation_warm / annual_precipitation_mm
    percent_precip_cold = sum_precipitation_cold / annual_precipitation_mm
    threshold_mm = annual_temp_c * 20
    threshold_mm += 280 if percent_precip_warm > 0.7 else (140 if (0.3 < percent_precip_warm < 0.7) else 0)


    #Koppen type A, Tropical
    if min(avg_month_temp_c) >= 18:
        print("TYPE A")
        if driest_month_precip_mm >= 60:
            return 'Af (Tropical rainforest climate)'
        elif driest_month_precip_mm < 60 and driest_month_precip_mm >= 100 - (annual_precipitation_mm / 25):
            return 'Am (Tropical monsoon climate)'
        elif driest_month_precip_mm < 60 and driest_month_precip_mm < 100 - (annual_precipitation_mm / 25):
            return 'Aw (Tropical savanna climate)'
        
    
    
    #Koppen type C, Temperate
    elif min(avg_month_temp_c) > 0 and min(avg_month_temp_c) < 18 and max(avg_month_temp_c) > 10 and annual_precipitation_mm > .5 * threshold_mm:
        print("TYPE C")
        #Subtropical
        if percent_precip_warm > .7:
            if max(avg_month_temp_c) > 22 and max(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Cwa (Monsoon humid subtropical climate)'
            elif max(avg_month_temp_c) < 22 and max(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Cwb (Subtropical highland climate)'
            elif max(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Cwc (Cold subtropical highland climate)'
        
        #Mediterranean
        if percent_precip_cold > .7 and driest_month_precip_mm < 40:
            if max(avg_month_temp_c) > 22 and max(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Csa (Hot-summer Mediterranean climate)'
            elif max(avg_month_temp_c) < 22 and max(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Csb (Warm-summer Mediterranean climate)'
            elif max(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Csc (Cold-summer Mediterranean climate)'

        #Oceanic 
        if max(avg_month_temp_c) > 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
            return 'Cfa (Humid subtropical climate)'
        #Maybe add elevation check to set subtropical highland climate instead of oceanic
        elif max(avg_month_temp_c) < 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
            return 'Cfb (Temperate oceanic climate)'
        elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
            return 'Cfc (Subpolar oceanic climate)'
        
    #Koppen type D, Continental
    elif max(avg_month_temp_c) > 10 and min(avg_month_temp_c) < 0 and annual_precipitation_mm > .5 * threshold_mm:
        print("TYPE D")
        #Monsoon
        if percent_precip_warm > .7:
            if max(avg_month_temp_c) > 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Dwa (Monsoon Hot-summer humid continental climate)'
            elif max(avg_month_temp_c) < 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Dfb (Monsoon Warm-summer humid continental climate)'
            elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Dfc (Monsoon Subarctic climate)'
            elif min(avg_month_temp_c) < -38 and min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Dfd (Monsoon Extremely cold subarctic climate)'
        
        #Mediterranean
        if percent_precip_cold > .7 and driest_month_precip_mm < 30:
            if max(avg_month_temp_c) > 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Dsa (Mediterranean hot-summer humid continental climate)'
            elif max(avg_month_temp_c) < 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Dsb (Mediterranean warm-summer humid continental climate)'
            elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Dsc (Mediterranean Subarctic climate)'
            elif min(avg_month_temp_c) < -38 and min(get_highest_N_values(avg_month_temp_c, 3)) > 10:
                return 'Dsd (Mediterranean Extremely cold subarctic climate)'
        
        if max(avg_month_temp_c) > 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
            return 'Dfa (Hot-summer humid continental climate)'
        elif max(avg_month_temp_c) < 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
            return 'Dfb (Warm-summer humid continental climate)'
        elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
            return 'Dfc (Subarctic climate)'
        elif min(avg_month_temp_c) < -38 and min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
            return 'Dfd (Extremely cold subarctic climate)'
    
    #Koppen type B, Semi-arid
    elif max(avg_month_temp_c) > 10:
        print("TYPE B")

        if annual_precipitation_mm < .5 * threshold_mm:
            if min(avg_month_temp_c) > 0:
                return 'BWh (Hot desert climate)'
            else:
                return 'BWk (Cold desert climate)'
        else:
            if min(avg_month_temp_c) > 0:
                return 'BSh (Hot semi-arid climate)'
            else:
                return 'BSk (Cold semi-arid climate)'


    #Koppen type E, Tundra
    elif max(avg_month_temp_c) < 10:
        print("TYPE E")
        if max(avg_month_temp_c) > 0:
            return 'ET (Alpine tundra climate)'
        else:
            return 'EF (Ice cap climate)'
        
    else:
        return 'Unknown climate type'
    

def calc_plant_hardiness(mean_annual_min):
    hardiness_zones = {
    0: [('a', float('-inf'), -65), ('b', -65, -60)],
    1: [('a', -60, -55), ('b', -55, -50)],
    2: [('a', -50, -45), ('b', -45, -40)],
    3: [('a', -40, -35), ('b', -35, -30)],
    4: [('a', -30, -25), ('b', -25, -20)],
    5: [('a', -20, -15), ('b', -15, -10)],
    6: [('a', -10, -5), ('b', -5, 0)],
    7: [('a', 0, 5), ('b', 5, 10)],
    8: [('a', 10, 15), ('b', 15, 20)],
    9: [('a', 20, 25), ('b', 25, 30)],
    10: [('a', 30, 35), ('b', 35, 40)],
    11: [('a', 40, 45), ('b', 45, 50)],
    12: [('a', 50, 55), ('b', 55, 60)],
    13: [('a', 60, 65), ('b', 65, float('inf'))]
    }

    zone = None
    for key, values in hardiness_zones.items():
        for value in values:
            if value[1] <= mean_annual_min < value[2]:
                zone = f"{key}{value[0]}"
                break
    return zone
    
    
def get_highest_N_values(values, numValues):
    return sorted(values, reverse=True)[:numValues]
        
def calculate_daylight_length(latitude, year):
    daylight_lengths = []

    for month in range(1, 13):  # Iterate over each month
        # Set the observer's latitude
        observer = ephem.Observer()
        observer.lat = str(latitude)

        # Set the date to the 21st day of the month
        date_str = f"{year}/{month}/21"
        observer.date = ephem.Date(date_str)

        # Get the sunrise and sunset times
        sun = ephem.Sun()
        sunrise = observer.previous_rising(sun)
        sunset = observer.next_setting(sun)

        # Calculate the daylight length
        daylight_length = sunset - sunrise - 1

        # Convert the daylight length to hours, minutes, and seconds
        daylight_hours = daylight_length * 24
        daylight_minutes = daylight_hours * 60
        daylight_seconds = daylight_minutes * 60
        monthly_hours = daylight_hours * DAYS_IN_MONTH 

        daylight_lengths.append((monthly_hours))

    return daylight_lengths


def calculate_frost_free_chance(value):
    maxVal = 40
    if value >= maxVal:
        return 1
    elif value <= 32:
        return 0
    else:
        return (value - 32) / (maxVal - 32) * 1

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


def nearest_coordinates_to_point_NWS(target_lat, target_lon, df, num_results=5):
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
    inverses = [(1 / value) ** 0.5 for value in dist_values]
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



    nws_monthly_metrics = {
        'monthly_wind_avg': [],
        'monthly_wind_gust_avg': [],
        'monthly_sunshine_avg': [],
        'monthly_wind_dir_avg': [],
        'monthly_wind_gust_peak': [],

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


        months_arr = {
            'wind_avg': [],
            'wind_gust_avg': [],
            'sunshine_avg': [],
            'wind_dir_avg': [],
            'wind_gust_peak': [],
        }

        months_index_str = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        for month in months_index_str:
            months_arr['wind_avg'].append(df.loc[df['MONTH'] == month, 'AVG SPD'].mean() if not pd.isna(df.loc[df['MONTH'] == month, 'AVG SPD'].mean()) else 0)
            months_arr['wind_gust_avg'].append(df.loc[df['MONTH'] == month, 'MAX SPD'].mean() if not pd.isna(df.loc[df['MONTH'] == month, 'MAX SPD'].mean()) else 0)
            months_arr['sunshine_avg'].append(1 - (df.loc[(df['MONTH'] == month) & (df['S-S'] > 0), 'S-S'].sum()/len(nws_station_identifiers)/(DAYS_IN_MONTH * 10)))
            months_arr['wind_dir_avg'].append(df.loc[df['MONTH'] == month, 'DR'].mean() if not pd.isna(df.loc[df['MONTH'] == month, 'DR'].mean()) else 0)
            months_arr['wind_gust_peak'].append(df.loc[df['MONTH'] == month, 'MAX SPD'].quantile(.99) if not pd.isna(df.loc[df['MONTH'] == month, 'MAX SPD'].quantile(.99)) else 0)

        nws_monthly_metrics['monthly_wind_avg'].append(months_arr['wind_avg'])
        nws_monthly_metrics['monthly_wind_gust_avg'].append(months_arr['wind_gust_avg'])
        nws_monthly_metrics['monthly_sunshine_avg'].append(months_arr['sunshine_avg'])
        nws_monthly_metrics['monthly_wind_dir_avg'].append(months_arr['wind_dir_avg'])
        nws_monthly_metrics['monthly_wind_gust_peak'].append(months_arr['wind_gust_peak'])
    
    print("NWS Elapsed Time:", time.time() - start_time, "seconds")

    start_time = time.time()  # Start timer

    for station in closest_points_NOAA:
        # Correctly reassemble file name from closest points parameters
        file_name = station[2] + "_" + str(station[0]) + "_" + str(station[1]) + "_" + str(round(station[3])) + "_" + station[4] + ".csv"
        df = get_NOAA_csv_content(file_name, '2000-01-01', '2019-04-01')
        days = abs(calculate_days_from_reference('2000-01-01', '2019-04-01'))

        #Units are in tenths of degrees C, so divide by 9/50 instead of 9/5
        
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
            'frost_free_days_avg': [],

        }

        for month in range(1, 13):
            # Filter the DataFrame for the specific month
            month_df = df[df['DATE'].dt.month == month]
            num_days = int(pd.DatetimeIndex(month_df['DATE']).days_in_month[0])
            months_arr['record_high'].append((month_df["TMAX"].quantile(1)* 9/50) + 32)
            months_arr['mean_maximum'].append((month_df["TMAX"].quantile(.9)* 9/50) + 32)
            months_arr['high_avg'].append((month_df["TMAX"].mean()* 9/50) + 32)
            months_arr['mean_avg'].append((month_df["TAVG"].mean()* 9/50) + 32)
            months_arr['low_avg'].append((month_df["TMIN"].mean()* 9/50) + 32)
            months_arr['mean_minimum'].append((month_df["TMIN"].quantile(.1)* 9/50) + 32)
            months_arr['record_low'].append((month_df["TMIN"].quantile(0)* 9/50) + 32)
            months_arr['HDD_avg'].append((month_df["HDD"].sum() /num_days))
            months_arr['CDD_avg'].append((month_df["CDD"].sum() /num_days))
            months_arr['precip_avg'].append((month_df["PRCP"].mean() / 254 * num_days))
            months_arr['snow_avg'].append((month_df["SNOW"].mean() / 25.4 * num_days) if not pd.isna(month_df["SNOW"].mean()) else 0)
            months_arr['precip_days_avg'].append(round((month_df.loc[month_df['PRCP'] > 0.01, 'PRCP'].count() / num_days),0))
            months_arr['snow_days_avg'].append(round((month_df.loc[month_df['SNOW'] > 0.1, 'SNOW'].count() / num_days),0))


            # Value is squared to simulate the increased risk of frost when the value count
            # has some values bellow 0
            result = (month_df.loc[month_df['TMIN'] >= 0, 'TMIN'].count() /(len(month_df)))
            frost_free_days = result = 0 if result < 0.15 else 1 if result > 0.85 else result
            frost_free_days = frost_free_days ** 2 
            months_arr['frost_free_days_avg'].append(frost_free_days)
        

    
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


    nws_monthly_weighted_metrics = {}
    noaa_monthly_weighted_metrics = {}
    # Computes the weighted average value for each key.
    '''
    If station weights were .5, .3, .15, .05 then the values would be multiplied and summed by those values
    Generating a weighted averaged value of the cooresponding stations, weighted by distance.

    In short, the methods bellow combine all querried stations into one result, with respective weights 
    '''

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
    temp_adj_monthly = [max(ELEV_TEMP_CHANGE * sunshine, 3) * (target_dif_elev / 1000) for sunshine in nws_monthly_weighted_metrics['monthly_sunshine_avg']]
    precip_adjust_elev = min((1 + (target_dif_elev / 1000) * 0.2),2)
    annual_values = {}
    monthly_values = {}
    location_values = {}
    print("ELEVATION ADJUST: ", target_dif_elev)



    #This attempts to adjust for elevation differences, by using how sunny a location is
    #Precipitation is also adjusted to increase 20% for every 1000 feet increase.
    #Meaning a 4000 feet yields 100% increase
    monthly_values = {
    'weighted_monthly_high_avg': [noaa_monthly_weighted_metrics['monthly_high_avg'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_low_avg': [noaa_monthly_weighted_metrics['monthly_low_avg'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_mean_avg': [noaa_monthly_weighted_metrics['monthly_mean_avg'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_mean_maximum': [noaa_monthly_weighted_metrics['monthly_mean_maximum'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_record_high': [noaa_monthly_weighted_metrics['monthly_record_high'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_mean_minimum': [noaa_monthly_weighted_metrics['monthly_mean_minimum'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_record_low': [noaa_monthly_weighted_metrics['monthly_record_low'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_dewpoint_avg': [noaa_monthly_weighted_metrics['monthly_dewpoint_avg'][i] - temp_adj_monthly[i] for i in range(12)],
    'weighted_monthly_HDD_avg': [max(noaa_monthly_weighted_metrics['monthly_HDD_avg'][i] + temp_adj_monthly[i] * DAYS_IN_MONTH, 0) for i in range(12)],
    'weighted_monthly_CDD_avg': [max(noaa_monthly_weighted_metrics['monthly_CDD_avg'][i] - temp_adj_monthly[i] * DAYS_IN_MONTH, 0) for i in range(12)],
    'weighted_monthly_precip_avg':[noaa_monthly_weighted_metrics['monthly_precip_avg'][i] * precip_adjust_elev for i in range(12)],
    #'weighted_monthly_snow_avg':[noaa_monthly_weighted_metrics['monthly_snow_avg'][i] * precip_adjust_elev for i in range(12)],
    'weighted_monthly_precip_days_avg':[noaa_monthly_weighted_metrics['monthly_precip_days_avg'][i] * (1 + (target_dif_elev / 1000) * 0.05) for i in range(12)],
    #'weighted_monthly_snow_days_avg':[noaa_monthly_weighted_metrics['monthly_snow_days_avg'][i] * (1 + (target_dif_elev / 1000) * 0.1) for i in range(12)],

    }

    

    #monthly_values['weighted_monthly_precip_avg'] = noaa_monthly_weighted_metrics['monthly_precip_avg']
    monthly_values['weighted_monthly_snow_avg'] = noaa_monthly_weighted_metrics['monthly_snow_avg']
    #monthly_values['weighted_monthly_precip_days_avg'] = noaa_monthly_weighted_metrics['monthly_precip_days_avg']
    monthly_values['weighted_monthly_snow_days_avg'] = noaa_monthly_weighted_metrics['monthly_snow_days_avg']
    #print(monthly_values['weighted_monthly_snow_days_avg'])
    
    #TODO fix this, values are off
    for i in range(12):
        if monthly_values['weighted_monthly_mean_avg'][i] <= 32:
            monthly_values['weighted_monthly_snow_avg'][i] = monthly_values['weighted_monthly_precip_avg'][i] * 10
            monthly_values['weighted_monthly_snow_days_avg'][i] = monthly_values['weighted_monthly_precip_days_avg'][i]
            monthly_values['weighted_monthly_precip_days_avg'][i] = 0
        
        
    
    frost_free_normal =  [calculate_frost_free_chance(value) for value in monthly_values['weighted_monthly_low_avg']]
    frost_free_maxima =  [calculate_frost_free_chance(value) for value in monthly_values['weighted_monthly_mean_minimum']]
    frost_free_extreme = [calculate_frost_free_chance(value) for value in monthly_values['weighted_monthly_record_low']]
    frost_free_normal_maxima = [(normal + maxima) / 2 for normal, maxima in zip(frost_free_normal, frost_free_maxima)]
    frost_free_maxima_extreme = [(maxima + extreme) / 2 for maxima, extreme in zip(frost_free_maxima, frost_free_extreme )]

    monthly_values['weighted_monthly_frost_free_days_avg'] = [.4 *frost_free_normal[i] + .3 *frost_free_maxima[i] + .05 *frost_free_extreme[i] + .15 *frost_free_normal_maxima[i] + .1*frost_free_maxima_extreme[i] for i in range(12)]
    monthly_values['weighted_monthly_humidity_avg'] = noaa_monthly_weighted_metrics['monthly_humidity_avg']
 
    monthly_values['weighted_monthly_wind_avg'] = nws_monthly_weighted_metrics['monthly_wind_avg']
    monthly_values['weighted_monthly_wind_gust_avg'] = nws_monthly_weighted_metrics['monthly_wind_gust_avg']
    monthly_values['weighted_monthly_sunshine_avg'] = nws_monthly_weighted_metrics['monthly_sunshine_avg']
    monthly_values['weighted_monthly_sunshine_days_avg'] = [value * DAYS_IN_MONTH for value in nws_monthly_weighted_metrics['monthly_sunshine_avg']]
    monthly_values['weighted_monthly_wind_gust_peak'] = nws_monthly_weighted_metrics['monthly_wind_gust_peak']
    monthly_values['weighted_monthly_wind_dir_avg'] = nws_monthly_weighted_metrics['monthly_wind_dir_avg']
    
    monthly_values['monthly_daylight_hours_avg'] = calculate_daylight_length(target_lat, 2023)
    monthly_values['monthly_sunshine_hours_avg'] = [x * y for x, y in zip(monthly_values['monthly_daylight_hours_avg'], monthly_values['weighted_monthly_sunshine_avg'])]


    annual_values['weighted_annual_high_avg'] = sum(monthly_values['weighted_monthly_high_avg'])/12
    annual_values['weighted_annual_low_avg'] = sum(monthly_values['weighted_monthly_low_avg'])/12
    annual_values['weighted_annual_mean_avg'] = sum(monthly_values['weighted_monthly_mean_avg'])/12
    annual_values['weighted_annual_mean_maximum'] = max(monthly_values['weighted_monthly_mean_maximum'])
    annual_values['weighted_annual_record_high'] = max(monthly_values['weighted_monthly_record_high'])
    annual_values['weighted_annual_mean_minimum'] = min(monthly_values['weighted_monthly_mean_minimum'])
    annual_values['weighted_annual_record_low'] = min(monthly_values['weighted_monthly_record_low'])
    annual_values['weighted_annual_precip_avg'] = sum(monthly_values['weighted_monthly_precip_avg'])
    annual_values['weighted_annual_snow_avg'] = sum(monthly_values['weighted_monthly_snow_avg'])
    annual_values['weighted_annual_frost_free_days_avg'] = (sum(monthly_values['weighted_monthly_frost_free_days_avg'])/12)*365
    annual_values['weighted_annual_dewpoint_avg'] = sum(monthly_values['weighted_monthly_dewpoint_avg'])/12
    annual_values['weighted_annual_humidity_avg'] = sum(monthly_values['weighted_monthly_humidity_avg'])/12
    annual_values['weighted_annual_HDD_avg'] = sum(monthly_values['weighted_monthly_HDD_avg'])
    annual_values['weighted_annual_CDD_avg'] = sum(monthly_values['weighted_monthly_CDD_avg'])
    annual_values['weighted_annual_precip_days_avg'] = sum(monthly_values['weighted_monthly_precip_days_avg'])
    annual_values['weighted_annual_snow_days_avg'] = sum(monthly_values['weighted_monthly_snow_days_avg'])

    annual_values['weighted_annual_wind_avg'] = sum(monthly_values['weighted_monthly_wind_avg'])/12
    annual_values['weighted_annual_wind_gust_avg'] = sum(monthly_values['weighted_monthly_wind_gust_avg'])/12
    annual_values['weighted_annual_wind_dir_avg'] = sum(monthly_values['weighted_monthly_wind_dir_avg'])/12
    annual_values['weighted_annual_sunshine_avg'] = sum(monthly_values['weighted_monthly_sunshine_avg'])/12
    annual_values['weighted_annual_sunshine_days_avg'] = sum(monthly_values['weighted_monthly_sunshine_days_avg'])
    annual_values['weighted_annual_wind_gust_peak'] = max(monthly_values['weighted_monthly_wind_gust_peak'])
    annual_values['annual_daylight_hours_avg'] = sum(monthly_values['monthly_daylight_hours_avg'])
    annual_values['annual_sunshine_hours_avg'] = sum(monthly_values['monthly_sunshine_hours_avg'])
    
    
    
    location_values['elevation'] = target_elevation
    location_values['koppen'] = calculate_koppen_climate(monthly_values['weighted_monthly_mean_avg'], monthly_values['weighted_monthly_precip_avg'])
    location_values['plant_hardiness'] = calc_plant_hardiness(annual_values['weighted_annual_mean_minimum'])
    return annual_values, monthly_values, location_values
