import pandas as pd
import folium
import requests
import urllib
import csv
import json
from math import radians, sin, cos, sqrt, atan2
from read_from_csv_to_dataframe import df_from_csv



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
        result = requests.get(url + urllib.parse.urlencode(params), timeout=5.000)

        elevations.append(result.json()['value'])
    except (requests.exceptions.JSONDecodeError, KeyError, requests.exceptions.ReadTimeout):
        elevations.append(0)
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


def nearest_coordinates_to_point(target_lat, target_lon, df, num_results=4):
    """
    Find the closest coordinates to a target point.
    """
    distances = []

    for index, row in df.iterrows():
        lat = row['LAT']
        lon = row['LON']
        distance = haversine_distance(target_lat, target_lon, lat, lon)
        distances.append((lat, lon, row['NWS_PROVIDER'], row['CITY_CODE'], row['ELEVATION'], row['STATION'], distance))

    distances.sort(key=lambda x: x[6])  # Sort by distance, which is 7th value, 6th index
    closest = distances[:num_results]

    return closest


def inverse_dist_weights(closest_points_list):
    dist_values = [entry[6] for entry in closest_points_list]
    # Squared to give increased weight to closest
    inverses = [(1 / value) ** 2 for value in dist_values]
    sum_inverses = sum(inverses)
    weights = [inverse / sum_inverses for inverse in inverses]
    
    #weighted_average = sum(value * weight for value, weight in zip(dist_values, weights))

    return weights


def get_climate_avg_at_point(target_lat, target_lon, df_stations):
    
    # Get closest points to coordinate
    closest_points = nearest_coordinates_to_point(target_lat, target_lon, df_stations)
    #print(closest_points)

    
    # Compute inverse weighted average so closest distance has most weight
    weights = inverse_dist_weights(closest_points)
    print(weights)


    # Get the annual weather for each location
    station_identifiers = [(entry[2],entry[3]) for entry in closest_points]

    annual_metrics = {
        'annual_high_avg': [],
        'annual_low_avg': [],
        'annual_mean_avg': [],
        'annual_percentile_90_max_avg': [],
        'annual_percentile_100_max_avg': [],
        'annual_percentile_10_min_avg': [],
        'annual_percentile_00_min_avg': [],
        'annual_DEP_avg': [],
        'annual_HDD_avg': [],
        'annual_CDD_avg': [],
        'annual_precip_avg': [],
        'annual_snow_avg': [],
        'annual_snow_depth_avg': [],
        'annual_wind_avg': [],
        'annual_wind_gust_avg': [],
        'annual_sunshine_avg': [],
        'annual_wind_dir_avg': [],
        'annual_precip_days_avg': [],
        'annual_snow_days_avg': []
    }

    monthly_metrics = {
        'monthly_high_avg': [],
        'monthly_low_avg': [],
        'monthly_mean_avg': [],
        'monthly_percentile_90_max_avg': [],
        'monthly_percentile_100_max_avg': [],
        'monthly_percentile_10_min_avg': [],
        'monthly_percentile_00_min_avg': [],
        'monthly_DEP_avg': [],
        'monthly_HDD_avg': [],
        'monthly_CDD_avg': [],
        'monthly_precip_avg': [],
        'monthly_snow_avg': [],
        'monthly_snow_depth_avg': [],
        'monthly_wind_avg': [],
        'monthly_wind_gust_avg': [],
        'monthly_sunshine_avg': [],
        'monthly_wind_dir_avg': [],
        'monthly_precip_days_avg': [],
        'monthly_snow_days_avg': []
    }

    for NWS_PROVIDER, CITY_CODE in station_identifiers:
        df, num_entries = df_from_csv(NWS_PROVIDER, CITY_CODE)
        annual_metrics['annual_high_avg'].append(df.loc[df['MAX'] > -99, 'MAX'].mean())
        annual_metrics['annual_low_avg'].append(df.loc[df['MIN'] > -99, 'MIN'].mean())
        annual_metrics['annual_mean_avg'].append(df.loc[:, 'AVG'].mean())
        annual_metrics['annual_percentile_90_max_avg'].append(df.loc[df['MAX'] > -99, 'MAX'].quantile(.9))
        annual_metrics['annual_percentile_100_max_avg'].append(df.loc[df['MAX'] > -99, 'MAX'].quantile(1))
        annual_metrics['annual_percentile_10_min_avg'].append(df.loc[df['MIN'] > -99, 'MIN'].quantile(.1))
        annual_metrics['annual_percentile_00_min_avg'].append(df.loc[df['MIN'] > -99, 'MIN'].quantile(0))
        annual_metrics['annual_DEP_avg'].append(df.loc[:, 'DEP'].mean())
        annual_metrics['annual_HDD_avg'].append(df.loc[:, 'HDD'].sum() / (num_entries / 12))
        annual_metrics['annual_CDD_avg'].append(df.loc[:, 'CDD'].sum() / (num_entries / 12))
        annual_metrics['annual_precip_avg'].append(df.loc[:, 'WTR'].sum() / (num_entries / 12))
        annual_metrics['annual_snow_avg'].append(df.loc[:, 'SNW'].sum() / (num_entries / 12))
        annual_metrics['annual_snow_depth_avg'].append(df.loc[:, 'DPTH'].mean())
        annual_metrics['annual_wind_avg'].append(df.loc[:, 'AVG SPD'].mean())
        annual_metrics['annual_wind_gust_avg'].append(df.loc[:, 'MAX SPD'].mean())

        #TODO in some situations if the sun data is missing, such as in SF, readings can be way off
        # If large majority of days missing, maybe look to other station with lower weight
        annual_metrics['annual_sunshine_avg'].append(1 - (df.loc[df['S-S'] > 0, 'S-S'].sum() / (num_entries / 12)) / 3650)
        annual_metrics['annual_wind_dir_avg'].append(df.loc[:, 'DR'].mean())
        
        annual_metrics['annual_precip_days_avg'].append(df.loc[df['WTR'] > 0, 'WTR'].count() / (num_entries / 12))
        annual_metrics['annual_snow_days_avg'].append(df.loc[df['SNW'] > 0, 'WTR'].count() / (num_entries / 12))


        months_arr = {
            'high_avg': [],
            'low_avg': [],
            'mean_avg': [],
            'percentile_90_max_avg': [],
            'percentile_100_max_avg': [],
            'percentile_10_min_avg': [],
            'percentile_00_min_avg': [],
            'DEP_avg': [],
            'HDD_avg': [],
            'CDD_avg': [],
            'precip_avg': [],
            'snow_avg': [],
            'snow_depth_avg': [],
            'wind_avg': [],
            'wind_gust_avg': [],
            'sunshine_avg': [],
            'wind_dir_avg': [],
            'precip_days_avg': [],
            'snow_days_avg': []
        }

        months_index_str = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        for month in months_index_str:
            months_arr['high_avg'].append(df.loc[(df['MONTH'] == month) & (df['MAX'] > -99), 'MAX'].mean())
            months_arr['low_avg'].append(df.loc[(df['MONTH'] == month) & (df['MIN'] > -99), 'MIN'].mean())
            months_arr['mean_avg'].append(df.loc[(df['MONTH'] == month), 'AVG'].mean())
            months_arr['percentile_90_max_avg'].append(df.loc[(df['MONTH'] == month) & (df['MAX'] > -99), 'MAX'].quantile(.9))
            months_arr['percentile_100_max_avg'].append(df.loc[(df['MONTH'] == month) & (df['MAX'] > -99), 'MAX'].quantile(1))
            months_arr['percentile_10_min_avg'].append(df.loc[(df['MONTH'] == month) & (df['MIN'] > -99), 'MIN'].quantile(.1))
            months_arr['percentile_00_min_avg'].append(df.loc[(df['MONTH'] == month) & (df['MIN'] > -99), 'MIN'].quantile(0))
            months_arr['DEP_avg'].append(df.loc[(df['MONTH'] == month), 'DEP'].mean())
            months_arr['HDD_avg'].append(df.loc[(df['MONTH'] == month), 'HDD'].sum() / len(station_identifiers))
            months_arr['CDD_avg'].append(df.loc[(df['MONTH'] == month), 'CDD'].sum() / len(station_identifiers))
            months_arr['precip_avg'].append(df.loc[(df['MONTH'] == month), 'WTR'].sum() / len(station_identifiers))
            months_arr['snow_avg'].append(df.loc[(df['MONTH'] == month), 'SNW'].sum() / len(station_identifiers))
            months_arr['snow_depth_avg'].append(df.loc[(df['MONTH'] == month), 'DPTH'].mean())
            months_arr['wind_avg'].append(df.loc[(df['MONTH'] == month), 'AVG SPD'].mean())
            months_arr['wind_gust_avg'].append(df.loc[(df['MONTH'] == month), 'MAX SPD'].mean())
            months_arr['sunshine_avg'].append(1 - (df.loc[(df['MONTH'] == month) & (df['S-S'] > 0), 'S-S'].sum()/len(station_identifiers)/300))
            months_arr['wind_dir_avg'].append(df.loc[(df['MONTH'] == month), 'DR'].mean())
            
            months_arr['precip_days_avg'].append(df.loc[(df['MONTH'] == month) & (df['WTR'] > 0), 'WTR'].count() / len(station_identifiers))
            months_arr['snow_days_avg'].append(df.loc[(df['MONTH'] == month) & (df['SNW'] > 0), 'SNW'].count() / len(station_identifiers))


        monthly_metrics['monthly_high_avg'].append(months_arr['high_avg'])
        monthly_metrics['monthly_low_avg'].append(months_arr['low_avg'])
        monthly_metrics['monthly_mean_avg'].append(months_arr['mean_avg'])
        monthly_metrics['monthly_percentile_90_max_avg'].append(months_arr['percentile_90_max_avg'])
        monthly_metrics['monthly_percentile_100_max_avg'].append(months_arr['percentile_100_max_avg'])
        monthly_metrics['monthly_percentile_10_min_avg'].append(months_arr['percentile_10_min_avg'])
        monthly_metrics['monthly_percentile_00_min_avg'].append(months_arr['percentile_00_min_avg'])
        monthly_metrics['monthly_DEP_avg'].append(months_arr['DEP_avg'])
        monthly_metrics['monthly_HDD_avg'].append(months_arr['HDD_avg'])
        monthly_metrics['monthly_CDD_avg'].append(months_arr['CDD_avg'])
        monthly_metrics['monthly_precip_avg'].append(months_arr['precip_avg'])
        monthly_metrics['monthly_snow_avg'].append(months_arr['snow_avg'])
        monthly_metrics['monthly_snow_depth_avg'].append(months_arr['snow_depth_avg'])
        monthly_metrics['monthly_wind_avg'].append(months_arr['wind_avg'])
        monthly_metrics['monthly_wind_gust_avg'].append(months_arr['wind_gust_avg'])
        monthly_metrics['monthly_sunshine_avg'].append(months_arr['sunshine_avg'])
        monthly_metrics['monthly_wind_dir_avg'].append(months_arr['wind_dir_avg'])
        
        monthly_metrics['monthly_precip_days_avg'].append(months_arr['precip_days_avg'])
        monthly_metrics['monthly_snow_days_avg'].append(months_arr['snow_days_avg'])

    annual_weighted_metrics = {}
    monthly_weighted_metrics = {}

    # Computes the weighted average value for each key.
    '''
    If station weights were .5, .3, .15, .05 then the values would be multiplied and summed by those values
    Generating a weighted averaged value of the cooresponding stations, weighted by distance.
    '''
    for key in annual_metrics:
        annual_weighted_metrics[key] = sum(value * weight for value, weight in zip(annual_metrics[key], weights))

#TODO only 4 nearby stations are hardcoded in here. Make for loop which adds N amount of nearby stations
    for key in monthly_metrics:
        weighted_list = []
        for month_num in range(12):
            weighted_list.append(monthly_metrics[key][0][month_num] * weights[0] + monthly_metrics[key][1][month_num]* weights[1] + monthly_metrics[key][2][month_num]* weights[2] + monthly_metrics[key][3][month_num]* weights[3]) 
        monthly_weighted_metrics[key] = weighted_list
        

    
    # Get elevation of point
    target_elev = get_elevation_from_coords(target_lat, target_lon)
    #print("TARGET ELEV: ",target_elev)

    
    # Compute difference between average weighted elevation
    elev_values = [entry[4] for entry in closest_points]
    average_weighted_elev = sum(elevation * weight for elevation, weight in zip(elev_values, weights))
    target_dif_elev = target_elev - average_weighted_elev

    #print("AVERAGE ELEV: ",average_weighted_elev)
    #print("TARGET DIF ELEV: ", target_dif_elev)
    

    '''
    Generate annual weather for new point given weighted averages
    Perform adjustments using elevation difference
    Temperature drops by constant amount for elevation gained, varies based on cloudiness
    With no clouds, temperature drops by 5.5 degrees per 1000ft, 3 degrees with 100% cloud
    '''
    
    ELEV_TEMP_CHANGE = 5.5
    temp_adj = max(ELEV_TEMP_CHANGE * annual_weighted_metrics['annual_sunshine_avg'],3) * (target_dif_elev / 1000)
    temp_adj_monthly = [max(ELEV_TEMP_CHANGE * sunshine, 3) * (target_dif_elev / 1000) for sunshine in monthly_weighted_metrics['monthly_sunshine_avg']]
    annual_values = {}
    monthly_values = {}
    location_values = {}
    #print("ADJUSTMENT: ", temp_adj)
    
    annual_values['weighted_annual_high_avg'] = annual_weighted_metrics['annual_high_avg'] - temp_adj
    annual_values['weighted_annual_low_avg'] = annual_weighted_metrics['annual_low_avg'] - temp_adj
    annual_values['weighted_annual_mean_avg'] = annual_weighted_metrics['annual_mean_avg'] - temp_adj
    annual_values['weighted_annual_percentile_90_max_avg'] = annual_weighted_metrics['annual_percentile_90_max_avg'] - temp_adj
    annual_values['weighted_annual_percentile_100_max_avg'] = annual_weighted_metrics['annual_percentile_100_max_avg'] - temp_adj
    annual_values['weighted_annual_percentile_10_min_avg'] = annual_weighted_metrics['annual_percentile_10_min_avg'] - temp_adj
    annual_values['weighted_annual_percentile_00_min_avg'] = annual_weighted_metrics['annual_percentile_00_min_avg'] - temp_adj
    annual_values['weighted_annual_DEP_avg'] = annual_weighted_metrics['annual_DEP_avg']
    annual_values['weighted_annual_HDD_avg'] = annual_weighted_metrics['annual_HDD_avg']
    annual_values['weighted_annual_CDD_avg'] = annual_weighted_metrics['annual_CDD_avg']
    annual_values['weighted_annual_precip_avg'] = annual_weighted_metrics['annual_precip_avg']
    annual_values['weighted_annual_snow_avg'] = annual_weighted_metrics['annual_snow_avg']
    annual_values['weighted_annual_snow_depth_avg'] = annual_weighted_metrics['annual_snow_depth_avg']
    annual_values['weighted_annual_wind_avg'] = annual_weighted_metrics['annual_wind_avg']
    annual_values['weighted_annual_wind_gust_avg'] = annual_weighted_metrics['annual_wind_gust_avg']
    annual_values['weighted_annual_sunshine_avg'] = annual_weighted_metrics['annual_sunshine_avg']
    annual_values['weighted_annual_wind_dir_avg'] = annual_weighted_metrics['annual_wind_dir_avg']
    annual_values['weighted_annual_precip_days_avg'] = annual_weighted_metrics['annual_precip_days_avg']
    annual_values['weighted_annual_snow_days_avg'] = annual_weighted_metrics['annual_snow_days_avg']

    weighted_monthly_high_avg = []
    weighted_monthly_low_avg = []
    weighted_monthly_mean_avg = []
    weighted_monthly_percentile_90_max_avg = []
    weighted_monthly_percentile_100_max_avg = []
    weighted_monthly_percentile_10_min_avg = []
    weighted_monthly_percentile_00_min_avg = []

    for i in range(12):
        weighted_monthly_high_avg.append(monthly_weighted_metrics['monthly_high_avg'][i] - temp_adj_monthly[i])
        weighted_monthly_low_avg.append(monthly_weighted_metrics['monthly_low_avg'][i] - temp_adj_monthly[i])
        weighted_monthly_mean_avg.append(monthly_weighted_metrics['monthly_mean_avg'][i] - temp_adj_monthly[i])
        weighted_monthly_percentile_90_max_avg.append(monthly_weighted_metrics['monthly_percentile_90_max_avg'][i] - temp_adj_monthly[i])
        weighted_monthly_percentile_100_max_avg.append(monthly_weighted_metrics['monthly_percentile_100_max_avg'][i] - temp_adj_monthly[i])
        weighted_monthly_percentile_10_min_avg.append(monthly_weighted_metrics['monthly_percentile_10_min_avg'][i] - temp_adj_monthly[i])
        weighted_monthly_percentile_00_min_avg.append(monthly_weighted_metrics['monthly_percentile_00_min_avg'][i] - temp_adj_monthly[i])

    monthly_values['weighted_monthly_high_avg'] = weighted_monthly_high_avg
    monthly_values['weighted_monthly_low_avg'] = weighted_monthly_low_avg
    monthly_values['weighted_monthly_mean_avg'] = weighted_monthly_mean_avg
    monthly_values['weighted_monthly_percentile_90_max_avg'] = weighted_monthly_percentile_90_max_avg
    monthly_values['weighted_monthly_percentile_100_max_avg'] = weighted_monthly_percentile_100_max_avg
    monthly_values['weighted_monthly_percentile_10_min_avg'] = weighted_monthly_percentile_10_min_avg
    monthly_values['weighted_monthly_percentile_00_min_avg'] = weighted_monthly_percentile_00_min_avg
    monthly_values['weighted_monthly_DEP_avg'] = monthly_weighted_metrics['monthly_DEP_avg']
    monthly_values['weighted_monthly_HDD_avg'] = monthly_weighted_metrics['monthly_HDD_avg']
    monthly_values['weighted_monthly_CDD_avg'] = monthly_weighted_metrics['monthly_CDD_avg']
    monthly_values['weighted_monthly_precip_avg'] = monthly_weighted_metrics['monthly_precip_avg']
    monthly_values['weighted_monthly_snow_avg'] = monthly_weighted_metrics['monthly_snow_avg']
    monthly_values['weighted_monthly_snow_depth_avg'] = monthly_weighted_metrics['monthly_snow_depth_avg']
    monthly_values['weighted_monthly_wind_avg'] = monthly_weighted_metrics['monthly_wind_avg']
    monthly_values['weighted_monthly_wind_gust_avg'] = monthly_weighted_metrics['monthly_wind_gust_avg']
    monthly_values['weighted_monthly_sunshine_avg'] = monthly_weighted_metrics['monthly_sunshine_avg']
    monthly_values['weighted_monthly_wind_dir_avg'] = monthly_weighted_metrics['monthly_wind_dir_avg']
    monthly_values['weighted_monthly_precip_days_avg'] = monthly_weighted_metrics['monthly_precip_days_avg']
    monthly_values['weighted_monthly_snow_days_avg'] = monthly_weighted_metrics['monthly_snow_days_avg']

    
    location_values['elevation'] = target_elev


    #monthly_values['weighted_monthly_high_avg'] = monthl

    #print(monthly_metrics)
    

    return annual_values, monthly_values, location_values



def main():
    df_stations = pd.read_csv('lat_lon_identifier_elev_name.csv')

    #Crashes when using elevaetion point in ocean
    target_coordinates = (37.938259402679584, -107.11396906315399)
    print(get_climate_avg_at_point(target_coordinates[0], target_coordinates[1], df_stations))
    
    #map_folium(df_stations).save('folium-map.html')

    




if __name__ == '__main__':
    #main()
    pass