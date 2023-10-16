# Description: This file contains the classes used to store climate data.
import calendar
import json

class WeatherData:
    def __init__(self, weight=1):
        self.data = {}
        self.weight = weight
        self.data_keys = {
            'high_temp': None,
            'mean_temp': None,
            'low_temp': None,
            'mean_max_temp': None,
            'mean_min_temp': None,
            'record_high_temp': None,
            'record_low_temp': None,
            'apparent_high_temp': None,
            'apparent_low_temp': None,
            'HDD': None,
            'CDD': None,
            'precip_in': None,
            'snow_in': None,
            'precip_days': None,
            'snow_days': None,
            'frost_free_days': None,
            'dewpoint_temp': None,
            'humidity_percent': None,
            'wind_spd': None,
            'wind_dir': None,
            'sunshine_percent': None,
            'sunshine_days': None,
            'daylight_hours': None,
            'sunshine_hours': None,
            'sun_angle': None,
            'uv_index': None,
            'comfort_index': None,
            # Add more keys here as needed

        }

    # Add data to the data dictionary for a given day
    # variable length keyword arguments are used to allow for the addition of new data keys
    # without having to change the function definition
    def add_data(self, year, month, day, **kwargs):
        if year not in self.data:
            self.data[year] = {}
        if month not in self.data[year]:
            self.data[year][month] = {}
        if day not in self.data[year][month]:
            self.data[year][month][day] = {key: None for key in self.data_keys}
        
        for key, value in kwargs.items():
            # Check if the key exists in the data_keys and the provided value is not None
            if key in self.data_keys and value is not None:
                self.data[year][month][day][key] = value

    def calculate_average(self, data_points):
        total = {key: 0 for key in self.data_keys}
        count = 0

        for point in data_points:
            data_point = self.data[point[0]][point[1]][point[2]]
            for key in self.data_keys:
                value = data_point[key]
                # Check if the value is not None, cannot add NoneType to int with +=
                if value is not None:  
                    total[key] += value
            count += 1

        if count > 0:
            return {key: total[key] / count for key in self.data_keys}
        else:
            return None

    def get_all_valid_dates(self):
        return [(year, month, day) for year in self.data for month in self.data[year] for day in self.data[year][month]]

    def get_all_data(self):
        return self.data

    def get_all_data_for_year(self, year):
        return self.data.get(year, None)

    def get_all_data_for_month(self, year, month):
        return self.data.get(year, {}).get(month, None)

    def get_all_data_for_day(self, year, month, day):
        return self.data.get(year, {}).get(month, {}).get(day, None)

    def get_avg_annual_data(self, year=None):
        if year is not None:
            # Calculate the average for the specified year
            annual_dates = [(year, month, day) for month in range(1, 13) for day in range(1, calendar.monthrange(year, month)[1] + 1)]
        else:
            # Calculate the average for all years
            annual_dates = [(years, month, day) for years in self.data for month in range(1, 13) for day in range(1, 32)]

        invalid_dates = []
        valid_annual_dates = []

        for date in annual_dates:
            year, month, day = date
            if year in self.data and month in self.data[year] and day in self.data[year][month]:
                valid_annual_dates.append(date)
            else:
                invalid_dates.append(date)

        if invalid_dates:
            #print("Invalid dates in the data:", invalid_dates)
            pass

        return self.calculate_average(valid_annual_dates)

    def get_avg_monthly_data(self, month, year=None):
        if year is not None:
            # Calculate the average for the specified month and year
            monthly_dates = [(year, month, day) for day in range(1, 32)]
        else:
            # Calculate the average for the specified month across all years
            monthly_dates = [(years, month, day) for years in self.data for day in self.data[years].get(month, {})]

        invalid_dates = []
        valid_monthly_dates = []

        for date in monthly_dates:
            year, month, day = date
            if year in self.data and month in self.data[year] and day in self.data[year][month]:
                valid_monthly_dates.append(date)
            else:
                invalid_dates.append(date)

        if invalid_dates:
            #print("Invalid dates in the data:", invalid_dates)
            pass

        return self.calculate_average(valid_monthly_dates)
    

    def get_avg_daily_data(self, month, day, year=None):
        if year is not None:
            # Calculate the average for the specified day, month, and year
            daily_dates = [(year, month, day)]
        else:
            # Calculate the average for the specified day and month across all years
            daily_dates = [(years, month, day) for years in self.data if month in self.data[years]]

        invalid_dates = []
        valid_daily_dates = []

        for date in daily_dates:
            year, month, day = date
            if year in self.data and month in self.data[year] and day in self.data[year][month]:
                valid_daily_dates.append(date)
            else:
                invalid_dates.append(date)

        if invalid_dates:
            #print("Invalid dates in the data:", invalid_dates)
            pass

        return self.calculate_average(valid_daily_dates)

    def get_all_data_for_month_and_day(self, month, day, key=None):
        # Create a list to store data points
        data_points = []

        for year in self.data:
            if month in self.data[year]:
                if day in self.data[year][month]:
                    data_point = self.data[year][month][day]
                    if key is not None:
                        # If a key is specified, add only that data to the list
                        value = data_point.get(key)
                        if value is not None:
                            data_points.append((year, month, day, {key: value}))
                    else:
                        # If no key is specified, add all data for that day
                        data_points.append((year, month, day, data_point))

        return data_points

    def get_avg_data_all_years(self):
        yearly_averages = {}

        for year in self.data:
            yearly_averages[year] = self.calculate_average([(year, month, day) for month in self.data[year] for day in self.data[year][month]])

        return yearly_averages

    def get_avg_data_all_months(self):
        monthly_averages = {}

        for year in self.data:
            for month in self.data[year]:
                monthly_averages[(year, month)] = self.calculate_average([(year, month, day) for day in self.data[year][month]])

        return monthly_averages

    def get_avg_data_all_days(self):
        daily_data = {}

        for year in self.data:
            for month in self.data[year]:
                for day in self.data[year][month]:
                    daily_data[(year, month, day)] = self.calculate_average([(year, month, day)])

        return daily_data
    

    # Returns a list of values for the specified key
    # If year, month, and day are specified, only values for that combination are returned
    # Else, all values for the specified key are returned
    def get_all_day_values_of_key(self, key, year=None, month=None, day=None):
        # Create an empty list to store values for the specified key
        values = []

        # Iterate through the data and extract values for the specified key
        for y in self.data:
            if year is not None and y != year:
                continue  # Skip if the specified year doesn't match

            for m in self.data[y]:
                if month is not None and m != month:
                    continue  # Skip if the specified month doesn't match

                for d in self.data[y][m]:
                    if day is not None and d != day:
                        continue  # Skip if the specified day doesn't match

                    data_point = self.data[y][m][d]
                    value = data_point.get(key)
                    if value is not None:
                        values.append(value)

        return values








class DailyWeatherData:
    def __init__(self):
        self.day = {}  # Dictionary to store historical data for a given day


class MonthlyWeatherData:
    def __init__(self):
        self.avg_monthly = {}  # List of DailyWeatherData for each day in the month
        self.days = {}

class YearlyWeatherData:
    def __init__(self):
        self.avg_annual = {}
        self.months = {}  # Dictionary to store historical data for all months in a year

class HistoricalWeatherData:
    def __init__(self):
        self.avg_annual = {}  # Average values for all years
        self.avg_monthly = [] # Average values for all months, regardless of year
        self.avg_daily = []   # Average values for all days, regardless of year
        self.years = {}  # Dictionary to store historical data from 1980 to 2023



class LocationData:
    def __init__(self):
        self.elevation = 0
        self.koppen = ''
        self.plant_hardiness = ''



class WeatherDataEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, HistoricalWeatherData):
            # Convert HistoricalWeatherData to a serializable dictionary
            return {
                'avg_annual': obj.avg_annual,
                'avg_monthly': obj.avg_monthly,
                'avg_daily': obj.avg_daily,
                'years': obj.years,
            }
        elif isinstance(obj, LocationData):
            # Convert LocationData to a serializable dictionary
            return {
                'elevation': obj.elevation,
                'koppen': obj.koppen,
                'plant_hardiness': obj.plant_hardiness,
            }
        elif isinstance(obj, YearlyWeatherData):
            # Convert YearlyWeatherData to a serializable dictionary
            return {
                'avg_annual': obj.avg_annual,
                'months': obj.months,
            }
        elif isinstance(obj, MonthlyWeatherData):
            # Convert MonthlyWeatherData to a serializable dictionary
            return {
                'avg_monthly': obj.avg_monthly,
                'days': obj.days,
            }
        elif isinstance(obj, DailyWeatherData):
            # Convert DailyWeatherData to a serializable dictionary
            return {
                'day': obj.day,
            }
        return super().default(obj)

