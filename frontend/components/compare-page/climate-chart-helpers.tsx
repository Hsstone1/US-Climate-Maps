import { TempeartureDataKeys, ClimateDataKeys } from "./climate-chart-datasets";

export function dayOfYearToDate(dayIndex: number, year: number): string {
  const date = new Date(year, 0, dayIndex + 1);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function getFirstDayOfMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  return firstDay.getDay(); // Returns the day of the week (0 for Sunday, 1 for Monday, etc.)
}

export function getLastDayOfMonth(year: number, month: number): number {
  // By setting the day as 0, it will roll back to the last day of the previous month
  const lastDay = new Date(year, month + 1, 0);
  return lastDay.getDate(); // Returns the last day of the month
}

export function isDayInMonth(
  dayIndex: number,
  year: number,
  month: number
): boolean {
  const date = new Date(year, 0, dayIndex + 1);
  return date.getMonth() === month;
}

type ChartConfig = {
  chartBorderWidth: number;
  lineTension: number;
  lineAlpha: number;
  backgroundAlpha: number;
  paginatedBackgroundAlpha: number;
  headingVariant: any;
  smaSmoothDays: number;
  lazyLoadHeight: number;
  lazyLoadOffset: number;
  doLazyLoadOnce: boolean;
};

// Create and export the constant object
export const chartConfig: ChartConfig = {
  chartBorderWidth: 1,
  lineTension: 0.5,
  lineAlpha: 1,
  backgroundAlpha: 0.04,
  paginatedBackgroundAlpha: 0.5,
  headingVariant: "h5",
  smaSmoothDays: 30,
  lazyLoadHeight: 300,
  lazyLoadOffset: 0,
  doLazyLoadOnce: false,
};

export type ClimateChartDataset = {
  type: "line" | "bar";
  label: string; //Location Name
  data: any;
  pointBackgroundColor?: string; //rgba(N, N, N, 0.N)
  backgroundColor?: string; //rgba(N, N, N, 0.N)
  borderColor: string; //rgba(N, N, N, 0.N)
  borderWidth?: number;
  borderDash?: any;
  pointRadius?: number;
  pointHoverRadius?: number;
  lineTension?: number;
  fill?: any;
  createGradient?: (
    context: CanvasRenderingContext2D,
    chartArea: any
  ) => CanvasGradient;
  yAxisID:
    | "Temperature"
    | "Precip"
    | "Sun_Angle"
    | "Percentage"
    | "Wind"
    | "Comfort_Index"
    | "UV_Index"
    | "Dewpoint";
};

export type TimeGranularity =
  | "daily"
  | "monthly"
  | "annual"
  | "annual_max"
  | "annual_min"
  | "monthly_max"
  | "monthly_min";

export const MonthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const DaysOfWeekLabels = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export const temperatureKeys: TempeartureDataKeys = {
  Max: "expected_max",
  High: "high_temperature",
  Low: "low_temperature",
  Min: "expected_min",
};

export const apparentTemperatureKeys: TempeartureDataKeys = {
  Max: "apparent_expected_max",
  High: "apparent_high_temperature",
  Low: "apparent_low_temperature",
  Min: "apparent_expected_min",
};

export const annualPrecipKeys: ClimateDataKeys = {
  Avg: "precipitation",
};

export const paginatedPrecipKeys: ClimateDataKeys = {
  Avg: "precipitation",
  Historical: "precipitation",
};

export const annualSnowKeys: ClimateDataKeys = {
  Avg: "snow",
};

export const paginatedSnowKeys: ClimateDataKeys = {
  Avg: "snow",
  Historical: "snow",
};

export const annualHumidityKeys: ClimateDataKeys = {
  Avg: "afternoon_humidity",
};
export const paginatedHumidityKeys: ClimateDataKeys = {
  Avg: "afternoon_humidity",
  Historical: "afternoon_humidity",
};

export const annualDewpointKeys: ClimateDataKeys = {
  High: "expected_max_dewpoint",
  Low: "expected_min_dewpoint",
  //Avg: "dewpoint",
};
export const paginatedDewpointKeys: ClimateDataKeys = {
  Avg: "dewpoint",
  Historical: "dewpoint",
};
export const annualWindKeys: ClimateDataKeys = {
  Avg: "wind_gust",
};

//This uses Gust instead of avg, since both values are historical
//TODO make this more clear, maybe allowing arrays of same Historical value
export const paginatedWindKeys: ClimateDataKeys = {
  Historical: "wind",
  Gust: "wind_gust",
};

export const annualSunshineKeys: ClimateDataKeys = {
  Avg: "sun",
};
export const paginatedSunshineKeys: ClimateDataKeys = {
  Avg: "sun",
  Historical: "sun",
};

export const annualUVIndexKeys: ClimateDataKeys = {
  Avg: "uv_index",
};
export const paginatedUVIndexKeys: ClimateDataKeys = {
  Avg: "uv_index",
  Historical: "uv_index",
};

export const annualComfortKeys: ClimateDataKeys = {
  Avg: "comfort_index",
};
export const paginatedComfortKeys: ClimateDataKeys = {
  Avg: "comfort_index",
  Historical: "comfort_index",
};

export const annualGrowingSeasonKeys: ClimateDataKeys = {
  Avg: "growing_season",
};
