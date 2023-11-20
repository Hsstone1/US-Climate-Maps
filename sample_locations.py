from math import acos, asin, atan2, cos, degrees, pi, radians, sin, sqrt, tan
import platform
import boto3
import numpy as np
import pandas as pd
from sklearn.discriminant_analysis import StandardScaler
from sklearn.linear_model import LinearRegression
import time
from sklearn.ensemble import RandomForestRegressor
from concurrent.futures import ThreadPoolExecutor

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
import os


load_dotenv()


def connect_to_db():
    try:
        start_time = time.time()

        connection = psycopg2.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
        )
        print("Connected to the database time", time.time() - start_time, "seconds")
        return connection
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)


def insert_into_location_data_table(connection, latitude, longitude, elevation):
    try:
        with connection.cursor() as cursor:  # Use 'with' to ensure the cursor is closed automatically
            insert_query = """
            INSERT INTO public.locations (latitude, longitude, elevation, geom)
            VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            RETURNING id;
            """
            cursor.execute(
                insert_query, (latitude, longitude, elevation, longitude, latitude)
            )
            location_id = cursor.fetchone()[0]
            connection.commit()
            return location_id
    except (Exception, psycopg2.Error) as error:
        print("Error while inserting into locations table", error)
        if connection:
            connection.rollback()
        return None


def batch_insert_climate_data(cursor, climate_data_batch, page_size=100):
    try:
        insert_query = """
        INSERT INTO public.climate_data (location_id, date, high_temperature, low_temperature, dewpoint, precipitation, snow, sun, wind, wind_gust, wind_direction, sun_angle, daylight_length)
        VALUES %s; 
        """
        psycopg2.extras.execute_values(
            cursor, insert_query, climate_data_batch, template=None, page_size=page_size
        )
        return True
    except (Exception, psycopg2.Error) as error:
        print("Error while inserting into climate_data table", error)
        return False


def process_and_write_data(csv_dataframe):
    connection = connect_to_db()
    if connection is None:
        print("Failed to connect to the database")
        return
    try:
        for index, row in csv_dataframe.iterrows():
            latitude, longitude, elevation = (
                row["latitude"],
                row["longitude"],
                row["elevation"],
            )
            location_id = insert_into_location_data_table(
                connection, latitude, longitude, elevation
            )
            if location_id is None:
                continue

            climate_df = climate_data(latitude, longitude, elevation)
            climate_df["date"] = climate_df["date"].dt.strftime("%Y-%m-%d")
            climate_data_records = climate_df.to_records(index=False)
            climate_data_batch = [
                (location_id,) + tuple(record) for record in climate_data_records
            ]

            with connection.cursor() as cursor:
                if not batch_insert_climate_data(cursor, climate_data_batch, 1000):
                    connection.rollback()
                    print(f"Failed to insert climate data for location {location_id}.")
                    break
                connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error while processing data", error)
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()


current_file_path = os.path.dirname(os.path.realpath(__file__))

# TODO this might cause issues if not in a sub directory
parent_directory = current_file_path
# parent_directory = os.path.dirname(current_file_path)


# TODO if the start date is more recent than 2019-04-01 there is an error involving the regresion
NUM_NWS_SAMPLE_STATIONS = 5
NUM_NOAA_SAMPLE_STATIONS = 8
MAX_THREADS = 10

START_YEAR = 1980
CURRENT_YEAR = int(time.strftime("%Y"))
START_DATE = f"{START_YEAR}-01-01"
END_DATE = f"{CURRENT_YEAR}-12-31"

ELEV_TEMPERATURE_CHANGE = 4.5
S3_BUCKET_NAME = "us-climate-maps-bucket"


def climate_data(target_lat, target_lon, target_elevation):
    start_time = time.time()

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
        df_stations_NWS_names = pd.read_csv(
            os.path.join(
                parent_directory,
                "nws-station-identifiers.csv",
            )
        )
        df_stations_NOAA_names = pd.read_csv(
            os.path.join(
                parent_directory,
                "noaa-station-identifiers.csv",
            )
        )

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

    weights_NWS = inverse_dist_weights(closest_points_NWS, weight_power=0.5)
    weights_NOAA = inverse_dist_weights(closest_points_NOAA, weight_power=1)

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

    # Process NOAA station data in parallel
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        noaa_results = executor.map(
            process_noaa_station_data,
            noaa_station_files,
            weights_NOAA,
            [elev_diff] * len(noaa_station_files),
        )

    noaa_all_data_frames, noaa_cols_to_aggregate_lists = zip(*noaa_results)
    noaa_all_data = pd.concat(noaa_all_data_frames, ignore_index=True)
    noaa_cols_to_aggregate = list(
        set([col for sublist in noaa_cols_to_aggregate_lists for col in sublist])
    )

    # Compute the weighted average across all stations for each date
    noaa_final_data = noaa_all_data.groupby("DATE").sum().reset_index()
    noaa_final_data = aggregate_data(noaa_all_data, noaa_cols_to_aggregate)
    noaa_final_data.set_index("DATE", inplace=True)

    # Outlier Detection
    ########################################################################
    WINDOW_SIZE = 14  # for example, 15 days before and 15 days after
    STD_DEV = 3

    noaa_final_data = replace_outliers_with_rolling_mean(
        noaa_final_data, "DAILY_HIGH_AVG", WINDOW_SIZE, STD_DEV
    )
    noaa_final_data = replace_outliers_with_rolling_mean(
        noaa_final_data, "DAILY_LOW_AVG", WINDOW_SIZE, STD_DEV
    )

    noaa_final_data["REGR_DEWPOINT_AVG"] = dewpoint_regr_calc(
        noaa_final_data["DAILY_HIGH_AVG"],
        noaa_final_data["DAILY_LOW_AVG"],
        noaa_final_data["DAILY_PRECIP_AVG"],
    )

    # Calculate the Diurnal Temperature Range (DTR)
    noaa_final_data["DTR"] = (
        noaa_final_data["DAILY_HIGH_AVG"] - noaa_final_data["DAILY_LOW_AVG"]
    )

    # Apply the correction factor for dewpoint using known data
    a, b = fit_dewpoint_adjustment_model()
    noaa_final_data["REGR_DEWPOINT_AVG"] = noaa_final_data.apply(
        lambda row: adjust_dewpoint(row, a, b, "DTR", "REGR_DEWPOINT_AVG"), axis=1
    )

    noaa_final_data["DAILY_DEWPOINT_AVG"] = noaa_final_data["REGR_DEWPOINT_AVG"]
    noaa_final_data = replace_outliers_with_rolling_mean(
        noaa_final_data, "DAILY_DEWPOINT_AVG", 14, 2
    )
    noaa_final_data["DATE"] = noaa_final_data.index

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

    nws_all_data = pd.concat(nws_all_data_frames, ignore_index=True)
    nws_cols_to_aggregate = list(
        set([col for sublist in nws_cols_to_aggregate_lists for col in sublist])
    )

    # Compute the weighted average across all stations for each date
    nws_final_data = nws_all_data.groupby("DATE").sum().reset_index()
    nws_final_data = aggregate_data(nws_all_data, nws_cols_to_aggregate)
    nws_final_data.set_index("DATE", inplace=True)

    #####################################################################
    # Regression

    noaa_final_data = noaa_final_data.drop(columns="DATE").reset_index()
    nws_final_data = nws_final_data.reset_index()

    noaa_final_data["DATE"] = pd.to_datetime(noaa_final_data["DATE"])
    nws_final_data["DATE"] = pd.to_datetime(nws_final_data["DATE"])

    # Merge the two dataframes on the date column
    combined = pd.merge(noaa_final_data, nws_final_data, on="DATE", how="left")
    combined["DATE"] = pd.to_datetime(combined["DATE"])

    # predict these columns
    predict_columns = [
        "DAILY_WIND_DIR_AVG",
        "DAILY_WIND_AVG",
        "DAILY_SUNSHINE_AVG",
        "DAILY_WIND_MAX",
        # "CONDITIONS",
    ]

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

    # Identify the rows where NWS columns are NaN

    # Bounding box for Hawaii
    sw_corner = (15, -170)
    ne_corner = (30, -130)

    if (
        target_lat >= sw_corner[0]
        and target_lat <= ne_corner[0]
        and target_lon >= sw_corner[1]
        and target_lon <= ne_corner[1]
    ):
        # Hawaii-specific date, since the NWS data is not available for Hawaii from 2019-04-01 to 2021-02-01
        date_limit = pd.Timestamp("2021-02-01")
    else:
        # April 1st, 2019 is the start of the nws dataset
        date_limit = pd.Timestamp("2019-04-01")

    # print("date_limit: ", date_limit)
    missing_data = combined[
        (combined["DAILY_SUNSHINE_AVG"].isna()) & (combined["DATE"] < date_limit)
    ]

    # Predict values where the data is missing
    X_missing = missing_data[feature_columns]
    predictions = model.predict(X_missing)

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
    combined.drop(columns=["DTR"], inplace=True)
    combined.drop(columns=["REGR_DEWPOINT_AVG"], inplace=True)
    combined.columns = combined.columns.str.replace("DAILY_", "")
    combined.columns = combined.columns.str.replace("_AVG", "")
    cols_to_round = combined.select_dtypes(include=["float", "int"]).columns.difference(
        ["DATE"]
    )
    combined[cols_to_round] = combined[cols_to_round].round(2)

    # This is used to re order the columns so they match the insertion into the climate_data table
    combined = combined[
        [
            "DATE",  # Assuming 'DATE' is a string and should be first
            "HIGH",  # Renamed from 'HIGH' to 'high_temperature'
            "LOW",  # Renamed from 'LOW' to 'low_temperature'
            "DEWPOINT",  # Column name is the same
            "PRECIP",  # Renamed from 'PRECIP' to 'precipitation'
            "SNOW",  # Column name is the same
            "SUNSHINE",  # Renamed from 'SUNSHINE' to 'sun'
            "WIND",  # Column name is the same
            "WIND_MAX",  # Renamed from 'WIND_MAX' to 'wind_gust'
            "WIND_DIR",  # Column name is the same
            "SUN_ANGLE",  # Column name is the same
            "DAYLIGHT_LENGTH",  # Column name is the same
        ]
    ]

    combined.columns = [
        "date",
        "high_temperature",
        "low_temperature",
        "dewpoint",
        "precipitation",
        "snow",
        "sun",
        "wind",
        "wind_gust",
        "wind_direction",
        "sun_angle",
        "daylight_length",
    ]

    print("Elapsed Time:", time.time() - start_time, "seconds")
    # print("SIZE: ", combined.size)
    # print(combined.head(10))
    return combined


def calc_sun_angle_and_daylight_length(latitude_degrees):
    results = []

    for day_of_year in range(1, 366):
        # declination of the sun as a function of the day of the year
        delta = -23.45 * cos(radians(360 / 365 * (day_of_year + 10)))
        phi = radians(latitude_degrees)  # convert latitude to radians

        # calculating the hour angle at which the sun sets/rises
        clamped_value = max(-1, min(1, -tan(phi) * tan(radians(delta))))

        # If clamped_value is -1 or 1, the sun never rises or never sets, respectively.
        if clamped_value == 1:
            daylight_length = 0  # Polar night
            elevation_angle = 0  # Sun is below horizon all day
        elif clamped_value == -1:
            daylight_length = 24  # Midnight sun
            # elevation_angle = 90  # Maximum possible solar noon elevation
        else:
            omega = acos(clamped_value)
            daylight_length = 2 * omega * 24 / (2 * pi)  # Convert radians to hours
            # solar noon elevation
            elevation_angle = degrees(
                asin(sin(phi) * sin(radians(delta)) + cos(phi) * cos(radians(delta)))
            )

        results.append((day_of_year, elevation_angle, daylight_length))

    return results


def process_noaa_station_data(station, weight, elev_diff):
    USE_COLS = ["DATE", "PRCP", "SNOW", "TMAX", "TMIN"]
    FREEZING_POINT_F = 32
    # This is sort of a magic number, which reduces snowfall and rpecip in respect to the elevation difference
    # between the average elevation of the stations and the target elevation
    ELEVATION_PRECIP_REDUCTION_FACTOR = 0.15
    ELEVATION_SNOW_REDUCTION_FACTOR = 0.5

    # This is sort of a magic number, which increases precipitation in respect to the elevation difference
    # between the average elevation of the stations and the target elevation
    # This emulates the orthographic effect, which increases precipitation with elevation
    ELEV_PRECIP_ADJUSTMENT_FACTOR = 0.125

    # This is sort of a magic number, which limits how much precipitation in respect to the elevation
    # difference can increase, which again, emuulates the orthographic effect
    MAX_ELEV_ADJUST_MULTIPLIER = 5
    elev_diff /= 1000

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

    df["DAILY_HIGH_AVG"] = (
        df["TMAX"] * 9 / 50 + 32 - elev_diff * ELEV_TEMPERATURE_CHANGE
    )
    df["DAILY_LOW_AVG"] = df["TMIN"] * 9 / 50 + 32 - elev_diff * ELEV_TEMPERATURE_CHANGE

    # Filter out rows where the high is lower than the low, and drop rows with NaN values
    df = df[df["DAILY_LOW_AVG"] <= df["DAILY_HIGH_AVG"]]
    df.dropna(subset=["DAILY_HIGH_AVG", "DAILY_LOW_AVG"], inplace=True)
    df["DAILY_MEAN_AVG"] = (df["DAILY_HIGH_AVG"] + df["DAILY_LOW_AVG"]) / 2

    # This aproximates how much moisture is in the air, similar to how the dewpoint is predicted.
    # If the diurinal temperature range is high, then the snow will be fluffier,
    # and if it is low, then the snow will be wetter, so less inches of snow per inch of precip.
    df["DTR"] = df["DAILY_HIGH_AVG"] - df["DAILY_LOW_AVG"]
    df["RAIN_TO_SNOW_CONVERSION"] = (df["DTR"] / 2).clip(lower=5, upper=20)

    # Calculate snow averages using vectorized operations
    # Set DAILY_SNOW_AVG to 0 if DAILY_LOW_AVG is above the freezing point
    rain_to_snow_condition = (df["DAILY_HIGH_AVG"] < FREEZING_POINT_F) | (
        (df["DAILY_LOW_AVG"] < FREEZING_POINT_F)
        & (df["DAILY_MEAN_AVG"] < FREEZING_POINT_F)
    )

    # This reduces snowfall in respect to the elevation difference,
    # if target is bellow the average station elevation
    precip_elevation_adjustment = np.where(
        elev_diff < 0,
        np.maximum(1 + elev_diff * ELEVATION_PRECIP_REDUCTION_FACTOR, 0),
        1,
    )
    snow_elevation_adjustment = np.where(
        elev_diff < 0,
        np.maximum(1 + elev_diff * ELEVATION_SNOW_REDUCTION_FACTOR, 0),
        1,
    )

    # Adjusts precipitation for elevation
    df["DAILY_PRECIP_AVG"] = (
        df["PRCP"]
        / 254
        * min(
            (1 + elev_diff * ELEV_PRECIP_ADJUSTMENT_FACTOR), MAX_ELEV_ADJUST_MULTIPLIER
        )
        * precip_elevation_adjustment
    ).fillna(0)

    df["DAILY_SNOW_AVG"] = np.where(
        rain_to_snow_condition,
        df["DAILY_PRECIP_AVG"]
        * df["RAIN_TO_SNOW_CONVERSION"]
        * snow_elevation_adjustment,
        0,
    )
    df["DAILY_SNOW_AVG"] += np.where(
        ~rain_to_snow_condition,
        df["SNOW"]
        / 25.4
        * min(
            (1 + elev_diff * ELEV_PRECIP_ADJUSTMENT_FACTOR), MAX_ELEV_ADJUST_MULTIPLIER
        )
        * snow_elevation_adjustment,
        0,
    )

    # Apply the weights
    weighted_cols = [
        "DAILY_HIGH_AVG",
        "DAILY_LOW_AVG",
        "DAILY_PRECIP_AVG",
        "DAILY_SNOW_AVG",
    ]

    df[weighted_cols] = df[weighted_cols].multiply(weight, axis=0)
    df["WEIGHT"] = weight

    return (df[["DATE", "WEIGHT"] + weighted_cols], weighted_cols)


def process_nws_station_data(provider, city_code, weight, elev_diff):
    """
    there is a column naming problem for all the nws csvs,so
    MAX SPD represents the normal wind speed
    DIR represents the max wind speed
    DR represents the normal wind direction
    S-S represents the sunshine
    WX represents the weather conditions, 0 if normal
        WEATHER.GOV CODES:
        1 = FOG OR MIST
        2 = FOG REDUCING VISIBILITY
        3 = THUNDER
        4 = ICE PELLETS
        5 = HAIL
        6 = FREEZING RAIN OR DRIZZLE
        7 = DUSTSTORM OR SANDSTORM
        8 = SMOKE OR HAZE
        9 = BLOWING SNOW
        X = TORNADO
    """

    USE_COLS = ["Date", "MAX SPD", "DR", "S-S", "DIR", "WX"]

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
    elevation_adjustment_for_wind = min((1 + elev_diff * 0.2), 5)
    elevation_adjustment_for_sunshine = max((1 - elev_diff * 0.03), 0)

    # Convert the 'DATE' column to datetime
    df["DATE"] = pd.to_datetime(df["Date"])

    # TODO fix -10 values still appearing in the dataset for sunlight, see Hawaii values.
    df["DAILY_WIND_AVG"] = (
        df["MAX SPD"].where(df["MAX SPD"] > 0, 0) * elevation_adjustment_for_wind
    )
    df["DAILY_WIND_MAX"] = (
        df["DIR"].where(df["DIR"] > 0, 0) * elevation_adjustment_for_wind
    )
    df["DAILY_WIND_DIR_AVG"] = df["DR"].where(df["DR"] != 1, 0)

    # Initial calculation for DAILY_SUNSHINE_AVG without elevation adjustment
    df["DAILY_SUNSHINE_AVG"] = (10 * (10 - df["S-S"])).where(df["S-S"] >= 0)
    df["DAILY_SUNSHINE_AVG"] = df["DAILY_SUNSHINE_AVG"].clip(lower=0, upper=100)

    # Adjust for elevation using sunshine values
    sunshine_factor = (100 - df["DAILY_SUNSHINE_AVG"]) / 100
    elevation_adjustment_for_sunshine = (1 - elev_diff * 0.1 * sunshine_factor).clip(
        lower=0
    )
    df["DAILY_SUNSHINE_AVG"] *= elevation_adjustment_for_sunshine

    df.dropna(
        subset=[
            "DAILY_WIND_AVG",
            "DAILY_WIND_DIR_AVG",
            "DAILY_SUNSHINE_AVG",
            "DAILY_WIND_MAX",
        ],
        inplace=True,
    )
    weighted_cols = [
        "DAILY_WIND_AVG",
        "DAILY_WIND_DIR_AVG",
        "DAILY_SUNSHINE_AVG",
        "DAILY_WIND_MAX",
        # "CONDITIONS",
    ]
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
        df = pd.read_csv(
            os.path.join(
                parent_directory,
                "temperature-humidity-data.csv",
            )
        )

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


def fit_dewpoint_adjustment_model():
    # Sample data

    if is_running_on_aws():
        # Use the built-in '/tmp' directory in AWS Lambda
        temp_local_path = "/tmp/dewpoint-adjustment-data.csv"

        get_csv_from_s3(S3_BUCKET_NAME, "dewpoint-adjustment-data.csv", temp_local_path)
        df = pd.read_csv(temp_local_path)
        # Delete the file from /tmp directory after reading it
        os.remove(temp_local_path)
    else:
        df = pd.read_csv(
            os.path.join(
                parent_directory,
                "dewpoint-adjustment-data.csv",
            )
        )

    df["DTR"] = df["High_Temp"] - df["Low_Temp"]
    df["Dewpoint_Adjustment"] = df["Actual_Dewpoint"] - df["Predicted_Dewpoint"]

    # Fit the linear model
    model = LinearRegression().fit(df[["DTR"]], df["Dewpoint_Adjustment"])

    # Return the coefficients
    return model.coef_[0], model.intercept_


def adjust_dewpoint(row, a, b, diurinal_str, dewpoint_str):
    dtr = row[diurinal_str]
    predicted_dewpoint = row[dewpoint_str]
    adjustment = a * dtr + b
    return predicted_dewpoint + adjustment


def replace_outliers_with_rolling_mean(dataframe, column_name, window_size, std_dev):
    """
    Replace outliers in a specified column of a DataFrame with the rolling mean.

    :param dataframe: Pandas DataFrame containing the data.
    :param column_name: The name of the column to process.
    :param window_size: The size of the rolling window.
    :param std_dev: The number of standard deviations to use for defining outliers.
    :return: DataFrame with outliers replaced in the specified column.
    """
    rolling_mean = (
        dataframe[column_name].rolling(window=window_size, center=True).mean()
    )
    rolling_std = dataframe[column_name].rolling(window=window_size, center=True).std()

    is_outlier = (dataframe[column_name] < (rolling_mean - std_dev * rolling_std)) | (
        dataframe[column_name] > (rolling_mean + std_dev * rolling_std)
    )

    # Replace outliers with rolling mean
    dataframe.loc[is_outlier, column_name] = rolling_mean[is_outlier]

    return dataframe


def haversine_vectorized(lat1, lon1, lat2, lon2):
    # Haversine formula vectorized
    R = 6371  # Radius of the Earth in km
    dLat = np.radians(lat2 - lat1)
    dLon = np.radians(lon2 - lon1)
    a = np.sin(dLat / 2) * np.sin(dLat / 2) + np.cos(np.radians(lat1)) * np.cos(
        np.radians(lat2)
    ) * np.sin(dLon / 2) * np.sin(dLon / 2)
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    distance = R * c
    return distance


def nearest_coordinates_to_point_NWS(target_lat, target_lon, df, num_results=3):
    latitudes = df["LAT"].values
    longitudes = df["LON"].values
    distances = haversine_vectorized(target_lat, target_lon, latitudes, longitudes)

    # Combine with other columns and sort
    results = np.column_stack(
        (
            latitudes,
            longitudes,
            df["NWS_PROVIDER"].values,
            df["CITY_CODE"].values,
            df["ELEVATION"].values,
            df["STATION"].values,
            distances,
        )
    )
    closest = results[np.argsort(results[:, 6])][:num_results]

    return closest


def nearest_coordinates_to_point_NOAA(target_lat, target_lon, df, num_results=3):
    latitudes = df["LAT"].values
    longitudes = df["LON"].values
    distances = haversine_vectorized(target_lat, target_lon, latitudes, longitudes)

    # Combine with other columns and sort
    results = np.column_stack(
        (
            latitudes,
            longitudes,
            df["STATION"].values,
            df["ELEVATION"].values,
            df["NAME"].values,
            distances,
        )
    )
    closest = results[np.argsort(results[:, 5])][:num_results]

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


def is_running_on_aws():
    return "amzn" in platform.platform()


if __name__ == "__main__":
    # df = pd.read_csv("geo_elev_grid_points_updated.csv")
    # first_row_df = df.iloc[
    #    0:1
    # ]  # This slices the DataFrame to include only the first row
    # start_time = time.time()
    # process_and_write_data(first_row_df)
    # print("TOTAL Elapsed Time:", time.time() - start_time, "seconds")
    # df = climate_data(19, -156.5, 0)
    # df.to_csv("temp_climate_data.csv")
    start_time = time.time()

    print("GET Elapsed Time:", time.time() - start_time, "seconds")
