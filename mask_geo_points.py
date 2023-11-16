import geopandas as gpd
import pandas as pd
from shapely.geometry import Point
import os


def main_method():
    file_path = os.path.join(os.getcwd(), "corrected_usa_grid_points.csv")
    corrected_grid_data = pd.read_csv(file_path)

    corrected_grid_data["geometry"] = corrected_grid_data.apply(
        lambda row: Point(row["longitude"], row["latitude"]), axis=1
    )
    geo_grid_data = gpd.GeoDataFrame(corrected_grid_data, geometry="geometry")

    world = gpd.read_file(gpd.datasets.get_path("naturalearth_lowres"))
    usa_border = world[world.name == "United States of America"]

    buffer_distance_km = 111  # 1 degree latitude in kilometers
    usa_border_buffered = (
        usa_border.to_crs(epsg=3395).buffer(buffer_distance_km * 1000).to_crs(epsg=4326)
    )

    geo_grid_data = geo_grid_data[geo_grid_data.within(usa_border_buffered.unary_union)]
    # Print the size of the DataFrame
    print("Size of the DataFrame:", geo_grid_data.shape)

    # Convert the geometry column to a string representation
    geo_grid_data["geometry"] = geo_grid_data["geometry"].apply(lambda x: x.wkt)

    # Save to a CSV file
    output_file_path = os.path.join(os.getcwd(), "filtered_geo_grid_points.csv")
    geo_grid_data.to_csv(output_file_path, index=False)
    print(f"Saved the filtered data to {output_file_path}")


if __name__ == "__main__":
    main_method()
