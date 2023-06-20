import math
import requests
import urllib
from math import radians, sin, cos, sqrt, atan2
import ephem

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


    # Koppen type A, Tropical
    if min(avg_month_temp_c) >= 18:
        print("TYPE A")
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
        print("TYPE C")
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
        print("TYPE D")
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
        print("TYPE B")

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
        print("TYPE E")
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


def calculate_daylight_length(latitude, year):
    daylight_lengths = []

    for month in range(1, 13):  # Iterate over each month
        try:
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
        
        except ephem.AlwaysUpError:
            daylight_lengths.append((24 * DAYS_IN_MONTH ))
            continue
        except ephem.NeverUpError:
            daylight_lengths.append((0))
            continue

    return daylight_lengths


def calculate_frost_free_chance(value):
    maxVal = 40
    if value >= maxVal:
        return 1
    elif value <= 32:
        return 0
    else:
        return (value - 32) / (maxVal - 32) * 1
    


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

#https://www.weather.gov/epz/wxcalc_windchill
#https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
def calc_aparent_temp (T, DP, V):

    RH = 100*(math.exp((17.625*DP)/(243.04+DP))/math.exp((17.625*T)/(243.04+T)))
    print(RH)
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
 