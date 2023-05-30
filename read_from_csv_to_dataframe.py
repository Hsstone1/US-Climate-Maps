import pandas as pd
import csv
import os
import glob
import time
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor


# Used only for gathering data initially
def main():
    
    start_time = time.time()

    #First full run --- 104.13217902183533 seconds ---
    
    
    '''
    This reads all csv files when given the appropriate acronyms
    '''

    NWS_PROVIDER = "BOU"
    CITY_CODE = "CCU"
    #df, num_entries = df_from_csv(NWS_PROVIDER, CITY_CODE)
    #print(df)




    print("--- %s seconds ---" % (time.time() - start_time))

def read_from_csv(file):
    csv_file = pd.read_csv(file)
    csv_data = (file[:-4].split('_')[2:])
    years = [csv_data[0]] * len(csv_file)
    months = [csv_data[1]] * len(csv_file)
    lats = [csv_data[2]] * len(csv_file)
    longs = [csv_data[3]] * len(csv_file)
    
    return csv_file, months, years, lats, longs



def df_from_NWS_csv(NWS_PROVIDER, CITY_CODE):

    path = f"{os.getcwd()}\\STATIONS\\{NWS_PROVIDER}\\{CITY_CODE}\\"
    #print(NWS_PROVIDER, CITY_CODE)

    files = glob.glob(path + "*.csv")
    df = []
    num_entries = 0
    months = []
    years = []
    lats = []
    longs = []

    
    with ThreadPoolExecutor(4) as executor:
        # Submit the read_csv function for each CSV file
        futures = [executor.submit(read_from_csv, f) for f in files]

        # Wait for all tasks to complete and get the results
        for future in futures:
            csv_file, csv_months, csv_years, csv_lats, csv_longs = future.result()
            df.append(csv_file)
            months.extend(csv_months)
            years.extend(csv_years)
            lats.extend(csv_lats)
            longs.extend(csv_longs)
            num_entries += 1

    # Concatenate the results into a single DataFrame
    df = pd.concat(df)

    # CSV files have duplicate MAX column, and DIR header before S-S but that is unused so it is removed
    df.columns = ['DY', 'MAX', 'MAX', 'MIN', 'AVG', 'DEP', 'HDD', 'CDD', 'WTR', 'SNW', 'DPTH', 'AVG SPD', 'MAX SPD', 'S-S', 'DR', 'WX']
    df["MONTH"] = months
    df["YEAR"] = years
    df["LAT"] = lats
    df["LON"] = longs

    # This removes the one duplicate column 'MAX'
    df = df.loc[:,~df.columns.duplicated()].copy()

    return df, num_entries

def put_NOAA_csvs_name_into_df():
    path = f"{os.getcwd()}\\STATIONS\\NOAA-STATIONS\\"
    file_names = glob.glob(path + "*.csv")

    data = {}

    # Iterate over the file names and split them
    for file_name in file_names:
        # Remove the file extension
        file_name = file_name[:-4]

        # Split the file name using '_'
        split_values = file_name.split('_')
        # This splits the path string, pulling the station identifier out of path
        split_values[0] = split_values[0].split("\\")[9]
        column_names = ["STATION", "LAT", "LON", "ELEVATION", "NAME"]

        # Assign the split values to the corresponding columns
        for i, value in enumerate(split_values):
            #column_name = f"Column_{i+1}"  # Create column names like 'Column_1', 'Column_2', etc.
            column_name = column_names[i]
            if column_name not in data:
                data[column_name] = []
            data[column_name].append(value)
        
    df = pd.DataFrame(data)
    columns_to_convert = ["LAT", "LON", "ELEVATION"]
    df[columns_to_convert] = df[columns_to_convert].astype(float)

    return df

    # Step 5: Optional - Display the DataFrame
    print(df)
    highest_value = df["ELEVATION"].quantile(1)
    print(highest_value)
    print(df.loc[df["ELEVATION"] == highest_value])


def get_NOAA_csv_content():
    path = f"{os.getcwd()}\\STATIONS\\_NOAA_STATIONS\\"
    files = glob.glob(path + "*.csv")
    desired_cols = ['DATE', 'PRCP', 'PRCP_ATTRIBUTES', 'SNOW', 'TMAX', 'TMIN']

    
    for f in files[223:230]:
        df = pd.read_csv(f, usecols=desired_cols)

        df['DATE'] = pd.to_datetime(df['DATE'])

        # Filter the DataFrame based on the condition where the date is more recent than 2000-01-01
        filtered_df = df[df['DATE'] > '2000-01-01']
        filtered_df = filtered_df[filtered_df["DATE"] < '2019-04-01']

        filtered_df.loc[df['PRCP_ATTRIBUTES'].str.contains('T') & (filtered_df['PRCP'] == 0), 'PRCP'] = 1
        filtered_df['TAVG'] = (filtered_df["TMAX"] + filtered_df["TMIN"]) / 2
        filtered_df['CDD'] = (((filtered_df['TAVG']* 9/50) + 32) - 65).clip(lower=0)
        filtered_df['HDD'] = (65 - ((filtered_df['TAVG']* 9/50) + 32)).clip(lower=0)

        days = calculate_days_from_reference('2019-04-01', '2000-01-01')


        #Units are in tenths of degrees C, so divide by 9/50 instead of 9/5
        print("\n-----------------\n",f)
        print("100%", round((filtered_df["TMAX"].quantile(1) * 9/50) + 32), "°F")
        print("99% ", round((filtered_df["TMAX"].quantile(.99) * 9/50) + 32), "°F")
        print("TMAX", round((filtered_df["TMAX"].mean() * 9/50) + 32), "°F")
        print("TAVG", round((filtered_df["TAVG"].mean() * 9/50) + 32), "°F")
        print("TMIN", round((filtered_df["TMIN"].mean() * 9/50) + 32), "°F")
        print("1%  ", round((filtered_df["TMIN"].quantile(.01) * 9/50) + 32), "°F")
        print("0%  ", round((filtered_df["TMIN"].quantile(0) * 9/50) + 32), "°F")
        print("CDD ", round((filtered_df["CDD"].sum() /(days / 365.25))), "°F")
        print("HDD ", round((filtered_df["HDD"].sum() /(days / 365.25))), "°F")
        print("PRCP", round((filtered_df["PRCP"].mean() / 254 * 365.25), 1), "in")
        print("SNOW", round((filtered_df["SNOW"].mean() / 25.4 * 365.25), 1), "in")
        print("PDAY", round((filtered_df.loc[filtered_df['PRCP'] > 0.01, 'PRCP'].count() /(days / 365.25))), "days")
        print("SDAY", round((filtered_df.loc[filtered_df['SNOW'] > 0.01, 'SNOW'].count() /(days / 365.25))), "days")
        




def calculate_days_from_reference(date_str, ref_date_str):

    # Convert the date strings to datetime objects
    date = datetime.strptime(date_str, '%Y-%m-%d')
    reference_date = datetime.strptime(ref_date_str, '%Y-%m-%d')

    # Calculate the difference in days
    days_difference = (date - reference_date).days

    return days_difference




# Converts coordinates from csv file name to a usable decimal pair

def conv_coord_to_dec(latStr, lonStr):
    latStr = latStr.replace('-', '\'')
    lonStr = lonStr.replace('-', '\'')
    lat = latStr.split('\'')
    lon = lonStr.split('\'')
    lat = list(filter(None, lat))
    lon = list(filter(None, lon))    


    lat_dec = int(lat[0]) + (int(lat[1]) / 60)
    lon_dec = int(lon[0]) + (int(lon[1]) / 60)
    if lat[2] == 'S':
        lat_dec *= -1
    if lon[2] == 'W':
        lon_dec *= -1

    return round(lat_dec,3),round(lon_dec,3)
    

if __name__ == "__main__":
    main()
    pass