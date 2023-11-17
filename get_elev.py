import csv
import os
import requests
import pandas as pd


# Function to get elevation from Google Elevation API
def get_elevation(lat, lon, api_key):
    url = "https://maps.googleapis.com/maps/api/elevation/json"
    params = {
        "locations": f"{lat},{lon}",
        "key": api_key,
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        result = response.json()
        if result["status"] == "OK":
            # Convert elevation from meters to feet
            elevation_meters = result["results"][0]["elevation"]
            elevation_feet = elevation_meters * 3.28084
            return elevation_feet
        else:
            print(f"Error finding elevation: {result['status']}")
            print(
                f"Error details: {result['error_message'] if 'error_message' in result else 'No additional error message.'}"
            )
            return None
    else:
        print(f"HTTP error: {response.status_code}")
        print(f"Response content: {response.content}")
        return None


def elevation():
    api_key = "AIzaSyAq_TfamT2GztucwP0IbBfa_kQx5ebfIno"

    # Replace 'path/to/your/csvfile.csv' with the path to your CSV file
    file_path = f"{os.getcwd()}\\"

    input_csv_path = file_path + "downsampled_geo_grid_points.csv"
    output_csv_path = file_path + "geo_elev_grid_points.csv"

    # Process the CSV file
    with open(input_csv_path, newline="") as csvfile, open(
        output_csv_path, mode="w", newline=""
    ) as outputfile:
        csvreader = csv.DictReader(csvfile)
        fieldnames = csvreader.fieldnames + ["elevation"]
        csvwriter = csv.DictWriter(outputfile, fieldnames=fieldnames)

        csvwriter.writeheader()

        for row in csvreader:
            lat = row["latitude"]
            lon = row["longitude"]
            elevation = get_elevation(lat, lon, api_key)
            if elevation is not None:
                row["elevation"] = elevation
                print(f"Retrieved elevation for {lat}, {lon}: {elevation}")
            else:
                row["elevation"] = "Error"
            csvwriter.writerow(row)

    print("Elevation data retrieval complete.")


if __name__ == "__main__":
    elevation()
