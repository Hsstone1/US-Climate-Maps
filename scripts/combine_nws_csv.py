import pandas as pd
import os

# Define the column mapping based on the provided specifications
column_mapping = {
    "MIN": "high_temperature",
    "AVG": "low_temperature",
    "HDD": "departure_temperature",
    "SNW": "precip",
    "DPTH": "snow",
    "MAX SPD": "wind_avg",
    "DIR": "wind_gust",
    "S-S": "sunshine_percent",
    "DR": "wind_dir",
    "Date": "date",
    "Latitude": "latitude",
    "Longitude": "longitude",
    "SolarNoonAngle": "sun_angle",
}


def process_file(file_path, column_mapping):
    """
    Reads a CSV file, selects specific columns, and renames them.

    Parameters:
    file_path (str): The path to the CSV file.
    column_mapping (dict): A dictionary mapping original column names to new names.

    Returns:
    pd.DataFrame: The processed DataFrame.
    """
    try:
        # Read the file
        data = pd.read_csv(file_path)

        # Select and rename columns
        data = data[list(column_mapping.keys())].rename(columns=column_mapping)

        return data
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        return pd.DataFrame()


def main(directory_path, output_file):
    # Iterate over each file in the directory and process it
    all_data = pd.DataFrame()
    for file_name in os.listdir(directory_path):
        if file_name.endswith(".csv"):
            file_path = os.path.join(directory_path, file_name)
            processed_data = process_file(file_path, column_mapping)
            all_data = pd.concat([all_data, processed_data], ignore_index=True)

    # Save the combined data to a new CSV file
    all_data.to_csv(output_file, index=False)
    print(f"Combined data saved to {output_file}")


if __name__ == "__main__":
    print("Script started...")
    # Define the directory where the CSV files are stored
    directory_path = "C:\\Projects\\US-Climate-Maps\\stations\\NWS_STATION_FILES"
    output_file = "combined_climate_data.csv"
    main(directory_path, output_file)
    print("Script completed.")
