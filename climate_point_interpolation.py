import pandas as pd
import folium
import requests
import urllib
import csv
import json
from math import radians, sin, cos, sqrt, atan2
from read_from_csv_to_dataframe import df_from_csv


def map_folium(df):
    m = folium.Map(location=[37.5236, -100.6750],tiles="Stamen Terrain", zoom_start=5)
    m.add_child(folium.LatLngPopup())

    '''
    for i in range(len(df)):
        popupStr = "Name: " + str(df.iloc[i]['STATION']) + '<br>' + "Latitude: " + str(df.iloc[i]['LAT']) + '<br>' + "Longitude: " + str(df.iloc[i]['LON'])+ '<br>' + "NWS Provider: " + str(df.iloc[i]['NWS_PROVIDER'])+ '<br>' + "City Code: "+ str(df.iloc[i]['CITY_CODE']) + '<br>' + "Elevation: "+str(df.iloc[i]['ELEVATION'])+ "ft"
        iframe = folium.IFrame(popupStr)
        popup = folium.Popup(iframe,min_width=220,max_width=220)

        folium.Circle(
            [df.iloc[i]['LAT'], df.iloc[i]['LON']],
            popup= popup,
            fill=True,
            radius=5000,
            color="black"
            ).add_to(m)
    '''  
    
    folium.TileLayer('OpenStreetMap').add_to(m)
    folium.LayerControl().add_to(m)
    return m

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
    result = requests.get((url + urllib.parse.urlencode(params)))
    try:
        elevations.append(result.json()['value'])
    except requests.exceptions.JSONDecodeError:
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


def get_annual_avg_at_point(target_lat, target_lon, df_stations):
    
    # Get closest points to coordinate
    closest_points = nearest_coordinates_to_point(target_lat, target_lon, df_stations)
    #print(closest_points)

    
    # Compute inverse weighted average so closest distance has most weight
    weights = inverse_dist_weights(closest_points)
    print(weights)


    # Get the annual weather for each location
    station_identifiers = [(entry[2],entry[3]) for entry in closest_points]

    metrics = {
        'annual_high_avg': [],
        'annual_low_avg': [],
        'annual_mean_avg': [],
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
        'percentile_90_max_avg': [],
        'percentile_100_max_avg': [],
        'percentile_10_min_avg': [],
        'percentile_00_min_avg': []
    }

    for NWS_PROVIDER, CITY_CODE in station_identifiers:
        df, num_entries = df_from_csv(NWS_PROVIDER, CITY_CODE)
        metrics['annual_high_avg'].append(df.loc[df['MAX'] > -99, 'MAX'].mean())
        metrics['annual_low_avg'].append(df.loc[df['MIN'] > -99, 'MIN'].mean())
        metrics['annual_mean_avg'].append(df.loc[:, 'AVG'].mean())
        metrics['percentile_90_max_avg'].append(df.loc[df['MAX'] > -99, 'MAX'].quantile(.9))
        metrics['percentile_100_max_avg'].append(df.loc[df['MAX'] > -99, 'MAX'].quantile(1))
        metrics['percentile_10_min_avg'].append(df.loc[df['MIN'] > -99, 'MIN'].quantile(.1))
        metrics['percentile_00_min_avg'].append(df.loc[df['MIN'] > -99, 'MIN'].quantile(0))
        metrics['annual_DEP_avg'].append(df.loc[:, 'DEP'].mean())
        metrics['annual_HDD_avg'].append(df.loc[:, 'HDD'].sum() / (num_entries / 12))
        metrics['annual_CDD_avg'].append(df.loc[:, 'CDD'].sum() / (num_entries / 12))
        metrics['annual_precip_avg'].append(df.loc[:, 'WTR'].sum() / (num_entries / 12))
        metrics['annual_snow_avg'].append(df.loc[:, 'SNW'].sum() / (num_entries / 12))
        metrics['annual_snow_depth_avg'].append(df.loc[:, 'DPTH'].mean())
        metrics['annual_wind_avg'].append(df.loc[:, 'AVG SPD'].mean())
        metrics['annual_wind_gust_avg'].append(df.loc[:, 'MAX SPD'].mean())
        metrics['annual_sunshine_avg'].append(1 - (df.loc[df['S-S'] > 0, 'S-S'].sum() / (num_entries / 12)) / 3650)
        metrics['annual_wind_dir_avg'].append(df.loc[:, 'DR'].mean())

    weighted_metrics = {}
    for key in metrics:
        weighted_metrics[key] = sum(value * weight for value, weight in zip(metrics[key], weights))

    weighted_annual_high_avg = weighted_metrics['annual_high_avg']
    weighted_annual_low_avg = weighted_metrics['annual_low_avg']
    weighted_annual_mean_avg = weighted_metrics['annual_mean_avg']
    weighted_annual_DEP_avg = weighted_metrics['annual_DEP_avg']
    weighted_annual_HDD_avg = weighted_metrics['annual_HDD_avg']
    weighted_annual_CDD_avg = weighted_metrics['annual_CDD_avg']
    weighted_annual_precip_avg = weighted_metrics['annual_precip_avg']
    weighted_annual_snow_avg = weighted_metrics['annual_snow_avg']
    weighted_annual_snow_depth_avg = weighted_metrics['annual_snow_depth_avg']
    weighted_annual_wind_avg = weighted_metrics['annual_wind_avg']
    weighted_annual_wind_gust_avg = weighted_metrics['annual_wind_gust_avg']
    weighted_annual_sunshine_avg = weighted_metrics['annual_sunshine_avg']
    weighted_annual_wind_dir_avg = weighted_metrics['annual_wind_dir_avg']
    weighted_percentile_90_max_avg = weighted_metrics['percentile_90_max_avg']
    weighted_percentile_100_max_avg = weighted_metrics['percentile_100_max_avg']
    weighted_percentile_10_min_avg = weighted_metrics['percentile_10_min_avg']
    weighted_percentile_00_min_avg = weighted_metrics['percentile_00_min_avg']


    
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
    temp_adj = max(ELEV_TEMP_CHANGE * weighted_annual_sunshine_avg,3) * (target_dif_elev / 1000)
    annual_values = {}
    #print("ADJUSTMENT: ", temp_adj)
    #print("weighted_annual_high_avg: {:.1f}".format(weighted_annual_high_avg - temp_adj))
    #print("weighted_annual_low_avg: {:.1f}".format(weighted_annual_low_avg - temp_adj))
    #print("weighted_annual_mean_avg: {:.1f}".format(weighted_annual_mean_avg - temp_adj))
    #print("weighted_percentile_90_max_avg: {:.1f}".format(weighted_percentile_90_max_avg - temp_adj))
    #print("weighted_percentile_100_max_avg: {:.1f}".format(weighted_percentile_100_max_avg - temp_adj))
    #print("weighted_percentile_10_min_avg: {:.1f}".format(weighted_percentile_10_min_avg - temp_adj))
    #print("weighted_percentile_00_min_avg: {:.1f}".format(weighted_percentile_00_min_avg - temp_adj))
    #print("weighted_annual_DEP_avg: {:.1f}".format(weighted_annual_DEP_avg))
    #print("weighted_annual_HDD_avg: {:.0f}".format(weighted_annual_HDD_avg))
    #print("weighted_annual_CDD_avg: {:.0f}".format(weighted_annual_CDD_avg))
    #print("weighted_annual_precip_avg: {:.1f}".format(weighted_annual_precip_avg))
    #print("weighted_annual_snow_avg: {:.1f}".format(weighted_annual_snow_avg))
    #print("weighted_annual_snow_depth_avg: {:.1f}".format(weighted_annual_snow_depth_avg))
    #print("weighted_annual_wind_avg: {:.1f}".format(weighted_annual_wind_avg))
    #print("weighted_annual_wind_gust_avg: {:.1f}".format(weighted_annual_wind_gust_avg))
    #print("weighted_annual_sunshine_avg: {:.2f}".format(weighted_annual_sunshine_avg))
    #print("weighted_annual_wind_dir_avg: {:.0f}".format(weighted_annual_wind_dir_avg))
    
    annual_values['weighted_annual_high_avg'] = weighted_annual_high_avg - temp_adj
    annual_values['weighted_annual_low_avg'] = weighted_annual_low_avg - temp_adj
    annual_values['weighted_annual_mean_avg'] = weighted_annual_mean_avg - temp_adj
    annual_values['weighted_percentile_90_max_avg'] = weighted_percentile_90_max_avg - temp_adj
    annual_values['weighted_percentile_100_max_avg'] = weighted_percentile_100_max_avg - temp_adj
    annual_values['weighted_percentile_10_min_avg'] = weighted_percentile_10_min_avg - temp_adj
    annual_values['weighted_percentile_00_min_avg'] = weighted_percentile_00_min_avg - temp_adj
    annual_values['weighted_annual_DEP_avg'] = weighted_annual_DEP_avg
    annual_values['weighted_annual_HDD_avg'] = weighted_annual_HDD_avg
    annual_values['weighted_annual_CDD_avg'] = weighted_annual_CDD_avg
    annual_values['weighted_annual_precip_avg'] = weighted_annual_precip_avg
    annual_values['weighted_annual_snow_avg'] = weighted_annual_snow_avg
    annual_values['weighted_annual_snow_depth_avg'] = weighted_annual_snow_depth_avg
    annual_values['weighted_annual_wind_avg'] = weighted_annual_wind_avg
    annual_values['weighted_annual_wind_gust_avg'] = weighted_annual_wind_gust_avg
    annual_values['weighted_annual_sunshine_avg'] = weighted_annual_sunshine_avg
    annual_values['weighted_annual_wind_dir_avg'] = weighted_annual_wind_dir_avg
    annual_values['elevation'] = target_elev
    

    return annual_values



def main():
    df_stations = pd.read_csv('lat_lon_identifier_elev_name.csv')

    #Crashes when using elevaetion point in ocean
    target_coordinates = (37.938259402679584, -107.11396906315399)
    print(get_annual_avg_at_point(target_coordinates[0], target_coordinates[1], df_stations))
    
    #map_folium(df_stations).save('folium-map.html')

    




if __name__ == '__main__':
    main()