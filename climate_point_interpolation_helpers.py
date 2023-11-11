import math
import pandas as pd
from math import radians, sin, cos, sqrt, atan2
import numpy as np
from scipy.stats import norm


def calc_growing_chance_vectorized(noaa_final_data, window_size=14):
    # Calculate rolling mean and standard deviation
    rolling_mean = (
        noaa_final_data["DAILY_LOW_AVG"]
        .rolling(window=window_size, min_periods=1)
        .mean()
    )
    rolling_std = (
        noaa_final_data["DAILY_LOW_AVG"]
        .rolling(window=window_size, min_periods=1)
        .std()
    )

    # Avoid division by zero by replacing zero standard deviations with NaN
    rolling_std = rolling_std.replace(0, np.nan)

    # Calculate z-scores; use .fillna(0) to handle NaNs resulting from zero standard deviation
    z_scores = (35 - rolling_mean) / rolling_std
    z_scores = z_scores.fillna(0)
    cumulative_probs = norm.cdf(z_scores)

    # Calculate the percentiles
    percentiles_below_32 = (1 - cumulative_probs) * 100
    percentiles_below_32 = np.where(
        percentiles_below_32 <= 50,
        0,
        np.where(percentiles_below_32 >= 80, 100, percentiles_below_32),
    )

    # Calculate the final growing chance
    growing_chance = 100 * ((percentiles_below_32 / 100) ** 2)

    return growing_chance


def fast_percentile(group, percentile):
    return np.percentile(group, percentile)


def calculate_statistic_by_date(
    dataframe,
    temp_col,
    stat_function,
    new_col_name,
    percentile_high=90,
    percentile_low=10,
):
    dataframe = dataframe.copy()

    # Ensure the DataFrame's index is a DatetimeIndex
    if not isinstance(dataframe.index, pd.DatetimeIndex):
        dataframe.index = pd.to_datetime(dataframe.index)

    dataframe["MONTH_DAY"] = dataframe.index.strftime("%m-%d")

    if stat_function == "percentile":
        if temp_col == "DAILY_HIGH_AVG":
            dataframe[new_col_name] = dataframe.groupby("MONTH_DAY")[
                temp_col
            ].transform(lambda x: fast_percentile(x, percentile_high))
        else:  # 'DAILY_LOW_AVG'
            dataframe[new_col_name] = dataframe.groupby("MONTH_DAY")[
                temp_col
            ].transform(lambda x: fast_percentile(x, percentile_low))
    else:
        dataframe[new_col_name] = dataframe.groupby("MONTH_DAY")[temp_col].transform(
            stat_function
        )

    dataframe.drop(columns="MONTH_DAY", inplace=True)

    return dataframe


def calc_sun_angle_and_daylight_length(latitude_degrees):
    results = []

    for day_of_year in range(1, 366):
        # declination of the sun as a function of the day of the year
        delta = -23.45 * math.cos(math.radians(360 / 365 * (day_of_year + 10)))
        phi = math.radians(latitude_degrees)  # convert latitude to radians

        # calculating the hour angle at which the sun sets/rises
        clamped_value = max(-1, min(1, -math.tan(phi) * math.tan(math.radians(delta))))

        # If clamped_value is -1 or 1, the sun never rises or never sets, respectively.
        if clamped_value == 1:
            daylight_length = 0  # Polar night
            elevation_angle = 0  # Sun is below horizon all day
        elif clamped_value == -1:
            daylight_length = 24  # Midnight sun
            # elevation_angle = 90  # Maximum possible solar noon elevation
        else:
            omega = math.acos(clamped_value)
            daylight_length = 2 * omega * 24 / (2 * math.pi)  # Convert radians to hours
            # solar noon elevation
            elevation_angle = math.degrees(
                math.asin(
                    math.sin(phi) * math.sin(math.radians(delta))
                    + math.cos(phi) * math.cos(math.radians(delta))
                )
            )

        results.append((day_of_year, elevation_angle, daylight_length))

    return results


def calc_uv_index_vectorized(sun_angle, altitude, sunshine_percentage):
    # Ensure sunshine_percentage is within [0,1]
    sunshine_percentage = sunshine_percentage.clip(0, 100) / 100

    # Calculate the basic UV index
    uv_index = (sun_angle / 90) * 12

    # Adjust for altitude
    altitude_adjustment = altitude / 1000 * 0.05
    uv_index_adjusted = uv_index * (1 + altitude_adjustment)

    # Adjust for sunshine percentage, with a sqrt transformation
    uv_index_adjusted *= np.sqrt(sunshine_percentage).clip(0, 1)

    return uv_index_adjusted.clip(lower=0)


def calc_humidity_percentage_vector(dew_points_F, temperatures_F):
    # Convert Fahrenheit to Celsius
    dew_points_C = (dew_points_F - 32) * 5 / 9
    temperatures_C = (temperatures_F - 32) * 5 / 9

    # Calculate actual vapor pressure
    vapor_pressure = 6.112 * 10 ** (7.5 * dew_points_C / (237.7 + dew_points_C))

    # Calculate saturation vapor pressure
    saturation_vapor_pressure = 6.112 * 10 ** (
        7.5 * temperatures_C / (237.7 + temperatures_C)
    )

    # Calculate humidity percentage
    humidity_percentages = (vapor_pressure / saturation_vapor_pressure) * 100

    return humidity_percentages


# https://www.weather.gov/epz/wxcalc_windchill
# https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
def calc_aparent_temp_vector(T, DP, V):
    # Replace zero values with 3 for wind speed
    V = np.where(V == 0, 3, V)

    RH = 100 * (
        np.exp((17.625 * DP) / (243.04 + DP)) / np.exp((17.625 * T) / (243.04 + T))
    )

    # Conditions for Heat Index calculation
    condition_heat_index = T > 80
    HI = np.where(
        condition_heat_index,
        -42.379
        + 2.04901523 * T
        + 10.14333127 * RH
        - 0.22475541 * T * RH
        - 0.00683783 * T * T
        - 0.05481717 * RH * RH
        + 0.00122874 * T * T * RH
        + 0.00085282 * T * RH * RH
        - 0.00000199 * T * T * RH * RH,
        T,  # default to nan, will be replaced later
    )

    # Adjustments for Heat Index
    condition_adjustment1 = (T < 112) & (RH < 13)
    adjustment1 = np.where(
        condition_adjustment1,
        ((13 - RH) / 4) * np.sqrt((17 - np.abs(T - 95.0)) / 17),
        0,
    )
    condition_adjustment2 = (T < 87) & (RH > 85)
    adjustment2 = np.where(condition_adjustment2, ((RH - 85) / 10) * ((87 - T) / 5), 0)
    HI = HI - adjustment1 + adjustment2

    # Conditions for Wind Chill calculation
    condition_wind_chill = (T < 50) & (V >= 3)
    WC = np.where(
        condition_wind_chill,
        35.74 + (0.6215 * T) - 35.75 * (V**0.16) + 0.4275 * T * (V**0.16),
        T,  # default to nan, will be replaced later
    )

    # If neither Heat Index nor Wind Chill conditions are met, return the original temperature
    result = np.where(
        condition_heat_index | condition_wind_chill,
        np.where(condition_heat_index, HI, WC),
        T,
    )

    return result


def calc_comfort_index_vector(temperature_df, apparent_df, dewpoint_df, sunshine_df):
    def temperature_score(temp):
        if temp <= 20 or temp >= 110:
            return 0
        elif temp == 70:
            return 100
        elif 20 < temp < 70:
            return (temp - 20) * (100 / 50)  # linearly scale between 20 and 70
        elif 70 < temp < 110:
            return (110 - temp) * (100 / 40)  # linearly scale between 70 and 110

    def apparent_temperature_score(apparent_temp):
        if apparent_temp <= 20 or apparent_temp >= 110:
            return 0
        elif apparent_temp == 70:
            return 100
        elif 20 < apparent_temp < 70:
            return (apparent_temp - 20) * (100 / 50)  # linearly scale between 20 and 70
        elif 70 < apparent_temp < 110:
            return (110 - apparent_temp) * (
                100 / 40
            )  # linearly scale between 70 and 110

    def dewpoint_score(dewpoint):
        if dewpoint >= 80:
            return 0
        elif dewpoint < 55:
            return 100
        else:
            return (80 - dewpoint) * (100 / 25)  # linearly scale between 55 and 80

    def sunlight_score(sunlight):
        if sunlight >= 60:
            return 100
        elif sunlight <= 0:
            return 0
        else:
            return sunlight * (100 / 60)  # linearly scale between 0 and 60

    # Calculate individual component scores
    df = pd.DataFrame()

    df["temp_score"] = temperature_df.apply(temperature_score) * 0.4  # 40% weight
    df["apparent_temp_score"] = (
        apparent_df.apply(apparent_temperature_score) * 0.2
    )  # 40% weight
    df["dew_score"] = dewpoint_df.apply(dewpoint_score) * 0.2  # 20% weight
    df["sun_score"] = sunshine_df.apply(sunlight_score) * 0.2  # 20% weight

    # Calculate the final comfort index
    df["comfort_index"] = (
        df["temp_score"] + df["apparent_temp_score"] + df["dew_score"] + df["sun_score"]
    )

    return df["comfort_index"]


# https://en.wikipedia.org/wiki/K%C3%B6ppen_climate_classification#Overview
def calc_koppen_climate(temp_f, precip_in):
    avg_month_precip_mm = [value * 25.4 for value in precip_in]
    avg_month_temp_c = [(value - 32) * (5 / 9) for value in temp_f]
    annual_temp_c = sum(avg_month_temp_c) / len(avg_month_temp_c)
    annual_precipitation_mm = sum(avg_month_precip_mm)
    driest_month_precip_mm = min(avg_month_precip_mm)
    # These indicies only work for the norther hemisphere, need to be reversed for southern
    warm_month_indices = [3, 4, 5, 6, 7, 8]
    cold_month_indices = [0, 1, 2, 9, 10, 11]
    sum_precipitation_warm = sum(avg_month_precip_mm[idx] for idx in warm_month_indices)
    sum_precipitation_cold = sum(avg_month_precip_mm[idx] for idx in cold_month_indices)
    percent_precip_warm = sum_precipitation_warm / annual_precipitation_mm
    percent_precip_cold = sum_precipitation_cold / annual_precipitation_mm
    threshold_mm = annual_temp_c * 20
    threshold_mm += (
        280
        if percent_precip_warm > 0.7
        else (140 if (0.3 < percent_precip_warm < 0.7) else 0)
    )

    # Koppen type A, Tropical
    if min(avg_month_temp_c) >= 18:
        # print("TYPE A")
        if driest_month_precip_mm >= 60:
            return "Tropical rainforest climate (Af)"
        elif driest_month_precip_mm < 60 and driest_month_precip_mm >= 100 - (
            annual_precipitation_mm / 25
        ):
            return "Tropical monsoon climate (Am)"
        elif driest_month_precip_mm < 60 and driest_month_precip_mm < 100 - (
            annual_precipitation_mm / 25
        ):
            return "Tropical savanna climate (Aw)"
        else:
            return "Tropical climate (A)"

    # Koppen type C, Temperate
    elif (
        min(avg_month_temp_c) > 0
        and min(avg_month_temp_c) < 18
        and max(avg_month_temp_c) > 10
        and annual_precipitation_mm > 0.5 * threshold_mm
    ):
        # print("TYPE C")
        # Subtropical
        if percent_precip_warm > 0.7:
            if (
                max(avg_month_temp_c) > 22
                and max(get_highest_N_values(avg_month_temp_c, 4)) > 10
            ):
                return "Monsoon humid subtropical climate (Cwa)"
            elif (
                max(avg_month_temp_c) < 22
                and max(get_highest_N_values(avg_month_temp_c, 4)) > 10
            ):
                return "Subtropical highland climate (Cwb)"
            elif max(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return "Cold subtropical highland climate (Cwc)"
            else:
                return "Subtropical climate (C)"

        # Mediterranean
        if percent_precip_cold > 0.7 and driest_month_precip_mm < 40:
            if (
                max(avg_month_temp_c) > 22
                and max(get_highest_N_values(avg_month_temp_c, 4)) > 10
            ):
                return "Hot-summer Mediterranean climate (Csa)"
            elif (
                max(avg_month_temp_c) < 22
                and max(get_highest_N_values(avg_month_temp_c, 4)) > 10
            ):
                return "Warm-summer Mediterranean climate (Csb)"
            elif max(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return "Cold-summer Mediterranean climate (Csc)"
            else:
                return "Mediterranean climate (C)"

        # Oceanic
        if (
            max(avg_month_temp_c) > 22
            and min(get_highest_N_values(avg_month_temp_c, 4)) > 10
        ):
            return "Humid subtropical climate (Cfa)"
        # Maybe add elevation check to set subtropical highland climate instead of oceanic
        elif (
            max(avg_month_temp_c) < 22
            and min(get_highest_N_values(avg_month_temp_c, 4)) > 10
        ):
            return "Temperate oceanic climate (Cfb)"
        elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
            return "Subpolar oceanic climate (Cfc)"
        else:
            return "Oceanic climate (C)"

    # Koppen type D, Continental
    elif (
        max(avg_month_temp_c) > 10
        and min(avg_month_temp_c) < 0
        and annual_precipitation_mm > 0.5 * threshold_mm
    ):
        # print("TYPE D")
        # Monsoon
        if percent_precip_warm > 0.7:
            if (
                max(avg_month_temp_c) > 22
                and min(get_highest_N_values(avg_month_temp_c, 4)) > 10
            ):
                return "Monsoon Hot-summer humid continental climate (Dwa)"
            elif (
                max(avg_month_temp_c) < 22
                and min(get_highest_N_values(avg_month_temp_c, 4)) > 10
            ):
                return "Monsoon Warm-summer humid continental climate (Dfb)"
            elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return "Monsoon Subarctic climate (Dfc)"
            elif (
                min(avg_month_temp_c) < -38
                and min(get_highest_N_values(avg_month_temp_c, 2)) > 10
            ):
                return "Monsoon Extremely cold subarctic climate (Dfd)"
            else:
                return "Monsoon climate (D)"

        # Mediterranean
        if percent_precip_cold > 0.7 and driest_month_precip_mm < 30:
            if (
                max(avg_month_temp_c) > 22
                and min(get_highest_N_values(avg_month_temp_c, 4)) > 10
            ):
                return "Mediterranean hot-summer humid continental climate (Dsa)"
            elif (
                max(avg_month_temp_c) < 22
                and min(get_highest_N_values(avg_month_temp_c, 4)) > 10
            ):
                return "Mediterranean warm-summer humid continental climate (Dsb)"
            elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
                return "Mediterranean Subarctic climate (Dsc)"
            elif (
                min(avg_month_temp_c) < -38
                and min(get_highest_N_values(avg_month_temp_c, 3)) > 10
            ):
                return "Mediterranean Extremely cold subarctic climate (Dsd)"
            else:
                return "Mediterranean climate (D)"

        if (
            max(avg_month_temp_c) > 22
            and min(get_highest_N_values(avg_month_temp_c, 4)) > 10
        ):
            return "Hot-summer humid continental climate (Dfa)"
        elif (
            max(avg_month_temp_c) < 22
            and min(get_highest_N_values(avg_month_temp_c, 4)) > 10
        ):
            return "Warm-summer humid continental climate (Dfb)"
        elif min(get_highest_N_values(avg_month_temp_c, 2)) > 10:
            return "Subarctic climate (Dfc)"
        elif (
            min(avg_month_temp_c) < -38
            and min(get_highest_N_values(avg_month_temp_c, 2)) > 10
        ):
            return "Extremely cold subarctic climate (Dfd)"
        else:
            return "Continental climate (D)"

    # Koppen type B, Semi-arid
    elif max(avg_month_temp_c) > 10:
        # print("TYPE B")

        if annual_precipitation_mm < 0.5 * threshold_mm:
            if min(avg_month_temp_c) > 0:
                return "Hot desert climate (BWh)"
            else:
                return "Cold desert climate (BWk)"
        else:
            if min(avg_month_temp_c) > 0:
                return "Hot semi-arid climate (BSh)"
            else:
                return "Cold semi-arid climate (BSk)"

    # Koppen type E, Tundra
    elif max(avg_month_temp_c) < 10:
        # print("TYPE E")
        if max(avg_month_temp_c) > 0:
            return "Alpine tundra climate (ET)"
        else:
            return "Ice cap climate (EF)"

    else:
        return "Unknown climate type"


def calc_plant_hardiness(mean_annual_min):
    hardiness_zones = {
        0: [("a", float("-inf"), -65), ("b", -65, -60)],
        1: [("a", -60, -55), ("b", -55, -50)],
        2: [("a", -50, -45), ("b", -45, -40)],
        3: [("a", -40, -35), ("b", -35, -30)],
        4: [("a", -30, -25), ("b", -25, -20)],
        5: [("a", -20, -15), ("b", -15, -10)],
        6: [("a", -10, -5), ("b", -5, 0)],
        7: [("a", 0, 5), ("b", 5, 10)],
        8: [("a", 10, 15), ("b", 15, 20)],
        9: [("a", 20, 25), ("b", 25, 30)],
        10: [("a", 30, 35), ("b", 35, 40)],
        11: [("a", 40, 45), ("b", 45, 50)],
        12: [("a", 50, 55), ("b", 55, 60)],
        13: [("a", 60, 65), ("b", 65, float("inf"))],
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


def sigmoid(x):
    return 1 / (1 + np.exp(-x))
