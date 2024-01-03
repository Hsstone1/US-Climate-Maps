from datetime import time
import pandas as pd
import psycopg2
import psycopg2.extras
import os
import time
import platform
from dotenv import load_dotenv
import json
from collections import defaultdict
from global_db_climate_data import *


NUM_NEAREST_LOCATIONS = 5
load_dotenv()  # This loads the variables from .env
TMAX_INVALID_PERC = 30
TMIN_INVALID_PERC = 30


def find_closest_from_db(
    latitude, longitude, year=None, type=None, connection_to_db=None
):
    if connection_to_db is None:
        connection = connect_to_db()
    else:
        connection = connection_to_db
    if connection is None:
        print("Failed to connect to the database")
        return None
    try:
        with connection.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            # Find the closest location_id based on the given latitude and longitude
            start_time = time.time()
            cursor.execute(
                CLOSEST_LOCATION_QUERY,
                (
                    longitude,
                    latitude,
                    TMAX_INVALID_PERC,
                    TMIN_INVALID_PERC,
                    longitude,
                    latitude,
                    NUM_NEAREST_LOCATIONS,
                ),
            )
            print("time to execute query", time.time() - start_time, "seconds")
            closest_locations = cursor.fetchall()
            station_ids = []
            elevations = []
            distances = []
            station_names = []
            for loc in closest_locations:
                station_ids.append(loc["id"])
                elevations.append(float(loc["elevation"]))  # Convert to float
                distances.append(float(loc["distance"]))  # Convert to float
                station_names.append(loc["station_identifier"])

            # Calculate inverse distance weights
            weights = [1 / d for d in distances]
            total_weight = sum(weights)
            normalized_weights = [w / total_weight for w in weights]
            # Calculate weighted elevation - Do not divide by total_weight again
            weighted_elevation = sum(
                elev * w for elev, w in zip(elevations, normalized_weights)
            )
            print("Station Names: ", station_names)
            print("Station Weights: ", normalized_weights)

            # Aggregate the data using IDW
            aggregation_start_time = time.time()
            aggregated_data = idw_aggregation(
                station_ids, normalized_weights, cursor, year, type
            )
            print("Time to aggregate", time.time() - aggregation_start_time, "seconds")
            num_days_start_time = time.time()
            if type == "DAILY_AVG_ALL_QUERY" or type == "YEARLY_TRENDS_QUERY":
                num_days = execute_query_to_dataframe(
                    cursor, NUM_DAYS_IN_DB_QUERY, (station_ids[0],)
                )["total_days"].values[0]
            else:
                num_days = 1

            print("Time to get num days", time.time() - num_days_start_time, "seconds")
            print("Total Query Elapsed Time:", time.time() - start_time, "seconds")

            return aggregated_data, weighted_elevation, num_days

    except (Exception, psycopg2.Error) as error:
        print("Error while querying the database", error)
        return None
    finally:
        if connection:
            connection.close()


# This function calculates the monthly and annual values for all parameters
# Then formats the data in json so the frontend can easily access it
def dataframe_time_granularity_agg_to_json(
    df, year=None, include_daily=True, include_monthly=True, include_annual=True
):
    days_in_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    ROUND_VAL = 2

    df_rounded = df.round(ROUND_VAL)
    df_rounded = df_rounded.fillna(method="ffill").fillna(method="bfill")

    def calculate_month_index(day_of_year):
        month = 0
        cumulative_days = 0
        for days in days_in_month:
            cumulative_days += days
            if day_of_year <= cumulative_days:
                return month
            month += 1
        return 11

    base_annualize_columns = [
        "precipitation",
        "snow",
        "hdd",
        "cdd",
        "gdd",
        "sunlight_hours",
    ]
    day_columns = [col for col in df.columns if col.endswith("_days")]
    annualize_columns = base_annualize_columns + day_columns

    if year is None:
        df_rounded["month_index"] = df_rounded.index.to_series().apply(
            calculate_month_index
        )
    else:
        df_rounded["date"] = pd.to_datetime(df_rounded["date"])
        df_rounded["month_index"] = df_rounded["date"].dt.month - 1

    monthly_means = df_rounded.groupby("month_index").mean()
    annual_mean = df_rounded.mean()

    json_data = defaultdict(dict)
    for column in df_rounded.columns:
        if column in ["day_of_year", "month_index", "date"]:
            continue

        if include_daily:
            json_data[column]["daily"] = df_rounded[column].tolist()

        if include_monthly:
            if column in annualize_columns:
                json_data[column]["monthly"] = (
                    (monthly_means[column] * days_in_month).round(ROUND_VAL).tolist()
                )
            else:
                json_data[column]["monthly"] = (
                    monthly_means[column].round(ROUND_VAL).tolist()
                )

        if include_annual:
            if column in annualize_columns:
                annual_value = (annual_mean[column] * 365.25).round(ROUND_VAL)
            else:
                annual_value = annual_mean[column].round(ROUND_VAL)
            json_data[column]["annual"] = (
                annual_value if year is not None else annual_value.tolist()
            )

        # Special handling for record_high, record_low, and other columns
        if column in [
            "record_high",
            "record_low",
            "expected_max",
            "expected_min",
            "apparent_record_high",
            "apparent_record_low",
            "apparent_expected_max",
            "apparent_expected_min",
            "record_high_dewpoint",
            "record_low_dewpoint",
            "expected_max_dewpoint",
            "expected_min_dewpoint",
            "expceted_max_wind_gust",
            "record_high_wind_gust",
        ]:
            monthly_max_min = (
                df_rounded.groupby("month_index")[column]
                .agg(["max", "min"])
                .round(ROUND_VAL)
            )
            if include_monthly:
                json_data[column]["monthly_max"] = monthly_max_min["max"].tolist()
                json_data[column]["monthly_min"] = monthly_max_min["min"].tolist()
            if include_annual:
                json_data[column]["annual_max"] = (
                    df_rounded[column].max().round(ROUND_VAL)
                )
                json_data[column]["annual_min"] = (
                    df_rounded[column].min().round(ROUND_VAL)
                )

    return json_data


def climate_trends_agg_to_json(df):
    ROUND_VAL = 2

    df_rounded = df.round(ROUND_VAL)
    df_rounded = df_rounded.fillna(method="ffill").fillna(method="bfill")

    annualize_columns = [
        "precipitation",
        "snow",
        "hdd",
        "cdd",
        "gdd",
        "sunlight_hours",
    ]
    # day_columns = [col for col in df_rounded.columns if col.endswith("_days")]
    # annualize_columns = base_annualize_columns + day_columns
    json_data = defaultdict(dict)
    for column in df_rounded.columns:
        if column in annualize_columns:
            df_rounded[column] = (df_rounded[column] * 365.25).round(ROUND_VAL)
        json_data[column]["annual"] = df_rounded[column].tolist()
    return json_data


def idw_aggregation(station_ids, weights, cursor, year=None, type=None):
    aggregated_df = pd.DataFrame()
    data = pd.DataFrame()

    for station_id, weight in zip(station_ids, weights):
        start_time = time.time()
        if year:
            data_query = RAW_DAILY_DATA_QUERY
            data = execute_query_to_dataframe(cursor, data_query, (station_id, year))
        else:
            if type == "DAILY_AVG_ALL_QUERY":
                data_query = DAILY_AVG_ALL_QUERY
                data = execute_query_to_dataframe(cursor, data_query, (station_id,))
            elif type == "YEARLY_TRENDS_QUERY":
                data_query = YEARLY_TRENDS_QUERY
                data = execute_query_to_dataframe(cursor, data_query, (station_id,))
        print("Time to get data", time.time() - start_time, "seconds")

        numeric_data = data.select_dtypes(include=["float64", "int64"]) * weight
        data.update(numeric_data)

        # Exclude the date column when aggregating
        if "date" in data.columns:
            data_without_date = data.drop(columns=["date"], errors="ignore")
        else:
            data_without_date = data

        if aggregated_df.empty:
            aggregated_df = data_without_date
        else:
            aggregated_df = aggregated_df.add(data_without_date, fill_value=0)

    # If aggregating raw daily data, reattach the date column
    if year is not None and "date" in data.columns:
        aggregated_df["date"] = data["date"]

    return aggregated_df


def execute_query_to_dataframe(cursor, sql, params):
    cursor.execute(sql, params)
    results = cursor.fetchall()
    column_names = [desc[0] for desc in cursor.description]
    df = pd.DataFrame(results, columns=column_names)

    # Convert numeric columns to float
    for column in df.columns:
        if column != "day_of_year":  # Assuming 'day_of_year' is your date column
            df[column] = pd.to_numeric(df[column], errors="coerce")

    return df


def explain_query(cursor, sql, params):
    cursor.execute("EXPLAIN " + sql, params)
    return cursor.fetchall()


CLOSEST_LOCATION_QUERY = """
    SELECT id, elevation, ST_Distance(geom, ST_SetSRID(ST_MakePoint(%s, %s), 4326)) AS distance, station_identifier
    FROM public.stations_info
    WHERE TMAX_INVALID_PERC < %s AND TMIN_INVALID_PERC < %s AND TMAX_INVALID_PERC > 0 AND TMIN_INVALID_PERC > 0 
    ORDER BY geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
    LIMIT %s;
"""

DAILY_AVG_ALL_QUERY = """
    SELECT EXTRACT(DOY FROM date) as day_of_year,
            AVG(NULLIF(NULLIF(tmax, 9999), 32)) as high_temperature, 
            AVG(NULLIF(NULLIF(tmin, -9999), 32)) as low_temperature,
            AVG(prcp) as precipitation,
            AVG(snow) as snow, 
            MAX(NULLIF(NULLIF(tmax, 9999), 32)) AS record_high, 
            MIN(NULLIF(NULLIF(tmin, -9999), 32)) AS record_low,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY NULLIF(NULLIF(tmax, 9999), 32)) AS expected_max,
            PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY NULLIF(NULLIF(tmin, -9999), 32)) AS expected_min,
            SUM(CASE WHEN prcp >= 0.01 THEN 1 ELSE 0 END) AS precip_days,
            SUM(CASE WHEN snow >= 0.1 THEN 1 ELSE 0 END) AS snow_days
           
    FROM public.stations_climate_data
    WHERE station_id = %s
    AND tmax NOT IN (9999, 32)
    AND tmin NOT IN (-9999, 32)
    GROUP BY day_of_year
    ORDER BY day_of_year;
"""


DAILY_AVG_ALL_STATIONS_QUERY = """
WITH FilteredData AS (
    SELECT 
        date,
        CASE 
            WHEN tmax NOT IN (9999, 32) THEN tmax 
            ELSE NULL 
        END AS tmax_clean,
        CASE 
            WHEN tmin NOT IN (-9999, 32) THEN tmin 
            ELSE NULL 
        END AS tmin_clean,
        prcp,
        snow
    FROM public.stations_climate_data
    WHERE station_id = %s
      AND tmax NOT IN (9999, 32)
      AND tmin NOT IN (-9999, 32)
)
SELECT 
    EXTRACT(DOY FROM date) as day_of_year,
    AVG(tmax_clean) as high_temperature,
    AVG(tmin_clean) as low_temperature,
    AVG(prcp) as precipitation,
    AVG(snow) as snow,
    MAX(tmax_clean) AS record_high,
    MIN(tmin_clean) AS record_low,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY tmax_clean) AS expected_max,
    PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY tmin_clean) AS expected_min,
    SUM(CASE WHEN prcp >= 0.01 THEN 1 ELSE 0 END) AS precip_days,
    SUM(CASE WHEN snow >= 0.1 THEN 1 ELSE 0 END) AS snow_days
FROM FilteredData
GROUP BY day_of_year
ORDER BY day_of_year;
"""


NUM_DAYS_IN_DB_QUERY = """
    SELECT COUNT(DISTINCT date) AS total_days 
    FROM public.stations_climate_data 
    WHERE station_id = %s;
"""

RAW_DAILY_DATA_QUERY = """
    SELECT date, 
            NULLIF(NULLIF(tmax, 9999), 32) AS high_temperature, 
            NULLIF(NULLIF(tmin, -9999), 32) AS low_temperature,
            prcp AS precipitation,
            snow,
            CASE WHEN prcp >= 0.01 THEN 1 ELSE 0 END AS precip_days,
            CASE WHEN snow >= 0.1 THEN 1 ELSE 0 END AS snow_days
    FROM public.stations_climate_data
    WHERE station_id = %s AND EXTRACT(YEAR FROM date) = %s
    ORDER BY date;
"""

YEARLY_TRENDS_QUERY = """
SELECT EXTRACT(YEAR FROM date) as year,
       AVG(high_temperature) as high_temperature, 
       AVG(low_temperature) as low_temperature,
       AVG(precipitation) as precipitation,
       AVG(snow) as snow, 
       SUM(CASE WHEN precipitation >= 0.01 THEN 1 ELSE 0 END) AS precip_days,
       SUM(CASE WHEN snow >= 0.1 THEN 1 ELSE 0 END) AS snow_days

FROM public.climate_data
WHERE station_id = %s
GROUP BY year
ORDER BY year;
"""


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
