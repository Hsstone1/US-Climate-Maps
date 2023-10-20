import numpy as np
import pandas as pd
from climate_data import *
from read_from_csv_to_dataframe import *
from climate_point_interpolation_helpers import *
import time
import calendar





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
    print("IDENTIFIERS: ", nws_station_identifiers)

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
        df = get_NOAA_csv_content(file_name, '1980-01-01', '2023-01-01')
        
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
            months_arr['record_high'].append((month_df["TMAX"].quantile(.999)* 9/50) + 32)
            months_arr['mean_maximum'].append((month_df["TMAX"].quantile(.9)* 9/50) + 32)
            months_arr['high_avg'].append((month_df["TMAX"].mean()* 9/50) + 32)
            months_arr['mean_avg'].append((month_df["TAVG"].mean()* 9/50) + 32)
            months_arr['low_avg'].append((month_df["TMIN"].mean()* 9/50) + 32)
            months_arr['mean_minimum'].append((month_df["TMIN"].quantile(.1)* 9/50) + 32)
            months_arr['record_low'].append((month_df["TMIN"].quantile(0.001)* 9/50) + 32)
            months_arr['HDD_avg'].append((month_df["HDD"].sum() /num_days))
            months_arr['CDD_avg'].append((month_df["CDD"].sum() /num_days))
            months_arr['precip_avg'].append((month_df["PRCP"].mean() / 254 * num_days))
            months_arr['snow_avg'].append((month_df["SNOW"].mean() / 25.4 * num_days) if not pd.isna(month_df["SNOW"].mean()) else 0)
            months_arr['precip_days_avg'].append(round((month_df.loc[month_df['PRCP'] > 25.4, 'PRCP'].count() / num_days),0))
            months_arr['snow_days_avg'].append(round((month_df.loc[month_df['SNOW'] > 0.1, 'SNOW'].count() / num_days),0))
            

            # Value is squared to simulate the increased risk of frost when the value count
            # has some values bellow 0
            num_days_above_freezing = (month_df.loc[month_df['TMIN'] > 0, 'TMIN'].count() /(len(month_df)))
            frost_free_days = num_days_above_freezing = 0 if num_days_above_freezing < 0.15 else 1 if num_days_above_freezing > 0.85 else num_days_above_freezing
            frost_free_days = frost_free_days ** 2 
            months_arr['frost_free_days_avg'].append(frost_free_days)


            

            #TODO this is where I can add the daily data for each month
            #print(month_df['DATE'])
            #for day in range(1, num_days + 1):
                #day_df = month_df[month_df['DATE'].dt.day == day]
                #print(day_df)
            

        

    
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
        noaa_monthly_metrics['monthly_humidity_avg'].append(calc_humidity_percentage(dewpoints, months_arr['mean_avg']))

    print("NOAA Elapsed Time:", time.time() - start_time, "seconds")


    nws_monthly_weighted_metrics = {}
    noaa_monthly_weighted_metrics = {}
    # Computes the weighted average value for each key.
    '''
    If station weights were .5, .3, .15, .05 then the values would be multiplied and summed by those values
    Generating a weighted averaged value of the cooresponding stations, weighted by distance.

    In short, the methods bellow combine all querried stations into one result, with respective weights 
    '''

    # Compute weighted average for each month
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
    # This reduces the sunshine percentage with interpolated elevation, as is often the case with uplift in mountainous areas
    sunshine_adjust_elev = {'monthly_sunshine_avg':[nws_monthly_weighted_metrics['monthly_sunshine_avg'][i] * (1 - (target_dif_elev / 1000) * 0.03) for i in range(12)]}
    temp_adj_monthly = [max(ELEV_TEMP_CHANGE * sunshine, 3) * (target_dif_elev / 1000) for sunshine in sunshine_adjust_elev['monthly_sunshine_avg']]
    precip_adjust_elev = min((1 + (target_dif_elev / 1000) * 0.2),2)
    precip_days_adjust_elev = min((1 + (target_dif_elev / 1000) * 0.08),2)

    annual_values = {}
    monthly_values = {}
    location_values = {}
    print("ELEVATION ADJUST: ", target_dif_elev)

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
    'weighted_monthly_precip_days_avg':[min(noaa_monthly_weighted_metrics['monthly_precip_days_avg'][i] * precip_days_adjust_elev, calendar.monthrange(2023, i+1)[1]) for i in range(12)],
    
    }

    monthly_values['weighted_monthly_snow_avg'] = noaa_monthly_weighted_metrics['monthly_snow_avg']
    monthly_values['weighted_monthly_snow_days_avg'] = noaa_monthly_weighted_metrics['monthly_snow_days_avg']
    

    '''
    This section calculates the frost free days for each month
    some adjustments are made to the frost free days based on edge cases to better reflect reality
    '''
    frost_free_normal =  [calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_low_avg']]
    frost_free_maxima =  [calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_mean_minimum']]
    frost_free_extreme = [calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_record_low']]
    frost_free_normal_maxima = [(normal + maxima) / 2 for normal, maxima in zip(frost_free_normal, frost_free_maxima)]
    frost_free_maxima_extreme = [(maxima + extreme) / 2 for maxima, extreme in zip(frost_free_maxima, frost_free_extreme )]
    monthly_values['weighted_monthly_frost_free_days_avg'] = [.7 *frost_free_normal[i] + .2 *frost_free_maxima[i] + .01 *frost_free_extreme[i] + .05 *frost_free_normal_maxima[i] + .04*frost_free_maxima_extreme[i] for i in range(12)]
    monthly_values['weighted_monthly_frost_free_days_avg'] = [1 if value > 0.95 else value**1.5 for value in monthly_values['weighted_monthly_frost_free_days_avg']]
    values = monthly_values['weighted_monthly_frost_free_days_avg']

    monthly_values['weighted_monthly_frost_free_days_avg'] = [
        1 if i > 0 and i < len(values) - 1 and values[i] > 0.8 and values[i - 1] > 0.8 and values[i + 1] > 0.8 else values[i]
        for i in range(len(values))
    ]

    monthly_values['weighted_monthly_humidity_avg'] = noaa_monthly_weighted_metrics['monthly_humidity_avg']
    
    snow_chance_max =  [1-calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_mean_maximum']]
    snow_chance_high =  [1-calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_high_avg']]
    snow_chance_mean =  [1-calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_mean_avg']]
    snow_chance_low =  [1-calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_low_avg']]

    monthly_snow_chance = [.1 * snow_chance_max[i] + .3 *snow_chance_high[i] + .5 *snow_chance_mean[i] + .1 *snow_chance_low[i] for i in range(12)]
    
    #This adjusts for winter weather. A ramping linear interpolation function calculates the ratio of snow
    #totals, or percentage of rainy days that should be converted to snowy days
    for i in range(12):
        precip_days = monthly_values['weighted_monthly_precip_days_avg'][i]
        snow_days = monthly_values['weighted_monthly_snow_days_avg'][i]
        snowfall = monthly_values['weighted_monthly_snow_avg'][i]
        snow_per_snow_day = snowfall / snow_days if snowfall != 0 and snow_days != 0 else 0
        rain_to_snow_days = precip_days * monthly_snow_chance[i]

        monthly_values['weighted_monthly_snow_days_avg'][i] =+ rain_to_snow_days
        monthly_values['weighted_monthly_precip_days_avg'][i] = precip_days - monthly_values['weighted_monthly_snow_days_avg'][i]
        monthly_values['weighted_monthly_snow_avg'][i] = rain_to_snow_days * snow_per_snow_day

    #This adjusts for summer weather. A ramping linear interpolation function calculates the ratio of snow
    total_weighted_snow_avg = sum(monthly_values['weighted_monthly_snow_avg'])
    total_weighted_snow_days = sum(monthly_values['weighted_monthly_snow_days_avg'])

    #Checks for divide by zero error in the event there are no snow days
    if total_weighted_snow_days != 0:
        average_snowfall_day_annualized = total_weighted_snow_avg / total_weighted_snow_days
    else:
        average_snowfall_day_annualized = 0  # or any appropriate default value
    #average_snowfall_day_annualized = sum(monthly_values['weighted_monthly_snow_avg']) / sum(monthly_values['weighted_monthly_snow_days_avg'])
    
    for i in range(12):
        if monthly_values['weighted_monthly_snow_avg'][i] == 0 and monthly_values['weighted_monthly_snow_days_avg'][i] > 0:
            monthly_values['weighted_monthly_snow_avg'][i] = average_snowfall_day_annualized * monthly_values['weighted_monthly_snow_days_avg'][i]


    monthly_values['weighted_monthly_sunshine_avg'] = sunshine_adjust_elev['monthly_sunshine_avg']
    monthly_values['weighted_monthly_sunshine_days_avg'] = [value * DAYS_IN_MONTH for value in monthly_values['weighted_monthly_sunshine_avg']]
    monthly_values['weighted_monthly_wind_avg'] = nws_monthly_weighted_metrics['monthly_wind_avg']
    monthly_values['weighted_monthly_wind_gust_avg'] = nws_monthly_weighted_metrics['monthly_wind_gust_avg']
    monthly_values['weighted_monthly_wind_gust_peak'] = nws_monthly_weighted_metrics['monthly_wind_gust_peak']
    monthly_values['weighted_monthly_wind_dir_avg'] = nws_monthly_weighted_metrics['monthly_wind_dir_avg']
    
    monthly_values['monthly_daylight_hours_avg'] = calc_daylight_length(target_lat, 2023)
    monthly_values['monthly_sunshine_hours_avg'] = [x * y for x, y in zip(monthly_values['monthly_daylight_hours_avg'], monthly_values['weighted_monthly_sunshine_avg'])]
    monthly_values['weighted_monthly_apparent_temp_high'] = [calc_aparent_temp(T, RH, wind_speed) for T, RH, wind_speed in zip(monthly_values['weighted_monthly_high_avg'], monthly_values['weighted_monthly_dewpoint_avg'], monthly_values['weighted_monthly_wind_gust_avg'])]
    monthly_values['weighted_monthly_apparent_temp_low'] = [calc_aparent_temp(T, RH, wind_speed) for T, RH, wind_speed in zip(monthly_values['weighted_monthly_low_avg'], monthly_values['weighted_monthly_dewpoint_avg'], monthly_values['weighted_monthly_wind_gust_avg'])]
    monthly_values['weighted_monthly_apparent_temp_mean'] = [(high + low) / 2 for low, high in zip(monthly_values['weighted_monthly_apparent_temp_low'], monthly_values['weighted_monthly_apparent_temp_high'])]
    monthly_values['monthly_sun_angle'] = [calc_sun_angle(target_lat, 2023, month+1, 1) for month in range(12)]
    monthly_values['monthly_uv_index'] = [calc_uv_index(sun_angle, target_elevation, sunshine_percent) for sun_angle, sunshine_percent in zip(monthly_values['monthly_sun_angle'], monthly_values['weighted_monthly_sunshine_avg'])]
    monthly_values['monthly_comfort_index'] = [calc_comfort_index(T, DP, precip, wind, UV, sun_percent, aparent) for T, DP, precip, wind, UV, sun_percent, aparent in zip(monthly_values['weighted_monthly_mean_avg'], monthly_values['weighted_monthly_dewpoint_avg'], monthly_values['weighted_monthly_precip_avg'], monthly_values['weighted_monthly_wind_gust_avg'], monthly_values['monthly_uv_index'], monthly_values['weighted_monthly_sunshine_avg'], monthly_values['weighted_monthly_apparent_temp_mean'])]



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
    annual_values['weighted_annual_apparent_temp_high'] = max(monthly_values['weighted_monthly_apparent_temp_high'])
    annual_values['weighted_annual_apparent_temp_low'] = min(monthly_values['weighted_monthly_apparent_temp_low'])
    annual_values['annual_sun_angle_avg'] = sum(monthly_values['monthly_sun_angle'])/12
    annual_values['annual_uv_index_avg'] = sum(monthly_values['monthly_uv_index'])/12
    annual_values['annual_comfort_index'] = sum(monthly_values['monthly_comfort_index'])/12

    
    location_values['elevation'] = target_elevation
    location_values['koppen'] = calc_koppen_climate(monthly_values['weighted_monthly_mean_avg'], monthly_values['weighted_monthly_precip_avg'])
    location_values['plant_hardiness'] = calc_plant_hardiness(annual_values['weighted_annual_mean_minimum'])
    return annual_values, monthly_values, location_values


def get_climate_data_year(target_lat, target_lon, target_elevation, df_stations_NWS, df_stations_NOAA):
    
    # Get a list of closest points to coordinate, set at 3 stations currently
    closest_points_NWS = nearest_coordinates_to_point_NWS(target_lat, target_lon, df_stations_NWS, num_results=3)
    closest_points_NOAA = nearest_coordinates_to_point_NOAA(target_lat, target_lon, df_stations_NOAA, num_results=4)

    # Compute inverse weighted average so closest distance has most weight
    weights_NWS = inverse_dist_weights(closest_points_NWS)
    weights_NOAA = inverse_dist_weights(closest_points_NOAA)


    #This is how the month numbers are indexed in the NWS data CSV's
    months_index_str = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    
    # Get the historical weather for each location
    nws_station_identifiers = [(entry[2],entry[3]) for entry in closest_points_NWS]
    nws_weight_index = 0
    noaa_weight_index = 0

    print("NWS STATIONS: ", nws_station_identifiers)
    print("NWS WEIGHTS: ", weights_NWS)
    print("NOAA STATION: ", closest_points_NOAA)
    print("NOAA WEIGHTS: ", weights_NOAA)


    nws_data_list = []
    noaa_data_list = []


    start_time = time.time()  # Start timer

    for station in closest_points_NOAA:
        #This is for the NOAA stations, format of (LAT, LON, STATION_ID, ELEVATION, NAME, DISTANCE)
        file_name = station[2] + "_" + str(station[0]) + "_" + str(station[1]) + "_" + str(round(station[3])) + "_" + station[4] + ".csv"
        df = get_NOAA_csv_content(file_name, f'{START_NOAA_YEAR}-01-01', f'{CURRENT_YEAR}-3-20')

         # Vectorized temperature and precipitation conversions
        df['DAILY_HIGH_AVG'] = (df['TMAX'] * 9 / 50 + 32).fillna(0)
        df['DAILY_MEAN_AVG'] = (df['TAVG'] * 9 / 50 + 32).fillna(0)
        df['DAILY_LOW_AVG'] = (df['TMIN'] * 9 / 50 + 32).fillna(0)
        df['DAILY_HDD_AVG'] = df['HDD'].fillna(0)
        df['DAILY_CDD_AVG'] = df['CDD'].fillna(0)
        df['DAILY_PRECIP_AVG'] = (df['PRCP'] / 254).fillna(0)
        df['DAILY_SNOW_AVG'] = (df['SNOW'] / 25.4).fillna(0)
        
        # Group data by year and month
        grouped = df.groupby([df['DATE'].dt.year, df['DATE'].dt.month])

        noaa_data_unweighted = WeatherData(weights_NOAA[noaa_weight_index])
        for (year, month), month_df in grouped:
            day = 0
            for row, data in month_df.iterrows():
                # Your data processing logic here
                daily_high_avg = data["DAILY_HIGH_AVG"]
                daily_mean_avg = data["DAILY_MEAN_AVG"]
                daily_low_avg = data["DAILY_LOW_AVG"]
                daily_HDD_avg = data["DAILY_HDD_AVG"]
                daily_CDD_avg = data["DAILY_CDD_AVG"]
                daily_precip_avg = data["DAILY_PRECIP_AVG"]
                daily_snow_avg = data["DAILY_SNOW_AVG"]
                day += 1

                noaa_data_unweighted.add_data(year, int(month), day, high_temp=daily_high_avg, mean_temp=daily_mean_avg, low_temp=daily_low_avg, HDD=daily_HDD_avg, CDD=daily_CDD_avg, precip_in=daily_precip_avg, snow_in=daily_snow_avg)
        noaa_data_list.append(noaa_data_unweighted)
        noaa_weight_index += 1
    noaa_data_weighted = WeatherData()

    stop_time = time.time()

    print("NOAA Elapsed Time:", stop_time - start_time, "seconds")


    # Get the valid dates for each element in noaa_data_list
    valid_dates_lengths = [len(data.get_all_valid_dates()) for data in noaa_data_list]

    # Find the maximum length and its index
    max_length = max(valid_dates_lengths)
    max_index = valid_dates_lengths.index(max_length)

    # Set noaa_valid_dates to the maximum length
    noaa_valid_dates = noaa_data_list[max_index].get_all_valid_dates()   
    #noaa_valid_dates = noaa_data_list[0].get_all_valid_dates()

    property_names = {
    'high_temp': 0,
    'mean_temp': 0,
    'low_temp': 0,
    'HDD': 0,
    'CDD': 0,
    'precip_in': 0,
    'snow_in': 0
    }

    start_time = time.time()  # Start timer


    for date in noaa_valid_dates:
        year, month, day = date
        
        # Get the weighted average for each property
        for prop in property_names:
            prop_total = 0
            prop_weight_total = 0
            
            # Get the total of the property for each station, weighted by distance
            for i in range(len(noaa_data_list)):
                data = noaa_data_list[i].get_all_data_for_day(year, month, day)
                if data and data[prop] is not None:
                    prop_total += (data[prop] * noaa_data_list[i].weight)
                    prop_weight_total += noaa_data_list[i].weight
                else:
                    #print("NO DATA FOR: ", year, month, day, prop, data)
                    pass
            
            if prop_weight_total != 0:
                property_names[prop] = prop_total / prop_weight_total
        noaa_data_weighted.add_data(year, month, day, **property_names)
    print("NOAA Weighted Elapsed Time:", time.time() - start_time, "seconds")


    
    start_time = time.time()  # Start timer

    #This is for the NWS stations, format of (NWS_PROVIDER, CITY_CODE)
    #These calculations are performed on each nearby NWS stations
    for NWS_PROVIDER, CITY_CODE in nws_station_identifiers:
        df, num_entries = df_from_NWS_csv(NWS_PROVIDER, CITY_CODE)
        nws_data_unweighted = WeatherData(weights_NWS[nws_weight_index])
        
        #Only for one month, since searching by year
        for year in range(START_NWS_YEAR, CURRENT_YEAR+1):
            for month in months_index_str:
                month_df = df.loc[(df['YEAR'] == str(year)) & (df['MONTH'] == month)]
                
                for day, data in month_df.iterrows():
                    daily_wind_avg = 0
                    daily_wind_dir_avg = 0
                    daily_sunshine_avg = 0
                    if not pd.isna(data['MAX SPD']) and data['MAX SPD'] > 0:
                        daily_wind_avg = data['MAX SPD']
                    if not pd.isna(data['DR']) and data['DR'] != 1:
                        daily_wind_dir_avg = data['DR']
                    if not pd.isna(data['S-S']) and data['S-S'] >= 0:
                        daily_sunshine_avg = 10*(10-data['S-S'])
                    
                    nws_data_unweighted.add_data(year, int(month), day, sunshine_percent=daily_sunshine_avg, wind_spd=daily_wind_avg, wind_dir=daily_wind_dir_avg)
        nws_data_list.append(nws_data_unweighted)
        nws_weight_index += 1

    nws_data_weighted = WeatherData()
    nws_valid_dates = nws_data_list[0].get_all_valid_dates()

    print("NWS Elapsed Time:", time.time() - start_time, "seconds")

    property_names = {
        'sunshine_percent': 0,
        'wind_spd': 0,
        'wind_dir': 0
    }

    start_time = time.time()  # Start timer


    for date in nws_valid_dates:
        year, month, day = date
        
        for prop in property_names:
            prop_total = 0
            prop_weight_total = 0
            
            for i in range(len(nws_data_list)):
                data = nws_data_list[i].get_all_data_for_day(year, month, day)
                if data and data[prop] is not None:
                    prop_total += (data[prop] * nws_data_list[i].weight)
                    prop_weight_total += nws_data_list[i].weight

            if prop_weight_total != 0:
                property_names[prop] = prop_total / prop_weight_total
        
        nws_data_weighted.add_data(year, month, day, **property_names)

    print("NWS Weighted Elapsed Time:", time.time() - start_time, "seconds")




    # Compute difference between average weighted elevation
    # Example Index for entry: 39.4607, -105.6785, 'USC00053530', 8673.0, 'GRANT, CO US', 3.4029709128638763)
    elev_values = [entry[3] for entry in closest_points_NOAA]
    average_weighted_elev = sum(elevation * weight for elevation, weight in zip(elev_values, weights_NOAA))
    target_dif_elev = target_elevation - average_weighted_elev
    ELEV_TEMPERATURE_CHANGE = 5.5

    
    
    '''
    Sunshine totals drop with elevation as uplift from the mountains cause moist air to rise and more clouds are made
    This also increases precipitation, and precip days
    The sunshine amount controls the temperature, so the temperature also drops with elevation
    Sunnier climates have a faster temperature drop with elevation, cloudier have slower
    With no clouds, temperature drops by 5.5 degrees per 1000ft, 3 degrees with 100% cloud
    '''


    sunshine_percent_list = np.array(nws_data_weighted.get_all_day_values_of_key("sunshine_percent"))
    sunshine_elev_adjust_list = sunshine_percent_list * (1-(target_dif_elev/1000)*0.03) 
    
    dates_nws = nws_data_weighted.get_all_valid_dates()
    for i, date in enumerate(dates_nws):
        #is_sunny_day = 0
        #if sunshine_elev_adjust_list[i] > 70:
        #    is_sunny_day = 1
        nws_data_weighted.add_data(*date, sunshine_percent=sunshine_elev_adjust_list[i])


    temperature_elev_adjust = np.mean(np.maximum(ELEV_TEMPERATURE_CHANGE * sunshine_elev_adjust_list/100, 3) * (target_dif_elev / 1000))
    precip_elev_adjust = min((1 + (target_dif_elev / 1000) * 0.2),2)
    precip_days_elev_adjust = min((1 + (target_dif_elev / 1000) * 0.03),2)


    high_temp_list_np = np.array(noaa_data_weighted.get_all_day_values_of_key("high_temp")) - temperature_elev_adjust
    mean_temp_list_np = np.array(noaa_data_weighted.get_all_day_values_of_key("mean_temp")) - temperature_elev_adjust
    low_temp_list_np = np.array(noaa_data_weighted.get_all_day_values_of_key("low_temp")) - temperature_elev_adjust
    precip_in_list_np = np.array(noaa_data_weighted.get_all_day_values_of_key("precip_in")) * precip_elev_adjust
    snow_in_list_np = np.array(noaa_data_weighted.get_all_day_values_of_key("snow_in")) * precip_elev_adjust
    hdd_list_np = np.array(noaa_data_weighted.get_all_day_values_of_key("HDD")) + temperature_elev_adjust
    adjusted_cdd = np.array(noaa_data_weighted.get_all_day_values_of_key("CDD")) - temperature_elev_adjust
    #This prevents negative CDD values
    cdd_list_np = np.clip(adjusted_cdd, 0, None)

    dewpoints = humidity_regr_from_temp_max_min(high_temp_list_np, low_temp_list_np, precip_in_list_np)
    humidity = calc_humidity_percentage(dewpoints, mean_temp_list_np)
    precip_days = np.array(calc_precip_days_from_list(precip_in_list_np, 0.05)) * precip_days_elev_adjust
    snow_days = np.array(calc_precip_days_from_list(snow_in_list_np, 0.1)) * precip_days_elev_adjust
    



    dates_noaa = noaa_data_weighted.get_all_valid_dates()
    avg_data_for_month = [nws_data_weighted.get_avg_monthly_data(month) for month in range(1, 13)]
    

    #This calculates the sun angle and daylight length for each day
    #This is done only for one year, instead of all years as the loop bellow
    sun_angle_list = []
    daylight_hours_list = []
    daily_record_high = []
    daily_record_low = []
    daily_mean_max = []
    daily_mean_min = []

    start_time = time.time()  # Start timer
    for month in range(1, 13):

        for day in range (1, 32):
            if is_valid_date(2020, month, day) is False:
                break
            sun_angle = calc_sun_angle(target_lat, 2020, month, day) 
            daylight = calc_sun_info(target_lat, 2020, month, day)[2]
            high_temp_values = np.array(noaa_data_weighted.get_all_day_values_of_key("high_temp", month=month, day=day))
            low_temp_values = np.array(noaa_data_weighted.get_all_day_values_of_key("low_temp", month=month, day=day))

            if high_temp_values.size > 0:
                mean_max, record_high = np.percentile(high_temp_values - temperature_elev_adjust, [90, 100])   
            else:
                #print(f"No high temperature data available for {month}/{day}")
                pass
            if low_temp_values.size > 0:
                mean_min, record_low = np.percentile(low_temp_values - temperature_elev_adjust, [10, 0])
            else:
                #print(f"No low temperature data available for {month}/{day}")
                pass
            #mean_max,record_high = np.percentile(np.array(noaa_data_weighted.get_all_day_values_of_key("high_temp", month=month, day=day)) - temperature_elev_adjust, [90, 100])
            #mean_min, record_low = np.percentile(np.array(noaa_data_weighted.get_all_day_values_of_key("low_temp", month=month, day=day)) - temperature_elev_adjust, [10, 0])
            
            if sun_angle is not None:
                sun_angle_list.append(sun_angle)
            if daylight is not None:
                daylight_hours_list.append(daylight)
            if record_high is not None:
                daily_record_high.append(record_high)
            if record_low is not None:
                daily_record_low.append(record_low)
            if mean_max is not None:
                daily_mean_max.append(mean_max)
            if mean_min is not None:
                daily_mean_min.append(mean_min)
            
    print("Time NWS to NOAA adjust: ", time.time() - start_time, "seconds")

    for i, date in enumerate(dates_noaa):
        year, month, day = date

        #This fills in the missing data for the NWS stations before april 2019
        #TODO add a regression method to calculate these results more accurately
        nws_data_for_day = nws_data_weighted.get_all_data_for_day(year, month, day)
        if nws_data_for_day is None:
            if avg_data_for_month[month-1] is None:
                wind_spd =0
                wind_dir = 0
                sunshine_percent = 0
            else:
                wind_spd = avg_data_for_month[month-1]["wind_spd"]
                wind_dir = avg_data_for_month[month-1]["wind_dir"]
                sunshine_percent = avg_data_for_month[month-1]["sunshine_percent"]

        else:
            wind_spd = nws_data_for_day["wind_spd"]
            sunshine_percent = nws_data_for_day["sunshine_percent"]
            wind_dir = nws_data_for_day["wind_dir"]
            

        sun_angle = sun_angle_list[(i%366)-1]
        daylight_hours = daylight_hours_list[(i%366)-1]
        uv_index = calc_uv_index(sun_angle, target_elevation, sunshine_percent)
        sunlight_hours = daylight_hours * sunshine_percent / 100

        aparent_high = calc_aparent_temp(high_temp_list_np[i], dewpoints[i], wind_spd)
        aparent_low = calc_aparent_temp(low_temp_list_np[i], dewpoints[i], wind_spd)
        record_high = daily_record_high[(i%366)-1]
        record_low = daily_record_low[(i%366)-1]
        mean_max = daily_mean_max[(i%366)-1]
        mean_min = daily_mean_min[(i%366)-1]
        
        comfort_index = calc_comfort_index(mean_temp_list_np[i], dewpoints[i], precip_in_list_np[i], wind_spd, uv_index, sunshine_percent/100, (aparent_high + aparent_low) / 2)
        noaa_data_weighted.add_data(*date, high_temp=high_temp_list_np[i], mean_temp=mean_temp_list_np[i], low_temp=low_temp_list_np[i], precip_in= precip_in_list_np[i], snow_in=snow_in_list_np[i], dewpoint_temp=dewpoints[i], humidity_percent=humidity[i], precip_days=precip_days[i], snow_days=snow_days[i], HDD=hdd_list_np[i], CDD=cdd_list_np[i] ,apparent_high_temp=aparent_high, apparent_low_temp=aparent_low, sun_angle=sun_angle, uv_index=uv_index, comfort_index=comfort_index, daylight_hours=daylight_hours, sunshine_hours=sunlight_hours, wind_spd=wind_spd, wind_dir=wind_dir, sunshine_percent=sunshine_percent, record_high_temp=record_high, record_low_temp=record_low, mean_max_temp=mean_max, mean_min_temp=mean_min)


    daily_growing_chance_data = []
    for month in range(1, 13):
        for day in range (1, 32):
            if is_valid_date(2020, month, day): #2020 chosen because of leap year
                data = noaa_data_weighted.get_all_data_for_month_and_day(month, day, 'low_temp')
                if data is not None or data != []:
                    daily_growing_chance_data.append((month, day, calc_growing_chance(data)))

    growing_chance_SMA = calculate_rolling_average(daily_growing_chance_data, 7)
    filtered_growing_chance_SMA = [(month, day, value) for (month, day, value) in growing_chance_SMA if value is not None]

    #for index, (month, day, value) in enumerate(filtered_growing_chance_SMA):
    #    print(f"Index {index}: Month {month}, Day {day}, Growing Chance SMA: {value}")


    #TODO this is broken 
    growing_season = first_last_freeze_date(filtered_growing_chance_SMA)
            





    '''

    print("\n\nWEIGHTED DATA:")
    for i in range(1, 13):
        data = noaa_data_weighted.get_avg_monthly_data(i)
        if data is not None:
            print("Monthly (Month {}):".format(i), "High: {:.1f}, Mean: {:.1f}, Low: {:.1f}, Dewpoint: {:.1f}, Humidity: {:.1f}, Precip: {:.1f}in {:.1f}d, Snow: {:.1f}in {:.1f}d".format(
                round(data["high_temp"], 1), round(data["mean_temp"], 1), round(data["low_temp"], 1),
                round(data["dewpoint_temp"], 1), round(data["humidity_percent"], 1), round(data["precip_in"]*30, 1), round(data["precip_days"]*30, 1), round(data["snow_in"]*30, 1), round(data["snow_days"]*30, 1)
            ))
        else:
            print("Monthly (Month {}): No data available".format(i))

    annual_data = noaa_data_weighted.get_avg_annual_data()
    if annual_data is not None:
        print("ANNUAL:")
        print("High: {:.1f}, Mean: {:.1f}, Low: {:.1f}, Dewpoint: {:.1f}, Humidity: {:.1f}, Precip: {:.1f}in {:.1f}d, Snow: {:.1f}in {:.1f}d".format(
            round(annual_data["high_temp"], 1), round(annual_data["mean_temp"], 1), round(annual_data["low_temp"], 1),
            round(annual_data["dewpoint_temp"], 1), round(annual_data["humidity_percent"], 1), round(annual_data["precip_in"]*365, 1), round(annual_data['precip_days']*365, 1), round(annual_data["snow_in"]*365, 1), round(annual_data['snow_days']*365, 1)
        ))
    else:
        print("ANNUAL: No data available")
   ''' 

    weather_data = HistoricalWeatherData()
    noaa_annual_data = noaa_data_weighted.get_avg_annual_data()
    index = 0

    avg_annual_data_dict = {
        'high_temp': noaa_annual_data["high_temp"],
        'mean_temp': noaa_annual_data["mean_temp"],
        'low_temp': noaa_annual_data["low_temp"],
        'mean_max_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_max_temp"))),
        'mean_min_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_min_temp"))),
        'record_high_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("record_high_temp"))),
        'record_low_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("record_low_temp"))),
        'apparent_high_temp': noaa_annual_data["apparent_high_temp"],
        'apparent_low_temp': noaa_annual_data["apparent_low_temp"],
        'HDD': noaa_annual_data["HDD"] * DAYS_IN_YEAR,
        'CDD': noaa_annual_data["CDD"] * DAYS_IN_YEAR,
        'precip_in': noaa_annual_data["precip_in"] * DAYS_IN_YEAR,
        'snow_in': noaa_annual_data["snow_in"] * DAYS_IN_YEAR,
        'precip_days': noaa_annual_data["precip_days"] * DAYS_IN_YEAR,
        'snow_days': noaa_annual_data["snow_days"] * DAYS_IN_YEAR,
        'dewpoint_temp': noaa_annual_data["dewpoint_temp"],
        'humidity_percent': noaa_annual_data["humidity_percent"],
        'wind_spd': noaa_annual_data["wind_spd"],
        'wind_dir': noaa_annual_data["wind_dir"],
        'sunshine_percent': noaa_annual_data["sunshine_percent"],
        'sunshine_days': (noaa_annual_data["sunshine_percent"]/100) * DAYS_IN_YEAR,
        'daylight_hours': noaa_annual_data["daylight_hours"] * DAYS_IN_YEAR,
        'sunshine_hours': noaa_annual_data["sunshine_hours"] * DAYS_IN_YEAR,
        'sun_angle': noaa_annual_data["sun_angle"],
        'uv_index': noaa_annual_data["uv_index"],
        'comfort_index': noaa_annual_data["comfort_index"],
        'first_freeze': growing_season[0],
        'last_freeze': growing_season[1],
        'frost_free_days': growing_season[2],

    }

    weather_data.avg_annual = avg_annual_data_dict

    for month in range(1,13):
        noaa_monthly_data = noaa_data_weighted.get_avg_monthly_data(month=month)

        avg_monthly_data_dict = {
            'high_temp': noaa_monthly_data["high_temp"],
            'mean_temp': noaa_monthly_data["mean_temp"],
            'low_temp': noaa_monthly_data["low_temp"],
            'mean_max_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_max_temp", month=month))),
            'mean_min_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_min_temp", month=month))),
            'record_high_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("record_high_temp", month=month))),
            'record_low_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("record_low_temp", month=month))),
            'apparent_high_temp': noaa_monthly_data["apparent_high_temp"],
            'apparent_low_temp': noaa_monthly_data["apparent_low_temp"],
            'HDD': noaa_monthly_data["HDD"] * DAYS_IN_MONTH,
            'CDD': noaa_monthly_data["CDD"] * DAYS_IN_MONTH,
            'precip_in': noaa_monthly_data["precip_in"] * DAYS_IN_MONTH,
            'snow_in': noaa_monthly_data["snow_in"] * DAYS_IN_MONTH,
            'precip_days': noaa_monthly_data["precip_days"] * DAYS_IN_MONTH,
            'snow_days': noaa_monthly_data["snow_days"] * DAYS_IN_MONTH,
            'dewpoint_temp': noaa_monthly_data["dewpoint_temp"],
            'humidity_percent': noaa_monthly_data["humidity_percent"],
            'wind_spd': noaa_monthly_data["wind_spd"],
            'wind_dir': noaa_monthly_data["wind_dir"],
            'sunshine_percent': noaa_monthly_data["sunshine_percent"],
            'sunshine_days': (noaa_monthly_data["sunshine_percent"]/100) * DAYS_IN_MONTH,
            'daylight_hours': noaa_monthly_data["daylight_hours"] * DAYS_IN_MONTH,
            'sunshine_hours': noaa_monthly_data["sunshine_hours"] * DAYS_IN_MONTH,
            'sun_angle': noaa_monthly_data["sun_angle"],
            'uv_index': noaa_monthly_data["uv_index"],
            'comfort_index': noaa_monthly_data["comfort_index"],
            'growing_season': growing_chance_SMA[index][2],

        }
        weather_data.avg_monthly.append(avg_monthly_data_dict)
        for day in range (1, 32):
            if not is_valid_date(2020, month, day):
                break
            noaa_daily_data = noaa_data_weighted.get_avg_daily_data(month=month, day=day)
            if noaa_daily_data is None:
                continue
            avg_daily_data_dict = {
                'high_temp': noaa_daily_data["high_temp"],
                'mean_temp': noaa_daily_data["mean_temp"],
                'low_temp': noaa_daily_data["low_temp"],
                'mean_max_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_max_temp", month=month, day=day))),
                'mean_min_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_min_temp", month=month, day=day))),
                'record_high_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("record_high_temp", month=month, day=day))),
                'record_low_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("record_low_temp", month=month, day=day))),
                'apparent_high_temp': noaa_daily_data["apparent_high_temp"],
                'apparent_low_temp': noaa_daily_data["apparent_low_temp"],
                'HDD': noaa_daily_data["HDD"],
                'CDD': noaa_daily_data["CDD"],
                'precip_in': noaa_daily_data["precip_in"],
                'snow_in': noaa_daily_data["snow_in"],
                'precip_days': noaa_daily_data["precip_days"],
                'snow_days': noaa_daily_data["snow_days"],
                'dewpoint_temp': noaa_daily_data["dewpoint_temp"],
                'humidity_percent': noaa_daily_data["humidity_percent"],
                'wind_spd': noaa_daily_data["wind_spd"],
                'wind_dir': noaa_daily_data["wind_dir"],
                'sunshine_percent': noaa_daily_data["sunshine_percent"],
                'sunshine_days': (noaa_daily_data["sunshine_percent"]/100),
                'daylight_hours': noaa_daily_data["daylight_hours"],
                'sunshine_hours': noaa_daily_data["sunshine_hours"],
                'sun_angle': noaa_daily_data["sun_angle"],
                'uv_index': noaa_daily_data["uv_index"],
                'comfort_index': noaa_daily_data["comfort_index"],
                'growing_season': growing_chance_SMA[index][2],

            }
            index += 1
            weather_data.avg_daily.append(avg_daily_data_dict)


    # Add annual data averages to the HistoricalWeatherData
    for year in range(START_NOAA_YEAR, CURRENT_YEAR+1):
        weather_data.years[year] = YearlyWeatherData()
        data = noaa_data_weighted.get_avg_annual_data(year)
        historical_annual_data_dict = {
            'high_temp': data["high_temp"],
            'mean_temp': data["mean_temp"],
            'low_temp': data["low_temp"],
            'mean_max_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_max_temp", year=year))),
            'mean_min_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_min_temp", year=year))),
            'record_high_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("record_high_temp", year=year))),
            'record_low_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("record_low_temp", year=year))),
            'apparent_high_temp': data["apparent_high_temp"],
            'apparent_low_temp': data["apparent_low_temp"],
            'HDD': data["HDD"] * DAYS_IN_YEAR,
            'CDD': data["CDD"] * DAYS_IN_YEAR,
            'precip_in': data["precip_in"] * DAYS_IN_YEAR,
            'snow_in': data["snow_in"] * DAYS_IN_YEAR,
            'precip_days': data["precip_days"] * DAYS_IN_YEAR,
            'snow_days': data["snow_days"] * DAYS_IN_YEAR,
            'dewpoint_temp': data["dewpoint_temp"],
            'humidity_percent': data["humidity_percent"],
            'wind_spd': data["wind_spd"],
            'wind_dir': data["wind_dir"],
            'sunshine_percent': data["sunshine_percent"],
            'sunshine_days': (data["sunshine_percent"]/100) * DAYS_IN_YEAR,
            'daylight_hours': data["daylight_hours"] * DAYS_IN_YEAR,
            'sunshine_hours': data["sunshine_hours"] * DAYS_IN_YEAR,
            'sun_angle': data["sun_angle"],
            'uv_index': data["uv_index"],
            'comfort_index': data["comfort_index"],
        }
        for month in range(1,13):
            month_data = noaa_data_weighted.get_avg_monthly_data(month, year)
            if month_data is None:
                break
            weather_data.years[year].months[month] = MonthlyWeatherData()
            
            historical_month_data_dict = {
                'high_temp': month_data["high_temp"],
                'mean_temp': month_data["mean_temp"],
                'low_temp': month_data["low_temp"],
                'mean_max_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_max_temp", year=year, month=month))),
                'mean_min_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("mean_min_temp", year=year, month=month))),
                'record_high_temp': np.max(np.array(noaa_data_weighted.get_all_day_values_of_key("record_high_temp", year=year, month=month))),
                'record_low_temp': np.min(np.array(noaa_data_weighted.get_all_day_values_of_key("record_low_temp", year=year, month=month))),
                'apparent_high_temp': month_data["apparent_high_temp"],
                'apparent_low_temp': month_data["apparent_low_temp"],
                'HDD': month_data["HDD"] * DAYS_IN_MONTH,
                'CDD': month_data["CDD"] * DAYS_IN_MONTH,
                'precip_in': month_data["precip_in"] * DAYS_IN_MONTH,
                'snow_in': month_data["snow_in"] * DAYS_IN_MONTH,
                'precip_days': month_data["precip_days"] * DAYS_IN_MONTH,
                'snow_days': month_data["snow_days"] * DAYS_IN_MONTH,
                'dewpoint_temp': month_data["dewpoint_temp"],
                'humidity_percent': month_data["humidity_percent"],
                'wind_spd': month_data["wind_spd"],
                'wind_dir': month_data["wind_dir"],
                'sunshine_percent': month_data["sunshine_percent"],
                'sunshine_days': (month_data["sunshine_percent"]/100) * DAYS_IN_MONTH,
                'daylight_hours': month_data["daylight_hours"] * DAYS_IN_MONTH,
                'sunshine_hours': month_data["sunshine_hours"] * DAYS_IN_MONTH,
                'sun_angle': month_data["sun_angle"],
                'uv_index': month_data["uv_index"],
                'comfort_index': month_data["comfort_index"],
            }
            for day in range(1,32):
                day_data = noaa_data_weighted.get_avg_daily_data(month, day, year)
                if day_data is None:
                    break
                weather_data.years[year].months[month].days[day] = DailyWeatherData()
                

                historical_day_data_dict = {
                    'high_temp': day_data["high_temp"],
                    'mean_temp': day_data["mean_temp"],
                    'low_temp': day_data["low_temp"],
                    'mean_max_temp': day_data["mean_max_temp"],
                    'mean_min_temp': day_data["mean_min_temp"],
                    'record_high_temp': day_data["record_high_temp"],
                    'record_low_temp': day_data["record_low_temp"],
                    'apparent_high_temp': day_data["apparent_high_temp"],
                    'apparent_low_temp': day_data["apparent_low_temp"],
                    'HDD': day_data["HDD"],
                    'CDD': day_data["CDD"],
                    'precip_in': day_data["precip_in"],
                    'snow_in': day_data["snow_in"],
                    'precip_days': day_data["precip_days"],
                    'snow_days': day_data["snow_days"],
                    'dewpoint_temp': day_data["dewpoint_temp"],
                    'humidity_percent': day_data["humidity_percent"],
                    'wind_spd': day_data["wind_spd"],
                    'wind_dir': day_data["wind_dir"],
                    'sunshine_percent': day_data["sunshine_percent"],
                    'sunshine_days': (day_data["sunshine_percent"]/100),
                    'daylight_hours': day_data["daylight_hours"],
                    'sunshine_hours': day_data["sunshine_hours"],
                    'sun_angle': day_data["sun_angle"],
                    'uv_index': day_data["uv_index"],
                    'comfort_index': day_data["comfort_index"],
                }
            
                weather_data.years[year].months[month].days[day].day = historical_day_data_dict
            weather_data.years[year].months[month].avg_monthly = historical_month_data_dict
        weather_data.years[year].avg_annual = historical_annual_data_dict
    #print("DATA: Month ",  weather_data.years[2020].months[1].avg_monthly)
    #print("DATA: Daily ",  weather_data.years[2020].months[1].days[1].day)


    location_data = LocationData()
    location_data.elevation = target_elevation
    mean_temp_values = [month_data['mean_temp'] for month_data in weather_data.avg_monthly]
    precip_values = [month_data['precip_in'] for month_data in weather_data.avg_monthly]

    location_data.koppen = calc_koppen_climate(mean_temp_values, precip_values)
    location_data.plant_hardiness = calc_plant_hardiness(weather_data.avg_annual['mean_min_temp'])

    print("Location: ", location_data.elevation, location_data.koppen, location_data.plant_hardiness)

    return weather_data, location_data


    #WEATHER OBJ
        #AVG ANNUAL 
        #AVG MONTHLY
        #AVG DAILY
        #HISTORICAL {1980-2023}
            #AVG YEAR
                #AVG MONTH
                    #DAILY



