import datetime
import math
import requests
import urllib
from math import radians, sin, cos, sqrt, atan2
import ephem
import datetime
import calendar
import numpy as np
from scipy.stats import norm



DAYS_IN_MONTH = 30.417
DAYS_IN_YEAR = 365.25

#These are default values, can be overloaded in the get_climate_avg_at_point function
NUM_NEAREST_STATIONS_NWS = 3
NUM_NEAREST_STATIONS_NOAA = 3
    

#https://en.wikipedia.org/wiki/K%C3%B6ppen_climate_classification#Overview
def calc_koppen_climate(temp_f, precip_in):
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


    # Koppen type A, Tropical
    if min(avg_month_temp_c) >= 18:
        #print("TYPE A")
        if driest_month_precip_mm >= 60:
            return 'Tropical rainforest climate (Af)'
        elif driest_month_precip_mm < 60 and driest_month_precip_mm >= 100 - (annual_precipitation_mm / 25):
            return 'Tropical monsoon climate (Am)'
        elif driest_month_precip_mm < 60 and driest_month_precip_mm < 100 - (annual_precipitation_mm / 25):
            return 'Tropical savanna climate (Aw)'
        else:
            return 'Tropical climate (A)'

    # Koppen type C, Temperate
    elif min(avg_month_temp_c) > 0 and min(avg_month_temp_c) < 18 and max(avg_month_temp_c) > 10 and annual_precipitation_mm > 0.5 * threshold_mm:
        #print("TYPE C")
        # Subtropical
        if percent_precip_warm > 0.7:
            if max(avg_month_temp_c) > 22 and max(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Monsoon humid subtropical climate (Cwa)'
            elif max(avg_month_temp_c) < 22 and max(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Subtropical highland climate (Cwb)'
            elif max(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Cold subtropical highland climate (Cwc)'
            else:
                return 'Subtropical climate (C)'

        # Mediterranean
        if percent_precip_cold > 0.7 and driest_month_precip_mm < 40:
            if max(avg_month_temp_c) > 22 and max(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Hot-summer Mediterranean climate (Csa)'
            elif max(avg_month_temp_c) < 22 and max(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Warm-summer Mediterranean climate (Csb)'
            elif max(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Cold-summer Mediterranean climate (Csc)'
            else:
                return 'Mediterranean climate (C)'

        # Oceanic
        if max(avg_month_temp_c) > 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
            return 'Humid subtropical climate (Cfa)'
        # Maybe add elevation check to set subtropical highland climate instead of oceanic
        elif max(avg_month_temp_c) < 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
            return 'Temperate oceanic climate (Cfb)'
        elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
            return 'Subpolar oceanic climate (Cfc)'
        else:
            return 'Oceanic climate (C)'

    # Koppen type D, Continental
    elif max(avg_month_temp_c) > 10 and min(avg_month_temp_c) < 0 and annual_precipitation_mm > 0.5 * threshold_mm:
        #print("TYPE D")
        # Monsoon
        if percent_precip_warm > 0.7:
            if max(avg_month_temp_c) > 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Monsoon Hot-summer humid continental climate (Dwa)'
            elif max(avg_month_temp_c) < 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Monsoon Warm-summer humid continental climate (Dfb)'
            elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Monsoon Subarctic climate (Dfc)'
            elif min(avg_month_temp_c) < -38 and min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Monsoon Extremely cold subarctic climate (Dfd)'
            else:
                return 'Monsoon climate (D)'

        # Mediterranean
        if percent_precip_cold > 0.7 and driest_month_precip_mm < 30:
            if max(avg_month_temp_c) > 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Mediterranean hot-summer humid continental climate (Dsa)'
            elif max(avg_month_temp_c) < 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
                return 'Mediterranean warm-summer humid continental climate (Dsb)'
            elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return 'Mediterranean Subarctic climate (Dsc)'
            elif min(avg_month_temp_c) < -38 and min(get_highest_N_values(avg_month_temp_c, 3)) > 10:
                return 'Mediterranean Extremely cold subarctic climate (Dsd)'
            else:
                return 'Mediterranean climate (D)'

        if max(avg_month_temp_c) > 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
            return 'Hot-summer humid continental climate (Dfa)'
        elif max(avg_month_temp_c) < 22 and min(get_highest_N_values(avg_month_temp_c, 4)) > 10:
            return 'Warm-summer humid continental climate (Dfb)'
        elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
            return 'Subarctic climate (Dfc)'
        elif min(avg_month_temp_c) < -38 and min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
            return 'Extremely cold subarctic climate (Dfd)'
        else:
            return 'Continental climate (D)'

    # Koppen type B, Semi-arid
    elif max(avg_month_temp_c) > 10:
        #print("TYPE B")

        if annual_precipitation_mm < 0.5 * threshold_mm:
            if min(avg_month_temp_c) > 0:
                return 'Hot desert climate (BWh)'
            else:
                return 'Cold desert climate (BWk)'
        else:
            if min(avg_month_temp_c) > 0:
                return 'Hot semi-arid climate (BSh)'
            else:
                return 'Cold semi-arid climate (BSk)'
                

    # Koppen type E, Tundra
    elif max(avg_month_temp_c) < 10:
        #print("TYPE E")
        if max(avg_month_temp_c) > 0:
            return 'Alpine tundra climate (ET)'
        else:
            return 'Ice cap climate (EF)'

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



def is_number(value):
    try:
        # Check if the value can be converted to a float and is not None
        return value is not None and not isinstance(value, str) and not np.isnan(float(value)) and not np.isinf(float(value))
    except (ValueError, TypeError):
        return False

# Check if the year, month, and day together form a valid date
def is_valid_date(year, month, day):
    if 1 <= month <= 12 and 1 <= day <= calendar.monthrange(year, month)[1]:
        return True
    else:
        return False
    
def calc_precip_days_from_list(precip_list, threshold=0.01):
    precip_days = [1 if precip > threshold else 0 for precip in precip_list]
    return precip_days


def calc_growing_chance(data):
    # Extract 'low_temp' values from the data
    low_temp_values = [values['low_temp'] for _, _, _, values in data if 'low_temp' in values]

    if not low_temp_values:
        return None
    
    # Calculate the mean and standard deviation of 'low_temp' values
    mean_low_temp = np.mean(low_temp_values)
    std_dev_low_temp = np.std(low_temp_values)

    # Calculate the z-score for 32 degrees
    z_score = (32 - mean_low_temp) / std_dev_low_temp

    # Calculate the cumulative probability using the CDF
    cumulative_prob = norm.cdf(z_score)

    # Calculate the percentile
    percentile_below_32 = (1 - cumulative_prob) * 100
    if percentile_below_32 <= 50:
        percentile_below_32 = 0
    elif percentile_below_32 >= 80:
        percentile_below_32 = 100
    return 100 * ((percentile_below_32/100) ** 2)

def calculate_rolling_average(data, window_size):
    rolling_averages = []

    for i in range(len(data)):
        # Calculate the start and end indices for the window
        start_index = i - window_size
        end_index = i + 1  # Include the current data point

        if start_index < 0:
            # Wrap around to the end of the data list if start_index is negative
            valid_window_data = data[start_index:] + data[:end_index]
        else:
            valid_window_data = data[start_index:end_index]

        valid_values = [entry[2] for entry in valid_window_data if entry[2] is not None]

        # Check if there are valid values to calculate the average
        if valid_values:
            avg = sum(valid_values) / len(valid_values)
            month = valid_window_data[-1][0]  # Get the month of the last entry in the window
            day = valid_window_data[-1][1]    # Get the day of the last entry in the window
            rolling_averages.append((month, day, avg))
        else:
            rolling_averages.append((data[i][0], data[i][1], None))

    return rolling_averages

#This is used to get the index of the first and last growing season days
#Along with the total number of days to grow
def first_last_freeze_date(data):
    data_np = np.array(data)
    max_val = np.max(data_np[:,2])
    min_val = np.min(data_np[:,2])
    mid_val = (max_val + min_val)/2

    #This is used to find the index of the last and first frost free days
    last_freeze = np.where(data_np[:,2] >= mid_val)[0][0]
    data_after_last_freeze = data_np[last_freeze:]

    #The index of first freeze represents how many index's after the last freeze, not the actual index in the data
    first_freeze = np.where(data_after_last_freeze[:,2] <= mid_val)[0][0]
    last_freeze_month, last_freeze_day = data_np[last_freeze, 0], data_np[last_freeze, 1]
    first_freeze_month, first_freeze_day = data_after_last_freeze[first_freeze, 0], data_after_last_freeze[first_freeze, 1]
    #print("MAX: ", max_val, "MIN: ", min_val, "MID: ", mid_val, "LAST FREEZE: ", last_freeze, "FIRST FREEZE: ", first_freeze, "LAST FREEZE DATE: ", last_freeze_month, last_freeze_day, "FIRST FREEZE DATE: ", first_freeze_month, first_freeze_day)
    return ((int(last_freeze_month), int(last_freeze_day)), (int(first_freeze_month), int(first_freeze_day)), int(first_freeze))





'''
This function calculates the sunrise and sunset times for a given latitude, month, and year.
sunrise and sunset return times are days since janurary 1 1900
'''
def calc_sun_info(latitude, year, month, day):
    try:
        
        # Set the observer's latitude
        observer = ephem.Observer()
        observer.lat = str(latitude)

        # Set the date to the 21st day of the month
        date_str = f"{year}/{month}/{day}"
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

    except ephem.AlwaysUpError:
        daylight_hours = 24
        sunrise = None
        sunset = None
    except ephem.NeverUpError:
        daylight_hours = 0
        sunrise = None
        sunset = None
    return sunrise, sunset, daylight_hours

def calculate_sun_info_batch(latitude, dates):
    # Create an observer once
    observer = ephem.Observer()
    observer.lat = str(latitude)
    sun = ephem.Sun()
    
    sun_info = []
    
    for year, month, day in dates:
        date_str = f"{year}/{month}/{day}"
        observer.date = ephem.Date(date_str)
        
        # Check if the sun is always up or never rises
        if observer.previous_setting(sun) > observer.next_rising(sun):
            sunrise = None
            sunset = None
            daylight_hours = 0
        else:
            sunrise = ephem.localtime(observer.previous_rising(sun))
            sunset = ephem.localtime(observer.next_setting(sun))
            daylight_length = (sunset - sunrise).total_seconds()
            daylight_hours = daylight_length / 3600  # Convert to hours
        
        
        sun_info.append((sunrise, sunset, daylight_hours))
    
    return sun_info


def calc_daylight_length(latitude, year):
    daylight_lengths = []

    for month in range(1, 13):  # Iterate over each month
        daylight_lengths.append(calc_sun_info(latitude, year, month, 21)[2] * DAYS_IN_MONTH )

    return daylight_lengths




def calc_frost_free_chance(value):
    maxVal = 40
    if value >= maxVal:
        return 1
    elif value <= 32:
        return 0
    else:
        return (value - 32) / (maxVal - 32) * 1
    


def calc_humidity_percentage(dew_points_F, temperatures_F):
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

#https://www.weather.gov/epz/wxcalc_windchill
#https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
def calc_aparent_temp (T, DP, V):
    if not V:
        V = 3

    RH = 100*(math.exp((17.625*DP)/(243.04+DP))/math.exp((17.625*T)/(243.04+T)))
    #print(RH)
    if T > 80:
        adjustment = 0
        HI = -42.379 + 2.04901523*T + 10.14333127*RH - .22475541*T*RH - .00683783*T*T - .05481717*RH*RH + .00122874*T*T*RH + .00085282*T*RH*RH - .00000199*T*T*RH*RH
        if T < 112 and RH < 13:
            adjustment = ((13-RH)/4)*sqrt((17-abs(T-95.))/17)
            HI = HI - adjustment
        elif T < 87 and RH > 85:
            adjustment = ((RH-85)/10) * ((87-T)/5)
            HI = HI + adjustment
        return HI
    elif T < 50 and V >= 3:
        WC = 35.74 + (0.6215*T) - 35.75*(V**0.16) + 0.4275*T*(V**0.16)
        return WC
    else:
        return T


'''
This function calculates the angle the sun is above the horizon for a given latitude and date.
date is a datetime object datetime.date(2023, 1, 21)
'''
def calc_sun_angle (latitude, year, month, day):
    
    try:
        datetime_obj = datetime.datetime(year, month, day, 12, 0, 0)
    except ValueError as e:
        # Handle the error, e.g., by setting datetime_obj to a default value
        return None    
    # Create an observer object for the specified latitude
    observer = ephem.Observer()
    observer.lat = str(latitude)
    observer.date = datetime_obj

    # Calculate the position of the sun
    sun = ephem.Sun()
    sun.compute(observer)

    # Get the altitude of the sun (elevation angle)
    return math.degrees(sun.alt)
    



def calc_uv_index(sun_angle, altitude, sunshine_percentage):
    if not sunshine_percentage:
        sunshine_percentage = 0
    #adjusts for percentage vs numerical value 0-100
    if sunshine_percentage > 1:
        sunshine_percentage /= 100
    # Calculate the UV index based on the sun angle, where 90 degrees is the maximum returning 12
    uv_index = (sun_angle / 90) * 12
    
    # Adjust the UV index based on altitude
    altitude_adjustment = altitude / 1000 * 0.05
    uv_index_adjusted = uv_index * (1 + altitude_adjustment)

    # Adjust the UV index based on sunshine percentage
    # The sunshine effect is multiplied by the square root to better reflect the effect of clouds

    #TODO error when clicking on friday harbor, WA. 
    #RuntimeWarning: invalid value encountered in double_scalars 
    uv_index_adjusted = uv_index_adjusted * min(sunshine_percentage ** 0.5,1)

    return max(uv_index_adjusted, 0)


'''
This function calculates the comfort index for a given set of weather conditions.
'''
def calc_comfort_index(temp, dewpoint, precip, windspeed, uv_index, sunshine_percent, apparent):
    cloud_cover = 100 - 100*sunshine_percent
    def bound_value(value, min_val, max_val):
        return max(min(value, max_val), min_val)

    hourlyTempIndex = max((((math.exp(-(math.pow((temp - 70), 2) / 1500)))) - math.pow((0.007 * temp), 11)) + .01, 0) * 100
    hourlyDewIndex = max(((-0.5 * dewpoint) + 165) - (math.exp(0.06 * dewpoint)), 0)

    hourlyPrecipIndex = min(-math.pow(10000 * precip, 1/3) - math.exp(0.045 * precip) + 150, 100)
    hourlyWindSpeedIndex = min(-(math.pow(280000 * windspeed, 1/3)) - math.exp(0.05 * windspeed) - (math.pow((-0.005 * windspeed - 6), 3) + 5), 100)
    hourlyUVIndexIndex = min(-math.pow(15000 * uv_index, 1/3) - math.exp(0.43 * uv_index) + 150, 100)
    hourlyCloudCoverIndex = max(((-0.05 * cloud_cover) + 101) - (math.exp(0.046 * cloud_cover)), 0)
    hourlyFeelLikeIndex = 100 * (math.exp((-((math.pow((apparent - 70), 2) / 2800)))) - (math.pow((0.0005 * apparent), 2)) - (0.07 * math.exp(-0.05 * apparent)) - (math.pow((0.008 * apparent), 11)) + 0.01)
    
    temp_weight = 50
    apparent_weight = 100
    windspeed_weight = 25
    uv_weight = 10
    sunshine_weight = 25
    precip_weight = 50
    dewpoint_weight = 100

    hourlyUVIndexIndex = bound_value(hourlyUVIndexIndex, 0, 100)
    hourlyPrecipIndex = bound_value(hourlyPrecipIndex, 0, 100)
    hourlyDewIndex = bound_value(hourlyDewIndex, 0, 100)
    hourlyWindSpeedIndex = max(hourlyWindSpeedIndex, 0)
    hourlyTempIndex = min(hourlyTempIndex, 100)
    if apparent < 25:
        dewpoint_weight = 3
    if temp < 0:
        hourlyTempIndex = 0
        dewpoint_weight = 1
    hourlyFeelLikeIndex = bound_value(hourlyFeelLikeIndex, -100, 100)

    comfortIndex = ((hourlyTempIndex * temp_weight) + (hourlyDewIndex * dewpoint_weight) + 
                    (hourlyFeelLikeIndex * apparent_weight) + 
                    (hourlyWindSpeedIndex * windspeed_weight) + 
                    (hourlyUVIndexIndex * uv_weight) + (hourlyCloudCoverIndex * sunshine_weight) + 
                    (hourlyPrecipIndex * precip_weight)) / (temp_weight + dewpoint_weight + apparent_weight + windspeed_weight + uv_weight + sunshine_weight + precip_weight)
    
    return max(min(comfortIndex, 100),0)
    
    
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


def nearest_coordinates_to_point_NWS(target_lat, target_lon, df, num_results=NUM_NEAREST_STATIONS_NWS):
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


def nearest_coordinates_to_point_NOAA(target_lat, target_lon, df, num_results=NUM_NEAREST_STATIONS_NOAA):
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
 