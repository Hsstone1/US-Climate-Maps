import pandas as pd
import csv
import os
import glob
import time
import requests
import math
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler



# Used only for gathering data initially
def main():
    
    start_time = time.time()

    '''
    This reads all csv files when given the appropriate acronyms
    '''

    NWS_PROVIDER = "BOU"
    CITY_CODE = "CCU"
    #df, num_entries = df_from_csv(NWS_PROVIDER, CITY_CODE)
    #print(df)

    print("--- %s seconds ---" % (time.time() - start_time))

'''
Used Weather Underground monthly history for climate records containing humidity and dewpoint
Locations: Charleston SC, Saint George UT, Bend OR, Seattle WA, Loveland CO, Boston MA, San Diego CA, Miami FL, Anchorage AK, Honolulu HI, Dallas TX, Indianapolis IN, Houston TX
365 days from each location used. Places were chosen due to climate zone variation

'''
def humidity_regr_from_temp_max_min(Tmax, Tmin, totalPrcp):
    df = pd.read_csv("temperature-humidity-data.csv")
    df["TDiurinal"] = (df["TMax"] - df["TMin"])

    X = df[['TMax',  'TMin', 'TDiurinal', 'Total']]

    y = df[['DAvg']]
    y_H = df[['HAvg']] 

    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=42)
    H_X_train, H_X_test, H_y_train, H_y_test = train_test_split(X, y_H, test_size=0.5, random_state=42)

    y_train = y_train.values.ravel()
    H_y_train = H_y_train.values.ravel()


    # Scale the features using StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    H_X_train_scaled = scaler.fit_transform(H_X_train)
    H_X_test_scaled = scaler.transform(H_X_test)


    # Initialize the Random Forest Regressor
    rf_model = RandomForestRegressor(n_estimators=5,random_state=42)
    H_rf_model = RandomForestRegressor(n_estimators=5,random_state=42)

    rf_model.fit(X_train_scaled, y_train)
    H_rf_model.fit(H_X_train_scaled, H_y_train)
    

    Tdiurinal = [x - y for x, y in zip(Tmax, Tmin)]
    TAvg = [(x + y)/2 for x, y in zip(Tmax, Tmin)]

    #Predictor input values
    new_data = pd.DataFrame({'TMax': Tmax, 'TMin': Tmin, 'TDiurinal': Tdiurinal, 'Total': totalPrcp})

    rf_predicted_dewpoint = rf_model.predict(scaler.transform(new_data))
    rf_predicted_humidity = H_rf_model.predict(scaler.transform(new_data))

    dewpoint = compute_dew_point(rf_predicted_humidity, TAvg)

    return (dewpoint + rf_predicted_dewpoint) / 2

def compute_dew_point(RH, T):
    TD = []
    for i in range(len(T)):
        t = (T[i]-32) * 5/9
        rh = RH[i]
        td = 243.04 * (math.log(rh/100) + ((17.625*t) / (243.04 + t))) / (17.625 - math.log(rh/100) - ((17.625*t) / (243.04 + t)))
        td = (td * 9/5) + 32
        TD.append(td)
    return TD

def read_from_csv(file):
    #TODO usecols here to reduce load time since NOAA dataset covers everything else
    desired_cols = ['S-S', 'AVG SPD', 'MAX SPD', 'DR']
    csv_file = pd.read_csv(file, usecols=desired_cols)
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
    df.columns = ['AVG SPD', 'MAX SPD', 'S-S', 'DR']
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
    df["LAT"] = df["LAT"].astype(float)
    df["LON"] = df["LON"].astype(float)
    df["ELEVATION"] = df["ELEVATION"].astype(int)


    return df


def get_NOAA_csv_content(file, start_date='2000-01-01', end_date='2019-04-01'):
    path = f"{os.getcwd()}\\STATIONS\\NOAA-STATIONS\\"
    #files = glob.glob(path + "*.csv")
    desired_cols = ['DATE', 'PRCP', 'PRCP_ATTRIBUTES', 'SNOW', 'TMAX', 'TMIN']

    
    #for f in files[223:230]:
    df = pd.read_csv(path + file, usecols=desired_cols)

    df['DATE'] = pd.to_datetime(df['DATE'])

    # Filter the DataFrame based on the condition where the date is more recent than 2000-01-01
    # All csv files have data after 2000-01-01. Any time before is not guarenteed
    filtered_df = df[df['DATE'] > start_date]
    filtered_df = filtered_df[filtered_df["DATE"] < end_date]

    filtered_df.loc[df['PRCP_ATTRIBUTES'].str.contains('T') & (filtered_df['PRCP'] == 0), 'PRCP'] = 1
    filtered_df['TAVG'] = (filtered_df["TMAX"] + filtered_df["TMIN"]) / 2
    filtered_df['CDD'] = (((filtered_df['TAVG']* 9/50) + 32) - 65).clip(lower=0)
    filtered_df['HDD'] = (65 - ((filtered_df['TAVG']* 9/50) + 32)).clip(lower=0)

    return filtered_df


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