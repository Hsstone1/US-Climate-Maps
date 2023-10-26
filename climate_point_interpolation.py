import os
import glob
import numpy as np
import pandas as pd
from climate_point_interpolation_helpers import *
import time
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

'''
NWS STATIONS: Has information on the average wind speed, direction, gust and sunlight
NOAA STATIONS: Has all other information, including temperature, precip, snow

There are many more NOAA stations, with a much longer history for improved accuracy.
The NWS stations are used largely to get sunlight data. 

'''

#TODO if the start date is more recent than 2019-04-01 there is an error involving the regresion
NUM_NWS_SAMPLE_STATIONS = 10
NUM_NOAA_SAMPLE_STATIONS = 10
CURRENT_YEAR = int(time.strftime("%Y"))
START_DATE = '1980-01-01'
END_DATE = f'{CURRENT_YEAR}-12-31'
ELEV_TEMPERATURE_CHANGE = 4



def optimized_climate_data(target_lat, target_lon, target_elevation):
    df_stations_NWS_names = pd.read_csv('lat_lon_identifier_elev_name.csv')
    df_stations_NOAA_names = put_NOAA_csvs_name_into_df()

    # Get a list of closest points to coordinate
    closest_points_NWS = nearest_coordinates_to_point_NWS(target_lat, target_lon, df_stations_NWS_names, num_results=NUM_NWS_SAMPLE_STATIONS)
    closest_points_NOAA = nearest_coordinates_to_point_NOAA(target_lat, target_lon, df_stations_NOAA_names, num_results=NUM_NOAA_SAMPLE_STATIONS)

    # Compute inverse weighted average so closest distance has most weight
    # The higher the weight power, the more the weights are skewed towards the closest point

    weights_NWS = inverse_dist_weights(closest_points_NWS, weight_power=1)
    weights_NOAA = inverse_dist_weights(closest_points_NOAA, weight_power=1)


    # Get the historical weather for each location
    nws_station_identifiers = [(entry[2],entry[3]) for entry in closest_points_NWS]
    noaa_station_files = list(station[2] + "_" + str(station[0]) + "_" + str(station[1]) + "_" + str(round(station[3])) + "_" + station[4] + ".csv" for station in closest_points_NOAA)
    elev_values = [entry[3] for entry in closest_points_NOAA]
    average_weighted_elev = sum(elevation * weight for elevation, weight in zip(elev_values, weights_NOAA))
    elev_diff = target_elevation - average_weighted_elev


    #print("TEST NWS STATIONS: ", nws_station_identifiers)
    print("TEST NWS WEIGHTS: ", weights_NWS)
    #print("TEST NOAA FILES: ", noaa_station_files)
    print("TEST NOAA WEIGHTS: ", weights_NOAA)

    '''
    zip function to unpack the tuple thats returned by process_noaa_station_data. 
    This results in two lists: all_data_frames and cols_to_aggregate_lists. 
    The former is a list of dataframes and the latter is a list of lists containing column names.
    The data is flattened and deduplicated the cols_to_aggregate_lists to get the unique cols_to_aggregate list.
    This is then passed to the aggregate_data function.
    '''
    # Process each CSV and combine the dataframes into one
    noaa_all_data_frames, noaa_cols_to_aggregate_lists = zip(*[process_noaa_station_data(station, weight, elev_diff) for station, weight in zip(noaa_station_files, weights_NOAA)])
    noaa_all_data = pd.concat(noaa_all_data_frames, ignore_index=True)
    noaa_cols_to_aggregate = list(set([col for sublist in noaa_cols_to_aggregate_lists for col in sublist]))

    # Compute the weighted average across all stations for each date
    noaa_final_data = noaa_all_data.groupby('DATE').sum().reset_index()
    noaa_final_data = aggregate_data(noaa_all_data, noaa_cols_to_aggregate)
    noaa_final_data.set_index('DATE', inplace=True)

    #Outlier Detection
    ########################################################################
    WINDOW_SIZE = 30  # for example, 15 days before and 15 days after
    STD_DEV = 3
    df = pd.DataFrame()
    df['high_Rolling_Mean'] = noaa_final_data['DAILY_HIGH_AVG'].rolling(window=WINDOW_SIZE, center=True).mean()
    df['high_Rolling_Std'] = noaa_final_data['DAILY_HIGH_AVG'].rolling(window=WINDOW_SIZE, center=True).std()

    df['low_Rolling_Mean'] = noaa_final_data['DAILY_LOW_AVG'].rolling(window=WINDOW_SIZE, center=True).mean()
    df['low_Rolling_Std'] = noaa_final_data['DAILY_LOW_AVG'].rolling(window=WINDOW_SIZE, center=True).std()

    df['high_Is_Outlier'] = ((noaa_final_data['DAILY_HIGH_AVG'] < (df['high_Rolling_Mean'] - STD_DEV * df['high_Rolling_Std'])) | 
                    (noaa_final_data['DAILY_HIGH_AVG'] > (df['high_Rolling_Mean'] + STD_DEV * df['high_Rolling_Std'])))
    df['low_Is_Outlier'] = ((noaa_final_data['DAILY_LOW_AVG'] < (df['low_Rolling_Mean'] - STD_DEV * df['low_Rolling_Std'])) | 
                    (noaa_final_data['DAILY_LOW_AVG'] > (df['low_Rolling_Mean'] + STD_DEV * df['low_Rolling_Std'])))
    
    # Replace high temperature outliers with their respective rolling mean
    noaa_final_data.loc[df['high_Is_Outlier'], 'DAILY_HIGH_AVG'] = df.loc[df['high_Is_Outlier'], 'high_Rolling_Mean']
    noaa_final_data.loc[df['low_Is_Outlier'], 'DAILY_LOW_AVG'] = df.loc[df['low_Is_Outlier'], 'low_Rolling_Mean']
    noaa_final_data['DAILY_MEAN_AVG'] = (noaa_final_data['DAILY_HIGH_AVG'] + noaa_final_data['DAILY_LOW_AVG'])/2
    
    
    start_time = time.time()
    noaa_final_data["DAILY_DEWPOINT_AVG"] = dewpoint_regr_calc(noaa_final_data["DAILY_HIGH_AVG"], noaa_final_data["DAILY_LOW_AVG"], noaa_final_data["DAILY_PRECIP_AVG"])
    print("FINISHED REGR: ", time.time() - start_time)
    noaa_final_data["NUM_HIGH_DEWPOINT_DAYS"] = (noaa_final_data["DAILY_DEWPOINT_AVG"] > 70).astype(int)
    
    noaa_final_data["DAILY_HUMIDITY_AVG"] = calc_humidity_percentage_vector(noaa_final_data["DAILY_DEWPOINT_AVG"], noaa_final_data["DAILY_MEAN_AVG"])
    noaa_final_data["DAILY_MORNING_HUMIDITY_AVG"] = calc_humidity_percentage_vector(noaa_final_data["DAILY_DEWPOINT_AVG"], noaa_final_data["DAILY_LOW_AVG"])
    noaa_final_data["DAILY_AFTERNOON_HUMIDITY_AVG"] = calc_humidity_percentage_vector(noaa_final_data["DAILY_DEWPOINT_AVG"], noaa_final_data["DAILY_HIGH_AVG"])
    
    noaa_final_data["DAILY_HUMIDITY_AVG"] = noaa_final_data["DAILY_HUMIDITY_AVG"].clip(0, 100)
    noaa_final_data["DAILY_MORNING_HUMIDITY_AVG"] = noaa_final_data["DAILY_MORNING_HUMIDITY_AVG"].clip(0, 100)
    noaa_final_data["DAILY_AFTERNOON_HUMIDITY_AVG"] = noaa_final_data["DAILY_AFTERNOON_HUMIDITY_AVG"].clip(0, 100)
    noaa_final_data["DAILY_MORNING_FROST_CHANCE"] = 100 * ((noaa_final_data["DAILY_MORNING_HUMIDITY_AVG"] > 90) & (noaa_final_data["DAILY_LOW_AVG"] <= 32)).astype(int)

    noaa_final_data['HDD'] = np.maximum(65 - noaa_final_data['DAILY_MEAN_AVG'], 0)
    noaa_final_data['CDD'] = np.maximum(noaa_final_data['DAILY_MEAN_AVG'] - 65, 0)
    noaa_final_data['DAILY_GROWING_CHANCE'] = calc_growing_chance_vectorized(noaa_final_data, window_size=30)
    
    noaa_final_data = calculate_statistic_by_date(noaa_final_data, 'DAILY_HIGH_AVG', 'max', 'DAILY_RECORD_HIGH')
    noaa_final_data = calculate_statistic_by_date(noaa_final_data, 'DAILY_LOW_AVG', 'min', 'DAILY_RECORD_LOW')
    noaa_final_data = calculate_statistic_by_date(noaa_final_data, 'DAILY_HIGH_AVG', 'percentile', 'DAILY_EXPECTED_MAX')
    noaa_final_data = calculate_statistic_by_date(noaa_final_data, 'DAILY_LOW_AVG', 'percentile', 'DAILY_EXPECTED_MIN')
    noaa_final_data['DATE'] = noaa_final_data.index



    # Process each CSV and combine the dataframes into one
    nws_all_data_frames, nws_cols_to_aggregate_lists = zip(*[process_nws_station_data(station[0], station[1], weight, elev_diff) for station, weight in zip(nws_station_identifiers, weights_NWS)])
    nws_all_data = pd.concat(nws_all_data_frames, ignore_index=True)
    nws_cols_to_aggregate = list(set([col for sublist in nws_cols_to_aggregate_lists for col in sublist]))

    # Compute the weighted average across all stations for each date
    nws_final_data = nws_all_data.groupby('DATE').sum().reset_index()
    nws_final_data = aggregate_data(nws_all_data, nws_cols_to_aggregate)
    nws_final_data.set_index('DATE', inplace=True)


    #####################################################################
    #Regression
    # Convert the 'date' column to datetime type if it's not already
    noaa_final_data = noaa_final_data.drop(columns='DATE').reset_index()
    nws_final_data = nws_final_data.reset_index()
    
    noaa_final_data['DATE'] = pd.to_datetime(noaa_final_data['DATE'])
    nws_final_data['DATE'] = pd.to_datetime(nws_final_data['DATE'])
    
    # Merge the two dataframes on the date column
    combined = pd.merge(noaa_final_data, nws_final_data, on='DATE', how='left')
    combined['DATE'] = pd.to_datetime(combined['DATE'])

    # predict these columns
    predict_columns = ['DAILY_WIND_DIR_AVG', 'DAILY_WIND_AVG', 'DAILY_SUNSHINE_AVG']

    # Columns used to make predictions
    feature_columns = ['DAILY_HIGH_AVG', 'DAILY_LOW_AVG', 'DAILY_PRECIP_AVG', 'DAILY_SNOW_AVG']

    # Dataframe for dates where nws data is available
    train_df = combined.dropna(subset=predict_columns)

    # Split the training data
    X_train = train_df[feature_columns]
    y_train = train_df[predict_columns]

    # Initialize and train the model
    model = RandomForestRegressor(random_state=0)
    model.fit(X_train, y_train)

    # Identify the rows where 'DAILY_WIND_DIR_AVG', 'DAILY_WIND_AVG', 'DAILY_SUNSHINE_AVG' are NaN
    # April 1st, 2019 is the start of the nws dataset
    date_limit = pd.Timestamp('2019-04-01')
    missing_data = combined[(combined['DAILY_SUNSHINE_AVG'].isna()) & (combined['DATE'] < date_limit)]

    # Predict values where the data is missing
    X_missing = missing_data[feature_columns]
    predictions = model.predict(X_missing)

    #TODO there is warning being raised somewhere here
    '''
    RuntimeWarning: invalid value encountered in sqrt
    result = getattr(ufunc, method)(*inputs, **kwargs)
    '''
    
    # This assumes 'DATE' or any other unique identifier is the index in 'combined' and 'missing_data' DataFrames
    index_for_update = missing_data.index

    for i, column in enumerate(predict_columns):
        combined.loc[index_for_update, column] = predictions[:, i]

    # Update the combined dataframe
    combined.update(missing_data)
    #print("COMBINED", combined)


    combined['DATE'] = pd.to_datetime(combined['DATE'])
    combined.set_index('DATE', inplace=True)
    combined['DAY_OF_YEAR'] = combined.index.dayofyear
    combined['DATE'] = combined.index

    sun_data = calc_sun_angle_and_daylight_length(target_lat)
    sun_df = pd.DataFrame(sun_data, columns=['DAY_OF_YEAR', 'SUN_ANGLE', 'DAYLIGHT_LENGTH'])
    combined = combined.merge(sun_df, on='DAY_OF_YEAR', how='left')
    combined.drop(columns=['DAY_OF_YEAR'], inplace=True)

    
    combined['SUNNY_DAYS'] =  (combined['DAILY_SUNSHINE_AVG'] > 70).astype(int)
    combined['PARTLY_CLOUDY_DAYS'] = ((combined['DAILY_SUNSHINE_AVG'] > 30) & (combined['DAILY_SUNSHINE_AVG'] <= 70)).astype(int)
    combined['CLOUDY_DAYS'] =  (combined['DAILY_SUNSHINE_AVG'] <= 30).astype(int)
    combined['UV_INDEX'] = calc_uv_index_vectorized(combined['SUN_ANGLE'], target_elevation, combined['DAILY_SUNSHINE_AVG'])
    combined['APPARENT_HIGH_AVG'] = calc_aparent_temp_vector(combined['DAILY_HIGH_AVG'], combined['DAILY_DEWPOINT_AVG'], combined['DAILY_WIND_AVG'])
    combined['APPARENT_LOW_AVG'] = calc_aparent_temp_vector(combined['DAILY_LOW_AVG'], combined['DAILY_DEWPOINT_AVG'], combined['DAILY_WIND_AVG'])
    combined['APPARENT_MEAN_AVG'] = (combined['APPARENT_HIGH_AVG'] + combined['APPARENT_LOW_AVG'])/2
    combined['DAILY_COMFORT_INDEX'] = calc_comfort_index_vector(combined['DAILY_MEAN_AVG'], combined['APPARENT_HIGH_AVG'],  combined['DAILY_DEWPOINT_AVG'], combined['DAILY_SUNSHINE_AVG'])
    combined['SUNSHINE_HOURS'] = combined['DAYLIGHT_LENGTH'] * (combined['DAILY_SUNSHINE_AVG']/100)





    # Converting dataframe into useful dictionary for json return
    #########################################################################
    
    
    df_numeric = combined.select_dtypes(include=[np.number])
    df_date = combined[['DATE']] if 'DATE' in combined else None

    if df_date is not None:
        df = pd.concat([df_date, df_numeric], axis=1)
    else:
        raise KeyError("The 'DATE' column was not found in the original DataFrame.")

    df['DATE'] = pd.to_datetime(df['DATE'])
    df.set_index('DATE', inplace=True)

    df.columns = df.columns.str.replace('DAILY_', '')


    # Calculate averages
    #avg_annual = df.resample('Y').mean().to_dict(orient='records')

    

    # Calculate averages
    avg_annual = df.mean().to_dict()
    
    max_columns = ['RECORD_HIGH', 'EXPECTED_MAX']
    min_columns = ['EXPECTED_MIN', 'RECORD_LOW']

    for column in max_columns:
        avg_annual[column] = df[column].resample('Y').max().mean()

    for column in min_columns:
        avg_annual[column] = df[column].resample('Y').min().mean()

    monthly_averages = df.resample('M').mean().groupby(lambda x: x.month).mean()
    monthly_max = df[max_columns].resample('M').max().groupby(lambda x: x.month).mean()
    monthly_min = df[min_columns].resample('M').min().groupby(lambda x: x.month).mean()

    avg_monthly = []
    for month in range(1, 13):  # Iterating over months
        month_data = monthly_averages.loc[month].to_dict()
        for column in max_columns:
            month_data[column] = monthly_max.loc[month, column]
        for column in min_columns:
            month_data[column] = monthly_min.loc[month, column]
        avg_monthly.append(month_data)
    
    avg_daily = df.resample('D').mean().groupby(lambda x: (x.month, x.day)).mean().to_dict(orient='records')
    
    # Adjustments for annual and monthly values
    process_columns = ['CDD', 'HDD', 'CLOUDY_DAYS', 'PARTLY_CLOUDY_DAYS', 'SUNNY_DAYS', 'SNOW_DAYS', 'PRECIP_DAYS', 'SNOW_AVG', 'PRECIP_AVG', 'SUNSHINE_HOURS', 'NUM_HIGH_DEWPOINT_DAYS']
    for column in process_columns:
        if column in avg_annual:
            avg_annual[column] *= 365
        for month_data in avg_monthly:
            if column in month_data:
                month_data[column] *= 30
    # Historical data
    historical = {}
    for year, year_df in df.groupby(df.index.year): 
        # Convert Timestamp to string in the desired format
        annual_data = year_df.mean(numeric_only=True).to_dict()
        monthly_data = year_df.resample('M').mean().rename(lambda x: x.strftime('%m/%Y')).to_dict(orient='records')  # Removed on='DATE'
        daily_data = year_df.resample('D').mean().rename(lambda x: x.strftime('%m/%d/%Y')).to_dict(orient='records')  # Removed on='DATE' and changed to_dict()

        historical[year] = {
            'annual': annual_data,
            'monthly': monthly_data,
            'daily': daily_data,
        }

    # Handle infinite values and NaN
    def handle_nan(obj):
        if isinstance(obj, float) and np.isnan(obj):
            return None
        elif isinstance(obj, np.float_):  # This checks for NumPy float types
            return float(obj) if not np.isnan(obj) else None
        elif isinstance(obj, np.int_):  # This checks for NumPy int types
            return int(obj)
        elif isinstance(obj, (list, tuple, np.ndarray)):
            return [handle_nan(item) for item in obj]
        elif isinstance(obj, dict):
            return {k: handle_nan(v) for k, v in obj.items()}
        return obj

    result = {
        'avg_annual': avg_annual,
        'avg_monthly': avg_monthly,
        'avg_daily': avg_daily,
        'historical': historical,
    }

    # Apply the handle_nan function to clean the entire result structure
    climate_data = handle_nan(result)


    mean_temp_values = [month_data['MEAN_AVG'] for month_data in avg_monthly]
    precip_values = [month_data['PRECIP_AVG'] for month_data in avg_monthly]

    location_data = {
        'elevation': target_elevation,
        'koppen': calc_koppen_climate(mean_temp_values, precip_values),
        'plant_hardiness': calc_plant_hardiness(avg_annual['EXPECTED_MIN']),
    }

    return climate_data, location_data


def process_noaa_station_data(station, weight, elev_diff):
    # Read the CSV data
    file_path = f"{os.getcwd()}\\STATIONS\\NOAA-STATIONS\\" + station
    df = pd.read_csv(file_path, usecols= ['DATE', 'PRCP', 'SNOW', 'TMAX', 'TMIN'])
    
    # Convert the 'DATE' column to datetime and filter rows based on the date range
    df['DATE'] = pd.to_datetime(df['DATE'])
    df = df[(df['DATE'] >= START_DATE) & (df['DATE'] <= END_DATE)]
    
    elev_diff /= 1000
    
    # Apply the computations to create the new columns
    df['DAILY_HIGH_AVG'] = (df['TMAX'] * 9 / 50 + 32 - elev_diff * ELEV_TEMPERATURE_CHANGE)
    df['DAILY_LOW_AVG'] = (df['TMIN'] * 9 / 50 + 32- elev_diff * ELEV_TEMPERATURE_CHANGE)
    df['DAILY_PRECIP_AVG'] = (df['PRCP'] / 254 *  min((1 + elev_diff * 0.2),2)).fillna(0)
    df['DAILY_SNOW_AVG'] = (df['SNOW'] / 25.4 *  min((1 + elev_diff * 0.2),2)).fillna(0)

    # Filter out rows where DAILY_LOW_AVG is greater than DAILY_HIGH_AVG
    df = df[df['DAILY_LOW_AVG'] <= df['DAILY_HIGH_AVG']]
    df.dropna(subset=['DAILY_HIGH_AVG', 'DAILY_LOW_AVG'], inplace=True)



    # Check for precipitation and snow above thresholds
    df['PRECIP_DAYS'] = (df['DAILY_PRECIP_AVG'] > 0.01).astype(int)
    df['SNOW_DAYS'] = (df['DAILY_SNOW_AVG'] > 0.1).astype(int)
    df['PRECIP_DAYS'] = (df['PRECIP_DAYS'] * min((1 + elev_diff * 0.03),2))
    df['SNOW_DAYS'] = (df['SNOW_DAYS'] * min((1 + elev_diff * 0.03),2))
    
    # Apply the weights
    weighted_cols = ['DAILY_HIGH_AVG', 'DAILY_LOW_AVG', 'DAILY_PRECIP_AVG', 'DAILY_SNOW_AVG', 'PRECIP_DAYS', 'SNOW_DAYS']

    df[weighted_cols] = df[weighted_cols].multiply(weight, axis=0)
    df['WEIGHT'] = weight

    return (df[['DATE', 'WEIGHT'] + weighted_cols], weighted_cols)

def process_nws_station_data(provider, city_code, weight, elev_diff):
    # Define the directory path and list of csv files
    file_path = f"{os.getcwd()}\\STATIONS\\NWS-STATIONS\\{provider}\\{city_code}\\" + f'{provider}_{city_code}.csv'
    df = pd.read_csv(file_path, usecols= ['Date', 'MAX SPD', 'DR', 'S-S'])
    elev_diff /= 1000
    # Compute the required averages with elevation adjustments since conditions change with elevation
    elevation_adjustment_for_wind = min((1 + elev_diff * 0.2), 2)
    elevation_adjustment_for_sunshine = max((1 - elev_diff * 0.1), 0)

    # Convert the 'DATE' column to datetime
    df['DATE'] = pd.to_datetime(df['Date'])

    df['DAILY_WIND_AVG'] = df['MAX SPD'].where(df['MAX SPD'] > 0, 0) * elevation_adjustment_for_wind
    df['DAILY_WIND_DIR_AVG'] = df['DR'].where(df['DR'] != 1, 0)
    df['DAILY_SUNSHINE_AVG'] = (10 * (10 - df['S-S'])).where(df['S-S'] >= 0, 0) * elevation_adjustment_for_sunshine
    df['DAILY_SUNSHINE_AVG'] = df['DAILY_SUNSHINE_AVG'].clip(lower=0, upper=100)
    
    df.dropna(subset=['DAILY_WIND_AVG', 'DAILY_WIND_DIR_AVG', 'DAILY_SUNSHINE_AVG'], inplace=True)

    weighted_cols = ['DAILY_WIND_AVG', 'DAILY_WIND_DIR_AVG', 'DAILY_SUNSHINE_AVG']

    df[weighted_cols] = df[weighted_cols].multiply(weight, axis=0)
    df['WEIGHT'] = weight
    
    return (df[['DATE', 'WEIGHT'] + weighted_cols], weighted_cols)


# Function to aggregate the data, normalizing weights in the event of missing data
def aggregate_data(all_data, cols_to_aggregate):
    # Build the aggregation dictionary dynamically based on the input columns
    agg_dict = {col: 'sum' for col in cols_to_aggregate}
    agg_dict['WEIGHT'] = 'sum'  # Add the WEIGHT column to the aggregation dictionary
    
    # Group by date and compute the sum based on the aggregation dictionary
    aggregated = all_data.groupby('DATE').agg(agg_dict).reset_index()
    
    # Calculate the weighted average for the specified columns
    for col in cols_to_aggregate:
        aggregated[col] /= aggregated['WEIGHT']

    return aggregated[['DATE'] + cols_to_aggregate]


def put_NOAA_csvs_name_into_df():
    path = f"{os.getcwd()}\\STATIONS\\NOAA-STATIONS\\"
    file_names = glob.glob(path + "*.csv")

    data = {}

    # Iterate over the file names and split them
    for file_name in file_names:
        # Remove the file extension
        file_name = file_name[:-4]

        # Split the file name using '_'
        split_values = file_name.split('_')
        # This splits the path string, pulling the station identifier out of path
        split_values[0] = split_values[0].split("\\")[9]
        column_names = ["STATION", "LAT", "LON", "ELEVATION", "NAME"]

        # Assign the split values to the corresponding columns
        for i, value in enumerate(split_values):
            #column_name = f"Column_{i+1}"  # Create column names like 'Column_1', 'Column_2', etc.
            column_name = column_names[i]
            if column_name not in data:
                data[column_name] = []
            data[column_name].append(value)
        
    df = pd.DataFrame(data)
    df["LAT"] = df["LAT"].astype(float)
    df["LON"] = df["LON"].astype(float)
    df["ELEVATION"] = df["ELEVATION"].astype(int)


    return df



