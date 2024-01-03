import pandas as pd
import io

# Path to the locally downloaded GHCN inventory file
inventory_file_path = "ghcnd-inventory.txt"  # adjust the path if necessary

# Read the inventory file into a DataFrame
# Assuming the inventory file format is: station_id, latitude, longitude, element, first_year, last_year
columns = ["station_id", "latitude", "longitude", "element", "first_year", "last_year"]
with open(inventory_file_path, "r") as file:
    inventory_data = file.read()
inventory_df = pd.read_csv(io.StringIO(inventory_data), sep="\s+", names=columns)

# Filter stations with data from 1980 to 2023
filtered_stations = inventory_df[
    (inventory_df["first_year"] <= 1980)
    & (inventory_df["last_year"] >= 2023)
    & (inventory_df["element"].isin(["TMAX", "TMIN", "PRCP", "SNOW"]))
]

# Drop duplicate station entries, keeping the first occurrence
unique_stations = filtered_stations.drop_duplicates(subset=["station_id"])

# Select relevant columns for the output
output_columns = ["station_id", "latitude", "longitude", "first_year"]
final_stations = unique_stations[output_columns]

# Write the data to a CSV file
output_file_path = "station_ids_with_details_1980.csv"
final_stations.to_csv(output_file_path, index=False)

print(f"Written {len(final_stations)} station details to {output_file_path}")
