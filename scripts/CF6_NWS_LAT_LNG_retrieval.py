import os
import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
import logging

# Initialize logging
logging.basicConfig(
    filename="coordinate_fetch_log.log",
    level=logging.INFO,
    format="%(asctime)s:%(levelname)s:%(message)s",
)


def fetch_coordinates(site, issuedby):
    try:
        # Construct the URL
        url = f"https://forecast.weather.gov/product.php?site={site}&product=CF6&issuedby={issuedby}"

        # Send a request to the URL
        response = requests.get(url)
        if response.status_code != 200:
            logging.error(
                f"Failed to fetch data for {site}_{issuedby}. HTTP Status Code: {response.status_code}"
            )
            return None, None

        # Parse the content using BeautifulSoup
        soup = BeautifulSoup(response.content, "html.parser")

        # Find the latitude and longitude using regular expressions
        lat_lon_text = soup.get_text()
        lat_match = re.search(
            r"LATITUDE\s*:\s*(\d+)\s+(\d+)\s+([NS])", lat_lon_text
        ) or re.search(r"LATITUDE\s*:\s*(\d+)\s+(\d+)\s+([NS])", lat_lon_text)
        lon_match = re.search(
            r"LONGITUDE\s*:\s*(\d+)\s+(\d+)\s+([EW])", lat_lon_text
        ) or re.search(r"LONGITUDE\s*:\s*(\d+)-(\d+)\s+([EW])", lat_lon_text)

        if lat_match and lon_match:
            # Extract and convert the coordinates
            lat_decimal, lon_decimal = convert_to_decimal(lat_match, lon_match)
            return lat_decimal, lon_decimal

        logging.error(f"Coordinates not found in the page for {site}_{issuedby}.")
        return None, None

    except Exception as e:
        logging.exception(f"Error fetching coordinates for {site}_{issuedby}: {e}")
        return None, None


def convert_to_decimal(lat_match, lon_match):
    # Extract the latitude and longitude components
    lat_deg, lat_min, lat_dir = lat_match.groups()
    lon_deg, lon_min, lon_dir = lon_match.groups()

    # Convert to decimal format
    lat_decimal = int(lat_deg) + int(lat_min) / 60
    lon_decimal = int(lon_deg) + int(lon_min) / 60

    # Adjust the sign based on the direction
    if lat_dir == "S":
        lat_decimal *= -1
    if lon_dir == "W":
        lon_decimal *= -1

    return lat_decimal, lon_decimal


if __name__ == "__main__":
    folder_path = "C:\\Projects\\US-Climate-Maps\\stations\\NWS_STATION_FILES"

    for file_name in os.listdir(folder_path):
        if file_name.endswith(".csv"):
            parts = file_name.split("_")
            site, issuedby = parts[0], parts[1].replace(".csv", "")
            latitude, longitude = fetch_coordinates(site, issuedby)

            if latitude is not None and longitude is not None:
                try:
                    file_path = os.path.join(folder_path, file_name)
                    data = pd.read_csv(file_path)

                    data["Latitude"] = latitude
                    data["Longitude"] = longitude

                    data.to_csv(file_path, index=False)
                    logging.info(f"Successfully updated {file_name} with coordinates.")

                except Exception as e:
                    logging.exception(f"Error updating file {file_name}: {e}")
            else:
                logging.error(
                    f"Failed to fetch or convert coordinates for {file_name}."
                )

    logging.info("All files processing completed.")
