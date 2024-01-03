import os
import pandas as pd
import pvlib  # Library for solar energy system modeling
import logging

# Initialize logging
logging.basicConfig(
    filename="sun_angle_processing.log",
    level=logging.INFO,
    format="%(asctime)s:%(levelname)s:%(message)s",
)


def calculate_solar_noon_angles(latitudes, longitudes, dates):
    # Prepare the data
    data = pd.DataFrame({"latitude": latitudes, "longitude": longitudes, "date": dates})
    data["date"] = pd.to_datetime(data["date"])  # Ensure dates are in datetime format

    # Initialize a list to hold the solar noon angles
    solar_noon_angles = []

    for _, row in data.iterrows():
        # Calculate the solar noon (transit) time for the given date and location
        times = pd.date_range(
            start=row["date"], end=row["date"] + pd.Timedelta(days=1), freq="1min"
        )
        solar_position = pvlib.solarposition.get_solarposition(
            times, row["latitude"], row["longitude"]
        )
        solar_noon_time = solar_position["apparent_elevation"].idxmax()

        # Calculate the solar position at solar noon
        solar_noon_position = pvlib.solarposition.get_solarposition(
            solar_noon_time, row["latitude"], row["longitude"]
        )

        # Append the solar elevation at noon to the list
        solar_noon_angles.append(solar_noon_position["apparent_elevation"].iloc[0])

    return solar_noon_angles


def add_solar_noon_angle_to_csv(file_path):
    try:
        # Read the CSV file
        data = pd.read_csv(file_path)

        # Ensure the file has 'Latitude', 'Longitude', and 'Date' columns
        if (
            "Latitude" in data.columns
            and "Longitude" in data.columns
            and "Date" in data.columns
        ):
            # Calculate the solar noon angles for all rows and add as a new column
            data["SolarNoonAngle"] = calculate_solar_noon_angles(
                data["Latitude"], data["Longitude"], data["Date"]
            )

            # Save the updated CSV
            data.to_csv(file_path, index=False)
            logging.info(
                f"Successfully updated {os.path.basename(file_path)} with solar noon angles."
            )
        else:
            logging.warning(
                f"Missing required columns in {os.path.basename(file_path)}."
            )

    except Exception as e:
        logging.error(f"Error processing file {os.path.basename(file_path)}: {e}")


if __name__ == "__main__":
    folder_path = "C:\\Projects\\US-Climate-Maps\\stations\\NWS_STATION_FILES"

    # Loop through each file in the folder
    for file_name in os.listdir(folder_path):
        if file_name.endswith(".csv"):
            file_path = os.path.join(folder_path, file_name)
            add_solar_noon_angle_to_csv(file_path)

    logging.info("Solar noon angle addition to all files completed.")
