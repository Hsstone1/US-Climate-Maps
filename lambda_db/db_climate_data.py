from datetime import time
import numpy as np
import pandas as pd
import time


def calc_additional_climate_parameters(
    df, target_elevation, average_weighted_elev, num_days=1
):
    DAY_COLUMNS = [col for col in df.columns if col.endswith("_days")]
    print("LENGTH:", len(df))
    for col in DAY_COLUMNS:
        if num_days != 1:
            df[col] /= num_days / len(df)

    elev_diff = (target_elevation - average_weighted_elev) / 1000
    print("Elevation difference:", elev_diff * 1000)

    ELEV_TEMPERATURE_ADJUSTMENT = 4.5
    ELEV_DEWPOINT_ADJUSTMENT = 3

    # These constant change precipitation in respect to the elevation difference
    # between the average elevation of the stations and the target elevation
    # This emulates the orthographic effect, which increases precipitation with elevation
    ELEV_PRECIP_ADJUSTMENT_FACTOR = 0.125
    ELEVATION_PRECIP_REDUCTION_FACTOR = 0.2
    ELEV_PRECIP_DAYS_ADJUSTMENT_FACTOR = 0.02
    ELEV_PRECIP_DAYS_REDUCTION_FACTOR = 0.03
    SNOW_DEGREE_THRESHOLD = 32

    # This is the maximum multiplier of how much precipitation can increase in respect to the elevation
    # difference, which again, emuulates the orthographic effect
    MAX_ELEV_ADJUST_MULTIPLIER = 2

    # This changes the wind speed with elevation, as generally wind speed increases with elevation
    ELEV_WIND_ADJUSTMENT = min((1 + elev_diff * 0.2), 5)

    # This changes the sun with elevation, as generally sun decreases with elevation
    # However, when the percentage of sunshine is high, generally the sun does not change with elevation as much
    # This tries to emulate high pressure systems, which are more stable and have less variation with elevation
    ELEV_SUN_ADJUSTMENT = (1 - elev_diff * 0.1 * (100 - df["sun"]) / 100).clip(lower=0)

    df["wind"] *= ELEV_WIND_ADJUSTMENT
    df["wind_gust"] *= ELEV_WIND_ADJUSTMENT
    df["sun"] *= ELEV_SUN_ADJUSTMENT

    df["high_temperature"] -= elev_diff * ELEV_TEMPERATURE_ADJUSTMENT
    df["low_temperature"] -= elev_diff * ELEV_TEMPERATURE_ADJUSTMENT

    if "expected_max" in df.columns and "expected_min" in df.columns:
        df["expected_max_dewpoint"] -= elev_diff * ELEV_DEWPOINT_ADJUSTMENT
        df["expected_min_dewpoint"] -= elev_diff * ELEV_DEWPOINT_ADJUSTMENT
        df["expected_max"] -= elev_diff * ELEV_TEMPERATURE_ADJUSTMENT
        df["expected_min"] -= elev_diff * ELEV_TEMPERATURE_ADJUSTMENT
        df["apparent_expected_max"] = calc_aparent_temp_vector(
            df["expected_max"],
            df["expected_max_dewpoint"],
            df["wind_gust"],
        )
        df["apparent_expected_min"] = calc_aparent_temp_vector(
            df["expected_min"],
            df["expected_min_dewpoint"],
            df["wind_gust"],
        )

    if "record_high" in df.columns and "record_low" in df.columns:
        df["record_high"] -= elev_diff * ELEV_TEMPERATURE_ADJUSTMENT
        df["record_low"] -= elev_diff * ELEV_TEMPERATURE_ADJUSTMENT
        df["record_high_dewpoint"] -= elev_diff * ELEV_DEWPOINT_ADJUSTMENT
        df["record_low_dewpoint"] -= elev_diff * ELEV_DEWPOINT_ADJUSTMENT
        df["record_high_wind_gust"] *= ELEV_WIND_ADJUSTMENT

        df["apparent_record_high"] = calc_aparent_temp_vector(
            df["record_high"],
            df["record_high_dewpoint"],
            df["record_high_wind_gust"],
        )
        df["apparent_record_low"] = calc_aparent_temp_vector(
            df["record_low"],
            df["record_low_dewpoint"],
            df["record_high_wind_gust"],
        )

    df["dewpoint"] -= elev_diff * ELEV_DEWPOINT_ADJUSTMENT
    df["mean_temperature"] = (df["high_temperature"] + df["low_temperature"]) / 2
    df["apparent_high_temperature"] = calc_aparent_temp_vector(
        df["high_temperature"],
        df["dewpoint"],
        df["wind"],
    )
    df["apparent_low_temperature"] = calc_aparent_temp_vector(
        df["low_temperature"],
        df["dewpoint"],
        df["wind"],
    )

    df["apparent_mean_temperature"] = (
        df["apparent_high_temperature"] + df["apparent_low_temperature"]
    ) / 2

    # This aproximates how much moisture is in the air.
    # If the diurinal temperature range is high, then the snow will be lighter and less dense,
    # and if it is low, then the snow will be wetter and denser, so less inches of snow per inch of precip.
    df["DTR"] = df["high_temperature"] - df["low_temperature"]
    df["RAIN_TO_SNOW_CONVERSION"] = (df["DTR"] / 2).clip(lower=5, upper=20)

    # Calculate snow averages using vectorized operations
    # Set DAILY_SNOW_AVG to 0 if DAILY_LOW_AVG is above the freezing point

    # TODO need to implement a ramping feature, so the probability is not just 1,0.5, 0
    df["PROB_OF_SNOW"] = np.where(
        df["high_temperature"] <= SNOW_DEGREE_THRESHOLD,
        1,
        np.where(df["low_temperature"] > SNOW_DEGREE_THRESHOLD, 0, 0.5),
    )

    # df['PROB_OF_SNOW'] = 0.0

    # # Probability is 1 when the high temperature is <= 32
    # df.loc[df['high_temperature'] <= SNOW_DEGREE_THRESHOLD, 'PROB_OF_SNOW'] = 1.0

    # # Calculating for in-between temperatures
    # in_between = (df['high_temperature'] > SNOW_DEGREE_THRESHOLD) & (df['low_temperature'] <= SNOW_DEGREE_THRESHOLD)
    # df.loc[in_between, 'PROB_OF_SNOW'] = (SNOW_DEGREE_THRESHOLD - df['mean_temperature']) / (SNOW_DEGREE_THRESHOLD - df['low_temperature'])

    # # Handling cases where low_temperature is exactly at the threshold to avoid division by zero
    # df.loc[df['low_temperature'] == SNOW_DEGREE_THRESHOLD, 'PROB_OF_SNOW'] = 0.5

    if elev_diff < 0:  # Elevation decrease
        reverse_factor = np.maximum(
            1 + elev_diff * ELEVATION_PRECIP_REDUCTION_FACTOR, 0
        )
        days_reverse_factor = np.maximum(
            1 + elev_diff * ELEV_PRECIP_DAYS_REDUCTION_FACTOR, 0
        )

    else:  # Elevation increase
        reverse_factor = min(
            (1 + elev_diff * ELEV_PRECIP_ADJUSTMENT_FACTOR), MAX_ELEV_ADJUST_MULTIPLIER
        )
        days_reverse_factor = min(
            (1 + elev_diff * ELEV_PRECIP_DAYS_ADJUSTMENT_FACTOR),
            MAX_ELEV_ADJUST_MULTIPLIER,
        )

    df["precipitation"] *= reverse_factor
    df["precip_days"] *= days_reverse_factor
    df["snow"] *= reverse_factor
    df["snow_days"] *= days_reverse_factor

    df["snow"] *= df["PROB_OF_SNOW"] * 1.5
    df["snow_days"] *= df["PROB_OF_SNOW"] * 1.5

    df["precipitation"] = df["precipitation"].clip(lower=0)
    df["precip_days"] = df["precip_days"].clip(lower=0, upper=1)
    df["snow"] = df["snow"].clip(lower=0)
    df["snow_days"] = df["snow_days"].clip(lower=0, upper=1)

    print("RAIN:", df["precip_days"].max())

    print("SNOW:", df["snow_days"].max())

    # df["precipitation"] *= min(
    #     (1 + elev_diff * ELEV_PRECIP_ADJUSTMENT_FACTOR), MAX_ELEV_ADJUST_MULTIPLIER
    # )

    # df["precip_days"] *= min(
    #     (1 + elev_diff * ELEV_PRECIP_DAYS_ADJUSTMENT_FACTOR), MAX_ELEV_ADJUST_MULTIPLIER
    # )

    df["precip_days"] *= max((1 + elev_diff * ELEV_PRECIP_DAYS_REDUCTION_FACTOR), 0)
    """
    weight_factor = min(abs(elev_diff) / 10, 1)
    
    df["snow"] = (
        df["precipitation"]
        * df["PROB_OF_SNOW"]
        * df["RAIN_TO_SNOW_CONVERSION"]
        * weight_factor
    ) + (df["snow"] * df["PROB_OF_SNOW"] * (1 - weight_factor))
    
    df["snow_days"] = (df["precip_days"] * df["PROB_OF_SNOW"] * weight_factor) + (
        df["snow_days"] * df["PROB_OF_SNOW"] * (1 - weight_factor)
    )
    """

    df["morning_humidity"] = calc_humidity_percentage_vector(
        df["dewpoint"], df["low_temperature"]
    )
    df["afternoon_humidity"] = calc_humidity_percentage_vector(
        df["dewpoint"], df["high_temperature"]
    )
    df["mean_humidity"] = calc_humidity_percentage_vector(
        df["dewpoint"], df["mean_temperature"]
    )

    df["morning_frost_chance"] = 100 * (
        (df["morning_humidity"] > 90) & (df["low_temperature"] <= 35)
    ).astype(int)

    df["frost_days"] = (df["morning_frost_chance"] > 0).astype(int).clip(lower=0)

    df["uv_index"] = calc_uv_index_vectorized(
        df["sun_angle"], target_elevation, df["sun"]
    )

    df["comfort_index"] = calc_comfort_index_vector(
        df["mean_temperature"],
        df["apparent_mean_temperature"],
        df["dewpoint"],
        df["sun"],
    )
    df["sunlight_hours"] = df["daylight_length"] * (df["sun"] / 100)
    df["cdd"] = calc_degree_days_vectorized(df["mean_temperature"], "cdd")
    df["hdd"] = calc_degree_days_vectorized(df["mean_temperature"], "hdd")
    df["gdd"] = calc_degree_days_vectorized(df["mean_temperature"], "gdd")
    df["growing_season"] = (df["gdd"] * 10).clip(0, 100)
    df["growing_days"] = (df["gdd"] > 0).astype(int).clip(lower=0)
    if "day_of_year" in df.columns:
        df.drop(columns=["day_of_year"], inplace=True)
    for col in DAY_COLUMNS:
        df[col] = df[col].round(1)
    df.drop(columns=["DTR"], inplace=True)
    df.drop(columns=["RAIN_TO_SNOW_CONVERSION"], inplace=True)
    df.drop(columns=["PROB_OF_SNOW"], inplace=True)


def calc_degree_days_vectorized(temperatures, degree_day_type):
    if degree_day_type == "cdd":
        return (temperatures - 65).clip(lower=0)
    elif degree_day_type == "hdd":
        return (65 - temperatures).clip(lower=0)
    elif degree_day_type == "gdd":
        return (temperatures - 50).clip(lower=0)
    else:
        return None


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

    # Handle the case where dew point is equal to or greater than the temperature
    humidity_percentages = np.where(
        dew_points_F >= temperatures_F, 100, humidity_percentages
    )

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
    # Conversion from Fahrenheit to Celsius and inches to millimeters
    avg_month_temp_c = [(t - 32) * 5 / 9 for t in temp_f]
    avg_month_precip_mm = [p * 25.4 for p in precip_in]

    # Calculate annual and specific values
    annual_temp_c = sum(avg_month_temp_c) / len(avg_month_temp_c)
    annual_precip_mm = sum(avg_month_precip_mm)
    driest_month_precip_mm = min(avg_month_precip_mm)
    wettest_month_precip_mm = max(avg_month_precip_mm)
    total_precip_warm_months = sum(
        avg_month_precip_mm[4:10]
    )  # April to September for Northern Hemisphere
    total_precip_cold_months = sum(avg_month_precip_mm[0:4]) + sum(
        avg_month_precip_mm[10:12]
    )  # Remaining months

    # Determine the precipitation threshold for arid (B) climates
    precip_threshold = annual_temp_c * 20 + (
        280
        if total_precip_warm_months >= 0.7 * annual_precip_mm
        else 140
        if total_precip_warm_months >= 0.3 * annual_precip_mm
        else 0
    )

    # Group A: Tropical Climates
    if min(avg_month_temp_c) >= 18:
        if driest_month_precip_mm >= 60:
            return "Af"  # Tropical rainforest
        elif (
            driest_month_precip_mm < 60
            and annual_precip_mm / 25 < driest_month_precip_mm
        ):
            return "Am"  # Tropical monsoon
        else:
            return "Aw"  # Tropical savanna

    # Group B: Dry Climates
    elif annual_precip_mm < precip_threshold:
        if annual_temp_c >= 18:
            return (
                "Bwh" if annual_precip_mm < precip_threshold * 0.5 else "Bsh"
            )  # Hot desert or hot semi-arid
        else:
            return (
                "Bwk" if annual_precip_mm < precip_threshold * 0.5 else "Bsk"
            )  # Cold desert or cold semi-arid

    # Group C: Temperate Climates
    if 0 <= min(avg_month_temp_c) < 18 and max(avg_month_temp_c) > 10:
        months_above_10 = sum(1 for temp in avg_month_temp_c if temp > 10)
        if (
            wettest_month_precip_mm < 3 * driest_month_precip_mm
            and driest_month_precip_mm >= 30
        ):
            return (
                "Cfa"
                if months_above_10 >= 4 and max(avg_month_temp_c) >= 22
                else "Cfb"
                if months_above_10 >= 4
                else "Cfc"
            )
        elif total_precip_warm_months >= 0.7 * annual_precip_mm:
            return (
                "Cwa"
                if months_above_10 >= 4 and max(avg_month_temp_c) >= 22
                else "Cwb"
                if months_above_10 >= 4
                else "Cwc"
            )
        else:
            return (
                "Csa"
                if months_above_10 >= 4
                and max(avg_month_temp_c) >= 22
                and driest_month_precip_mm < 30
                else "Csb"
                if months_above_10 >= 4
                and all(t < 22 for t in avg_month_temp_c)
                and driest_month_precip_mm < 30
                else "Csc"
            )
    # Group D: Continental Climates
    elif min(avg_month_temp_c) < 0 and max(avg_month_temp_c) >= 10:
        if max(avg_month_temp_c) >= 22:
            return (
                "Dfa"
                if total_precip_warm_months >= total_precip_cold_months
                else "Dsa"
                if wettest_month_precip_mm >= 3 * driest_month_precip_mm
                else "Dwa"
            )
        elif min(avg_month_temp_c) < -38:
            return (
                "Dfd"
                if total_precip_warm_months >= total_precip_cold_months
                else "Dsd"
                if wettest_month_precip_mm >= 3 * driest_month_precip_mm
                else "Dwd"
            )
        elif total_precip_warm_months >= 0.7 * annual_precip_mm:
            return (
                "Dwc"
                if all(t < 22 for t in avg_month_temp_c)
                else "Dsc"
                if min(avg_month_temp_c) >= -38
                else "Dfc"
            )
        else:
            return (
                "Dfb"
                if total_precip_warm_months >= total_precip_cold_months
                else "Dsb"
                if wettest_month_precip_mm >= 3 * driest_month_precip_mm
                else "Dwb"
            )

    # Group E: Polar and Alpine Climates
    elif max(avg_month_temp_c) < 10:
        if all(t < 0 for t in avg_month_temp_c):
            return "EF"  # Ice cap
        elif any(t < 0 for t in avg_month_temp_c):
            return "ET"  # Cold tundra (ETf)
        else:
            return "ET"  # Mild tundra

    # Default case if no classification fits
    return "Unclassified"


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
