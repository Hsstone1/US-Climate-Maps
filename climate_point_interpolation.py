import os
import glob
import shutil
import sys
import numpy as np
import pandas as pd
from sklearn.discriminant_analysis import StandardScaler
from climate_point_interpolation_helpers import *
import time
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import boto3
import platform
from concurrent.futures import ThreadPoolExecutor


"""
NWS STATIONS: Has information on the average wind speed, direction, gust and sunlight
NOAA STATIONS: Has all other information, including temperature, precip, snow

There are many more NOAA stations, with a much longer history for improved accuracy.
The NWS stations are used largely to get sunlight data. 

"""

# TODO if the start date is more recent than 2019-04-01 there is an error involving the regresion
NUM_NWS_SAMPLE_STATIONS = 10
NUM_NOAA_SAMPLE_STATIONS = 10
MAX_THREADS = 10

START_YEAR = 1980
CURRENT_YEAR = int(time.strftime("%Y"))
START_DATE = f"{START_YEAR}-01-01"
END_DATE = f"{CURRENT_YEAR}-12-31"

ELEV_TEMPERATURE_CHANGE = 4

S3_BUCKET_NAME = "us-climate-maps-bucket"


def optimized_climate_data(target_lat, target_lon, target_elevation):
    if is_running_on_aws():
        start_time = time.time()
        # Use the built-in '/tmp' directory in AWS Lambda
        temp_local_path = "/tmp/nws-station-identifiers.csv"
        get_csv_from_s3(S3_BUCKET_NAME, "nws-station-identifiers.csv", temp_local_path)
        df_stations_NWS_names = pd.read_csv(temp_local_path)
        os.remove(temp_local_path)

        temp_local_path = "/tmp/noaa-station-identifiers.csv"
        get_csv_from_s3(S3_BUCKET_NAME, "noaa-station-identifiers.csv", temp_local_path)
        df_stations_NOAA_names = pd.read_csv(temp_local_path)
        os.remove(temp_local_path)

        print("FINISHED DOWNLOADING STATIONS NAMES: ", time.time() - start_time)

    else:
        df_stations_NWS_names = pd.read_csv("nws-station-identifiers.csv")
        df_stations_NOAA_names = pd.read_csv("noaa-station-identifiers.csv")

    start_time = time.time()
    # Get a list of closest points to coordinate
    closest_points_NWS = nearest_coordinates_to_point_NWS(
        target_lat,
        target_lon,
        df_stations_NWS_names,
        num_results=NUM_NWS_SAMPLE_STATIONS,
    )
    closest_points_NOAA = nearest_coordinates_to_point_NOAA(
        target_lat,
        target_lon,
        df_stations_NOAA_names,
        num_results=NUM_NOAA_SAMPLE_STATIONS,
    )

    # Compute inverse weighted average so closest distance has most weight
    # The higher the weight power, the more the weights are skewed towards the closest point

    weights_NWS = inverse_dist_weights(closest_points_NWS, weight_power=0.25)
    weights_NOAA = inverse_dist_weights(closest_points_NOAA, weight_power=0.5)

    # Get the historical weather for each location
    nws_station_identifiers = [(entry[2], entry[3]) for entry in closest_points_NWS]
    noaa_station_files = list(
        station[2]
        + "_"
        + str(station[0])
        + "_"
        + str(station[1])
        + "_"
        + str(round(station[3]))
        + "_"
        + station[4]
        + ".csv"
        for station in closest_points_NOAA
    )
    elev_values = [entry[3] for entry in closest_points_NOAA]
    average_weighted_elev = sum(
        elevation * weight for elevation, weight in zip(elev_values, weights_NOAA)
    )
    elev_diff = target_elevation - average_weighted_elev

    print("TEST NWS STATIONS: ", nws_station_identifiers)
    print("TEST NWS WEIGHTS: ", weights_NWS)
    print("TEST NOAA FILES: ", noaa_station_files)
    print("TEST NOAA WEIGHTS: ", weights_NOAA)

    print("FINISHED GETTING WEIGHTS: ", time.time() - start_time)

    """
    zip function to unpack the tuple thats returned by process_noaa_station_data. 
    This results in two lists: all_data_frames and cols_to_aggregate_lists. 
    The former is a list of dataframes and the latter is a list of lists containing column names.
    The data is flattened and deduplicated the cols_to_aggregate_lists to get the unique cols_to_aggregate list.
    This is then passed to the aggregate_data function.
    """
    # Process each CSV and combine the dataframes into one

    start_time = time.time()

    # Process NOAA station data in parallel
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        noaa_results = executor.map(
            process_noaa_station_data,
            noaa_station_files,
            weights_NOAA,
            [elev_diff] * len(noaa_station_files),
        )

    noaa_all_data_frames, noaa_cols_to_aggregate_lists = zip(*noaa_results)
    """
    noaa_all_data_frames, noaa_cols_to_aggregate_lists = zip(
        *[
            process_noaa_station_data(station, weight, elev_diff)
            for station, weight in zip(noaa_station_files, weights_NOAA)
        ]
    )
    """
    noaa_all_data = pd.concat(noaa_all_data_frames, ignore_index=True)
    noaa_cols_to_aggregate = list(
        set([col for sublist in noaa_cols_to_aggregate_lists for col in sublist])
    )

    # Compute the weighted average across all stations for each date
    noaa_final_data = noaa_all_data.groupby("DATE").sum().reset_index()
    noaa_final_data = aggregate_data(noaa_all_data, noaa_cols_to_aggregate)
    noaa_final_data.set_index("DATE", inplace=True)

    print("FINISHED AGGREGATE FILES: ", time.time() - start_time)

    start_time = time.time()

    # Outlier Detection
    ########################################################################
    WINDOW_SIZE = 30  # for example, 15 days before and 15 days after
    STD_DEV = 3
    df = pd.DataFrame()
    df["high_Rolling_Mean"] = (
        noaa_final_data["DAILY_HIGH_AVG"]
        .rolling(window=WINDOW_SIZE, center=True)
        .mean()
    )
    df["high_Rolling_Std"] = (
        noaa_final_data["DAILY_HIGH_AVG"].rolling(window=WINDOW_SIZE, center=True).std()
    )

    df["low_Rolling_Mean"] = (
        noaa_final_data["DAILY_LOW_AVG"].rolling(window=WINDOW_SIZE, center=True).mean()
    )
    df["low_Rolling_Std"] = (
        noaa_final_data["DAILY_LOW_AVG"].rolling(window=WINDOW_SIZE, center=True).std()
    )

    df["high_Is_Outlier"] = (
        noaa_final_data["DAILY_HIGH_AVG"]
        < (df["high_Rolling_Mean"] - STD_DEV * df["high_Rolling_Std"])
    ) | (
        noaa_final_data["DAILY_HIGH_AVG"]
        > (df["high_Rolling_Mean"] + STD_DEV * df["high_Rolling_Std"])
    )
    df["low_Is_Outlier"] = (
        noaa_final_data["DAILY_LOW_AVG"]
        < (df["low_Rolling_Mean"] - STD_DEV * df["low_Rolling_Std"])
    ) | (
        noaa_final_data["DAILY_LOW_AVG"]
        > (df["low_Rolling_Mean"] + STD_DEV * df["low_Rolling_Std"])
    )

    # Replace high temperature outliers with their respective rolling mean
    noaa_final_data.loc[df["high_Is_Outlier"], "DAILY_HIGH_AVG"] = df.loc[
        df["high_Is_Outlier"], "high_Rolling_Mean"
    ]
    noaa_final_data.loc[df["low_Is_Outlier"], "DAILY_LOW_AVG"] = df.loc[
        df["low_Is_Outlier"], "low_Rolling_Mean"
    ]
    noaa_final_data["DAILY_MEAN_AVG"] = (
        noaa_final_data["DAILY_HIGH_AVG"] + noaa_final_data["DAILY_LOW_AVG"]
    ) / 2
    print("FINISHED OUTLIER DETECTION: ", time.time() - start_time)

    start_time = time.time()
    noaa_final_data["DAILY_DEWPOINT_AVG"] = dewpoint_regr_calc(
        noaa_final_data["DAILY_HIGH_AVG"],
        noaa_final_data["DAILY_LOW_AVG"],
        noaa_final_data["DAILY_PRECIP_AVG"],
    )
    print("FINISHED REGR: ", time.time() - start_time)
    noaa_final_data["NUM_HIGH_DEWPOINT_DAYS"] = (
        noaa_final_data["DAILY_DEWPOINT_AVG"] > 70
    ).astype(int)

    start_time = time.time()
    noaa_final_data["DAILY_HUMIDITY_AVG"] = calc_humidity_percentage_vector(
        noaa_final_data["DAILY_DEWPOINT_AVG"], noaa_final_data["DAILY_MEAN_AVG"]
    )
    noaa_final_data["DAILY_MORNING_HUMIDITY_AVG"] = calc_humidity_percentage_vector(
        noaa_final_data["DAILY_DEWPOINT_AVG"], noaa_final_data["DAILY_LOW_AVG"]
    )
    noaa_final_data["DAILY_AFTERNOON_HUMIDITY_AVG"] = calc_humidity_percentage_vector(
        noaa_final_data["DAILY_DEWPOINT_AVG"], noaa_final_data["DAILY_HIGH_AVG"]
    )

    noaa_final_data["DAILY_HUMIDITY_AVG"] = noaa_final_data["DAILY_HUMIDITY_AVG"].clip(
        0, 100
    )
    noaa_final_data["DAILY_MORNING_HUMIDITY_AVG"] = noaa_final_data[
        "DAILY_MORNING_HUMIDITY_AVG"
    ].clip(0, 100)
    noaa_final_data["DAILY_AFTERNOON_HUMIDITY_AVG"] = noaa_final_data[
        "DAILY_AFTERNOON_HUMIDITY_AVG"
    ].clip(0, 100)
    noaa_final_data["DAILY_MORNING_FROST_CHANCE"] = 100 * (
        (noaa_final_data["DAILY_MORNING_HUMIDITY_AVG"] > 90)
        & (noaa_final_data["DAILY_LOW_AVG"] <= 32)
    ).astype(int)

    noaa_final_data["HDD"] = np.maximum(65 - noaa_final_data["DAILY_MEAN_AVG"], 0)
    noaa_final_data["CDD"] = np.maximum(noaa_final_data["DAILY_MEAN_AVG"] - 65, 0)
    noaa_final_data["DAILY_GROWING_CHANCE"] = calc_growing_chance_vectorized(
        noaa_final_data, window_size=30
    )

    noaa_final_data = calculate_statistic_by_date(
        noaa_final_data, "DAILY_HIGH_AVG", "max", "DAILY_RECORD_HIGH"
    )
    noaa_final_data = calculate_statistic_by_date(
        noaa_final_data, "DAILY_LOW_AVG", "min", "DAILY_RECORD_LOW"
    )
    noaa_final_data = calculate_statistic_by_date(
        noaa_final_data, "DAILY_HIGH_AVG", "percentile", "DAILY_EXPECTED_MAX"
    )
    noaa_final_data = calculate_statistic_by_date(
        noaa_final_data, "DAILY_LOW_AVG", "percentile", "DAILY_EXPECTED_MIN"
    )
    noaa_final_data["DATE"] = noaa_final_data.index
    print("FINISHED CALCULATIONS: ", time.time() - start_time)

    start_time = time.time()
    # Process each CSV and combine the dataframes into one

    # Process NWS station data in parallel
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        nws_results = executor.map(
            process_nws_station_data,
            [station[0] for station in nws_station_identifiers],
            [station[1] for station in nws_station_identifiers],
            weights_NWS,
            [elev_diff] * len(nws_station_identifiers),
        )
    nws_all_data_frames, nws_cols_to_aggregate_lists = zip(*nws_results)

    """
    nws_all_data_frames, nws_cols_to_aggregate_lists = zip(
        *[
            process_nws_station_data(station[0], station[1], weight, elev_diff)
            for station, weight in zip(nws_station_identifiers, weights_NWS)
        ]
    )
    """
    nws_all_data = pd.concat(nws_all_data_frames, ignore_index=True)
    nws_cols_to_aggregate = list(
        set([col for sublist in nws_cols_to_aggregate_lists for col in sublist])
    )

    # Compute the weighted average across all stations for each date
    nws_final_data = nws_all_data.groupby("DATE").sum().reset_index()
    nws_final_data = aggregate_data(nws_all_data, nws_cols_to_aggregate)
    nws_final_data.set_index("DATE", inplace=True)
    print("FINISHED COMBINE DF: ", time.time() - start_time)

    #####################################################################
    # Regression

    start_time = time.time()
    noaa_final_data = noaa_final_data.drop(columns="DATE").reset_index()
    nws_final_data = nws_final_data.reset_index()

    noaa_final_data["DATE"] = pd.to_datetime(noaa_final_data["DATE"])
    nws_final_data["DATE"] = pd.to_datetime(nws_final_data["DATE"])

    # Merge the two dataframes on the date column
    combined = pd.merge(noaa_final_data, nws_final_data, on="DATE", how="left")
    combined["DATE"] = pd.to_datetime(combined["DATE"])

    # predict these columns
    predict_columns = ["DAILY_WIND_DIR_AVG", "DAILY_WIND_AVG", "DAILY_SUNSHINE_AVG"]

    # Columns used to make predictions
    feature_columns = [
        "DAILY_HIGH_AVG",
        "DAILY_LOW_AVG",
        "DAILY_PRECIP_AVG",
        "DAILY_SNOW_AVG",
    ]

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
    date_limit = pd.Timestamp("2019-04-01")
    missing_data = combined[
        (combined["DAILY_SUNSHINE_AVG"].isna()) & (combined["DATE"] < date_limit)
    ]

    # Predict values where the data is missing
    X_missing = missing_data[feature_columns]
    predictions = model.predict(X_missing)

    # TODO there is warning being raised somewhere here
    """
    RuntimeWarning: invalid value encountered in sqrt
    result = getattr(ufunc, method)(*inputs, **kwargs)
    """

    # This assumes 'DATE' or any other unique identifier is the index in 'combined' and 'missing_data' DataFrames
    index_for_update = missing_data.index

    for i, column in enumerate(predict_columns):
        combined.loc[index_for_update, column] = predictions[:, i]

    # Update the combined dataframe
    combined.update(missing_data)

    combined["DATE"] = pd.to_datetime(combined["DATE"])
    combined.set_index("DATE", inplace=True)
    combined["DAY_OF_YEAR"] = combined.index.dayofyear
    combined["DATE"] = combined.index

    sun_data = calc_sun_angle_and_daylight_length(target_lat)
    sun_df = pd.DataFrame(
        sun_data, columns=["DAY_OF_YEAR", "SUN_ANGLE", "DAYLIGHT_LENGTH"]
    )
    combined = combined.merge(sun_df, on="DAY_OF_YEAR", how="left")
    combined.drop(columns=["DAY_OF_YEAR"], inplace=True)

    combined["SUNNY_DAYS"] = (combined["DAILY_SUNSHINE_AVG"] > 70).astype(int)
    combined["PARTLY_CLOUDY_DAYS"] = (
        (combined["DAILY_SUNSHINE_AVG"] > 30) & (combined["DAILY_SUNSHINE_AVG"] <= 70)
    ).astype(int)
    combined["CLOUDY_DAYS"] = (combined["DAILY_SUNSHINE_AVG"] <= 30).astype(int)
    combined["UV_INDEX"] = calc_uv_index_vectorized(
        combined["SUN_ANGLE"], target_elevation, combined["DAILY_SUNSHINE_AVG"]
    )
    combined["APPARENT_HIGH_AVG"] = calc_aparent_temp_vector(
        combined["DAILY_HIGH_AVG"],
        combined["DAILY_DEWPOINT_AVG"],
        combined["DAILY_WIND_AVG"],
    )
    combined["APPARENT_LOW_AVG"] = calc_aparent_temp_vector(
        combined["DAILY_LOW_AVG"],
        combined["DAILY_DEWPOINT_AVG"],
        combined["DAILY_WIND_AVG"],
    )
    combined["APPARENT_MEAN_AVG"] = (
        combined["APPARENT_HIGH_AVG"] + combined["APPARENT_LOW_AVG"]
    ) / 2
    combined["DAILY_COMFORT_INDEX"] = calc_comfort_index_vector(
        combined["DAILY_MEAN_AVG"],
        combined["APPARENT_HIGH_AVG"],
        combined["DAILY_DEWPOINT_AVG"],
        combined["DAILY_SUNSHINE_AVG"],
    )
    combined["SUNSHINE_HOURS"] = combined["DAYLIGHT_LENGTH"] * (
        combined["DAILY_SUNSHINE_AVG"] / 100
    )

    print("FINISHED REGRESSION: ", time.time() - start_time)

    # Converting dataframe into useful dictionary for json return
    #########################################################################

    start_time = time.time()
    df_numeric = combined.select_dtypes(include=[np.number])
    df_date = combined[["DATE"]] if "DATE" in combined else None

    if df_date is not None:
        df = pd.concat([df_date, df_numeric], axis=1)
    else:
        raise KeyError("The 'DATE' column was not found in the original DataFrame.")

    df["DATE"] = pd.to_datetime(df["DATE"])
    df.set_index("DATE", inplace=True)

    df.columns = df.columns.str.replace("DAILY_", "")

    # Calculate averages
    avg_annual = df.mean().to_dict()

    max_columns = ["RECORD_HIGH", "EXPECTED_MAX"]
    min_columns = ["EXPECTED_MIN", "RECORD_LOW"]

    for column in max_columns:
        avg_annual[column] = df[column].resample("Y").max().mean()

    for column in min_columns:
        avg_annual[column] = df[column].resample("Y").min().mean()

    monthly_averages = df.resample("M").mean().groupby(lambda x: x.month).mean()
    monthly_max = df[max_columns].resample("M").max().groupby(lambda x: x.month).mean()
    monthly_min = df[min_columns].resample("M").min().groupby(lambda x: x.month).mean()

    avg_monthly = []
    for month in range(1, 13):  # Iterating over months
        month_data = monthly_averages.loc[month].to_dict()
        for column in max_columns:
            month_data[column] = monthly_max.loc[month, column]
        for column in min_columns:
            month_data[column] = monthly_min.loc[month, column]
        avg_monthly.append(month_data)

    avg_daily = (
        df.resample("D")
        .mean()
        .groupby(lambda x: (x.month, x.day))
        .mean()
        .to_dict(orient="records")
    )

    # Adjustments for annual and monthly values
    process_columns = [
        "CDD",
        "HDD",
        "CLOUDY_DAYS",
        "PARTLY_CLOUDY_DAYS",
        "SUNNY_DAYS",
        "SNOW_DAYS",
        "PRECIP_DAYS",
        "SNOW_AVG",
        "PRECIP_AVG",
        "SUNSHINE_HOURS",
        "NUM_HIGH_DEWPOINT_DAYS",
    ]
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
        monthly_data = (
            year_df.resample("M")
            .mean()
            .rename(lambda x: x.strftime("%m/%Y"))
            .to_dict(orient="records")
        )  # Removed on='DATE'
        daily_data = (
            year_df.resample("D")
            .mean()
            .rename(lambda x: x.strftime("%m/%d/%Y"))
            .to_dict(orient="records")
        )  # Removed on='DATE' and changed to_dict()

        historical[year] = {
            "annual": annual_data,
            "monthly": monthly_data,
            "daily": daily_data,
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
        "avg_annual": avg_annual,
        "avg_monthly": avg_monthly,
        "avg_daily": avg_daily,
        "historical": historical,
    }

    # Apply the handle_nan function to clean the entire result structure
    # TODO this returns much faster if the handle_nan function is not applied, but
    # the frontend will crash with the json output if this is not applied
    # Find a way around this
    # climate_data = handle_nan(result)
    climate_data = result

    mean_temp_values = [month_data["MEAN_AVG"] for month_data in avg_monthly]
    precip_values = [month_data["PRECIP_AVG"] for month_data in avg_monthly]

    location_data = {
        "elevation": target_elevation,
        "koppen": calc_koppen_climate(mean_temp_values, precip_values),
        "plant_hardiness": calc_plant_hardiness(avg_annual["EXPECTED_MIN"]),
    }

    print("FINISHED CONVERTING TO DICT: ", time.time() - start_time)
    return climate_data, location_data


def process_noaa_station_data(station, weight, elev_diff):
    USE_COLS = ["DATE", "PRCP", "SNOW", "TMAX", "TMIN"]

    # Read the CSV data
    if is_running_on_aws():
        # Use the built-in '/tmp' directory in AWS Lambda
        temp_local_path = f"/tmp/{station}"

        get_csv_from_s3(S3_BUCKET_NAME, f"NOAA-STATIONS/{station}", temp_local_path)
        df = pd.read_csv(temp_local_path, usecols=USE_COLS)
        # Delete the file from /tmp directory after reading it
        os.remove(temp_local_path)

    else:
        file_path = f"{os.getcwd()}\\STATIONS\\NOAA-STATIONS\\" + station
        df = pd.read_csv(file_path, usecols=USE_COLS)

    # Convert the 'DATE' column to datetime and filter rows based on the date range
    df["DATE"] = pd.to_datetime(df["DATE"])
    df = df[(df["DATE"] >= START_DATE) & (df["DATE"] <= END_DATE)]

    elev_diff /= 1000

    # Apply the computations to create the new columns
    df["DAILY_HIGH_AVG"] = (
        df["TMAX"] * 9 / 50 + 32 - elev_diff * ELEV_TEMPERATURE_CHANGE
    )
    df["DAILY_LOW_AVG"] = df["TMIN"] * 9 / 50 + 32 - elev_diff * ELEV_TEMPERATURE_CHANGE
    df["DAILY_PRECIP_AVG"] = (df["PRCP"] / 254 * min((1 + elev_diff * 0.2), 2)).fillna(
        0
    )
    df["DAILY_SNOW_AVG"] = (df["SNOW"] / 25.4 * min((1 + elev_diff * 0.2), 2)).fillna(0)

    # Filter out rows where DAILY_LOW_AVG is greater than DAILY_HIGH_AVG
    df = df[df["DAILY_LOW_AVG"] <= df["DAILY_HIGH_AVG"]]
    df.dropna(subset=["DAILY_HIGH_AVG", "DAILY_LOW_AVG"], inplace=True)

    # Check for precipitation and snow above thresholds
    df["PRECIP_DAYS"] = (df["DAILY_PRECIP_AVG"] > 0.01).astype(int)
    df["SNOW_DAYS"] = (df["DAILY_SNOW_AVG"] > 0.1).astype(int)
    df["PRECIP_DAYS"] = df["PRECIP_DAYS"] * min((1 + elev_diff * 0.03), 2)
    df["SNOW_DAYS"] = df["SNOW_DAYS"] * min((1 + elev_diff * 0.03), 2)

    # Apply the weights
    weighted_cols = [
        "DAILY_HIGH_AVG",
        "DAILY_LOW_AVG",
        "DAILY_PRECIP_AVG",
        "DAILY_SNOW_AVG",
        "PRECIP_DAYS",
        "SNOW_DAYS",
    ]

    df[weighted_cols] = df[weighted_cols].multiply(weight, axis=0)
    df["WEIGHT"] = weight

    return (df[["DATE", "WEIGHT"] + weighted_cols], weighted_cols)


def process_nws_station_data(provider, city_code, weight, elev_diff):
    # Define the directory path and list of csv files
    USE_COLS = ["Date", "MAX SPD", "DR", "S-S"]
    if is_running_on_aws():
        # Use the built-in '/tmp' directory in AWS Lambda
        temp_local_path = f"/tmp/{provider}_{city_code}.csv"

        get_csv_from_s3(
            S3_BUCKET_NAME,
            f"NWS_STATION_FILES/{provider}_{city_code}.csv",
            temp_local_path,
        )
        df = pd.read_csv(temp_local_path, usecols=USE_COLS)
        # Delete the file from /tmp directory after reading it
        os.remove(temp_local_path)

    else:
        file_path = (
            f"{os.getcwd()}\\STATIONS\\NWS_STATION_FILES\\"
            + f"{provider}_{city_code}.csv"
        )
        df = pd.read_csv(file_path, usecols=USE_COLS)
    elev_diff /= 1000
    # Compute the required averages with elevation adjustments since conditions change with elevation
    elevation_adjustment_for_wind = min((1 + elev_diff * 0.2), 2)
    elevation_adjustment_for_sunshine = max((1 - elev_diff * 0.03), 0)

    # Convert the 'DATE' column to datetime
    df["DATE"] = pd.to_datetime(df["Date"])

    # TODO fix -10 values still appearing in the dataset for sunlight, see Hawaii values.
    df["DAILY_WIND_AVG"] = (
        df["MAX SPD"].where(df["MAX SPD"] > 0, 0) * elevation_adjustment_for_wind
    )
    df["DAILY_WIND_DIR_AVG"] = df["DR"].where(df["DR"] != 1, 0)

    # Initial calculation for DAILY_SUNSHINE_AVG without elevation adjustment
    df["DAILY_SUNSHINE_AVG"] = (10 * (10 - df["S-S"])).where(df["S-S"] >= 0, 0)
    df["DAILY_SUNSHINE_AVG"] = df["DAILY_SUNSHINE_AVG"].clip(lower=0, upper=100)

    # Adjust for elevation using sunshine values
    sunshine_factor = (100 - df["DAILY_SUNSHINE_AVG"]) / 100
    elevation_adjustment_for_sunshine = (1 - elev_diff * 0.1 * sunshine_factor).clip(
        lower=0
    )
    df["DAILY_SUNSHINE_AVG"] *= elevation_adjustment_for_sunshine

    df.dropna(
        subset=["DAILY_WIND_AVG", "DAILY_WIND_DIR_AVG", "DAILY_SUNSHINE_AVG"],
        inplace=True,
    )
    weighted_cols = ["DAILY_WIND_AVG", "DAILY_WIND_DIR_AVG", "DAILY_SUNSHINE_AVG"]
    df[weighted_cols] = df[weighted_cols].multiply(weight, axis=0)
    df["WEIGHT"] = weight

    return (df[["DATE", "WEIGHT"] + weighted_cols], weighted_cols)


# Function to aggregate the data, normalizing weights in the event of missing data
def aggregate_data(all_data, cols_to_aggregate):
    # Build the aggregation dictionary dynamically based on the input columns
    agg_dict = {col: "sum" for col in cols_to_aggregate}
    agg_dict["WEIGHT"] = "sum"  # Add the WEIGHT column to the aggregation dictionary

    # Group by date and compute the sum based on the aggregation dictionary
    aggregated = all_data.groupby("DATE").agg(agg_dict).reset_index()

    # Calculate the weighted average for the specified columns
    for col in cols_to_aggregate:
        aggregated[col] /= aggregated["WEIGHT"]

    return aggregated[["DATE"] + cols_to_aggregate]


def dewpoint_regr_calc(Tmax, Tmin, totalPrcp):
    # Read the CSV file with temperature and dewpoint data

    if is_running_on_aws():
        # Use the built-in '/tmp' directory in AWS Lambda
        temp_local_path = "/tmp/temperature-humidity-data.csv"

        get_csv_from_s3(
            S3_BUCKET_NAME, "temperature-humidity-data.csv", temp_local_path
        )
        df = pd.read_csv(temp_local_path)
        # Delete the file from /tmp directory after reading it
        os.remove(temp_local_path)
    else:
        df = pd.read_csv("temperature-humidity-data.csv")

    # Calculate TDiurinal (TMax - TMin)
    df["TDiurinal"] = df["TMax"] - df["TMin"]

    # Define your input features and target variables
    X = df[["TMax", "TMin", "TDiurinal", "Total"]]
    y = df[["DAvg"]]

    # Split the data into training and testing sets (if needed)
    # X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=42)

    # Scale the features using StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Initialize the Random Forest Regressor
    rf_model = RandomForestRegressor(n_estimators=5, random_state=42)
    rf_model.fit(X_scaled, y.values.ravel())

    Tdiurinal = [x - y for x, y in zip(Tmax, Tmin)]

    # Create a new DataFrame with your input data
    new_data = pd.DataFrame(
        {"TMax": Tmax, "TMin": Tmin, "TDiurinal": Tdiurinal, "Total": totalPrcp}
    )
    new_data_scaled = scaler.transform(new_data)
    rf_predicted_dewpoint = rf_model.predict(new_data_scaled)

    return rf_predicted_dewpoint


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the haversine distance between two points on the Earth.
    Returns the distance in miles by diving result km by 1.6
    """
    R = 6371  # Radius of the Earth in kilometers

    # Convert latitude and longitude to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    a = (
        sin((lat2 - lat1) / 2) ** 2
        + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c / 1.6


def nearest_coordinates_to_point_NWS(target_lat, target_lon, df, num_results=3):
    """
    Find the closest coordinates to a target point using NWS CF6 stations(NWS, CITY_CODE).
    """
    distances = []

    for index, row in df.iterrows():
        lat = row["LAT"]
        lon = row["LON"]
        distance = haversine_distance(target_lat, target_lon, lat, lon)
        distances.append(
            (
                lat,
                lon,
                row["NWS_PROVIDER"],
                row["CITY_CODE"],
                row["ELEVATION"],
                row["STATION"],
                distance,
            )
        )

    distances.sort(
        key=lambda x: x[6]
    )  # Sort by distance, which is 7th value, 6th index
    closest = distances[:num_results]
    # print("NWS: ", closest)

    return closest


def nearest_coordinates_to_point_NOAA(target_lat, target_lon, df, num_results=3):
    """
    Find the closest coordinates to a target point using NOAA stations (USCxxxxxxxxx.csv).
    """
    distances = []

    # ["STATION", "LAT", "LON", "ELEVATION", "NAME"]
    # USC00010160    32.935  -85.95556   660     ALEXANDER CITY, AL US
    for index, row in df.iterrows():
        lat = row["LAT"]
        lon = row["LON"]
        distance = haversine_distance(target_lat, target_lon, lat, lon)
        distances.append(
            (lat, lon, row["STATION"], row["ELEVATION"], row["NAME"], distance)
        )

    distances.sort(
        key=lambda x: x[5]
    )  # Sort by distance, which is 6th value, 5th index
    closest = distances[:num_results]
    # print("NOAA: ", closest)

    return closest


"""
This function takes in a list of the closest points to a target point
 and returns a list of weights for each point
 The higher the weight power, the more the weights are skewed towards the closest point
"""


def inverse_dist_weights(closest_points_list, weight_power=0.5):
    dist_values = [entry[-1] for entry in closest_points_list]
    # Squared to give increased weight to closest
    inverses = [(1 / value) ** weight_power for value in dist_values]
    sum_inverses = sum(inverses)
    weights = [inverse / sum_inverses for inverse in inverses]

    return weights


def is_running_on_aws():
    return "amzn" in platform.platform()


def get_csv_from_s3(bucket_name, file_key, local_path):
    try:
        s3 = boto3.client("s3")
        s3.download_file(bucket_name, file_key, local_path)

    except Exception as e:
        if hasattr(e, "response") and "Error" in e.response:
            error_code = int(e.response["Error"]["Code"])
            error_msg = e.response["Error"]["Message"]
            print(f"Received error {error_code} from S3: {error_msg}")
        else:
            print(f"An error occurred: {e}")
        raise
