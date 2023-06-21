import pandas as pd
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
        df = get_NOAA_csv_content(file_name, '1980-01-01', '2022-12-31')

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
            months_arr['precip_days_avg'].append(round((month_df.loc[month_df['PRCP'] > 25.4, 'PRCP'].count() / num_days),0))
            months_arr['snow_days_avg'].append(round((month_df.loc[month_df['SNOW'] > 0.1, 'SNOW'].count() / num_days),0))



            # Value is squared to simulate the increased risk of frost when the value count
            # has some values bellow 0
            num_days_above_freezing = (month_df.loc[month_df['TMIN'] >= 0, 'TMIN'].count() /(len(month_df)))
            frost_free_days = num_days_above_freezing = 0 if num_days_above_freezing < 0.15 else 1 if num_days_above_freezing > 0.85 else num_days_above_freezing
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
    

    frost_free_normal =  [calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_low_avg']]
    frost_free_maxima =  [calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_mean_minimum']]
    frost_free_extreme = [calc_frost_free_chance(value) for value in monthly_values['weighted_monthly_record_low']]
    frost_free_normal_maxima = [(normal + maxima) / 2 for normal, maxima in zip(frost_free_normal, frost_free_maxima)]
    frost_free_maxima_extreme = [(maxima + extreme) / 2 for maxima, extreme in zip(frost_free_maxima, frost_free_extreme )]
    monthly_values['weighted_monthly_frost_free_days_avg'] = [.7 *frost_free_normal[i] + .2 *frost_free_maxima[i] + .01 *frost_free_extreme[i] + .05 *frost_free_normal_maxima[i] + .04*frost_free_maxima_extreme[i] for i in range(12)]
    monthly_values['weighted_monthly_frost_free_days_avg'] = [1 if value > 0.98 else value**1.5 for value in monthly_values['weighted_monthly_frost_free_days_avg']]

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
    average_snowfall_day_annualized = sum(monthly_values['weighted_monthly_snow_avg']) / sum(monthly_values['weighted_monthly_snow_days_avg'])
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
    monthly_values['monthly_sun_angle'] = [calc_sun_angle(target_lat, 2023, month+1, 21) for month in range(12)]
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
