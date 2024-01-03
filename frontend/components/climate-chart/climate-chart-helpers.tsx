import {
  TempeartureDataKeys,
  ClimateDataKeys,
  StackedBarKeys,
} from "./climate-chart-datasets";

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

export function getNumDaysInMonths(year: string | number): number[] {
  if (typeof year === "string") {
    year = 2020;
  }
  const numDaysInMonths = [];
  for (let month = 0; month < 12; month++) {
    numDaysInMonths.push(getLastDayOfMonth(year as number, month));
  }
  return numDaysInMonths;
}

// SMA calculation to smooth the data
export const calculateSMA = (data: number[], window_size: number) => {
  let rollingAverages = [];

  // Determine how many data points should be taken before and after the current point
  let beforeAfterCount = Math.floor(window_size / 2);

  for (let i = 0; i < data.length; i++) {
    let start_index = i - beforeAfterCount;
    let end_index = i + beforeAfterCount + 1; // Include the current data point

    let validWindowData;
    if (start_index < 0 || end_index > data.length) {
      // This step will depend on how you want to handle the boundaries (e.g., repeat, use available data, etc.)
      // Here's an example of using available data:
      validWindowData = data.slice(
        Math.max(0, start_index),
        Math.min(data.length, end_index)
      );
    } else {
      validWindowData = data.slice(start_index, end_index);
    }

    let validValues = validWindowData.filter((value) => value != null);

    if (validValues.length > 0) {
      let sum = validValues.reduce((a, b) => a + b, 0);
      let avg = sum / validValues.length;
      rollingAverages.push(avg);
    } else {
      rollingAverages.push(null); // No valid values in the window
    }
  }

  return rollingAverages;
};

export function formatValueWithUnit(
  yValue: number,
  yAxisID: string,
  decimalTrunc?: 0
): string {
  let unit = "";

  switch (yAxisID) {
    case "Temperature":
    case "TemperatureTrend":
    case "Dewpoint":
      unit = "°F";
      break;

    case "Precip":
    case "PrecipTrend":
      unit = "in";
      break;

    case "Percentage":
    case "PercentageTrend":
      unit = "%";
      break;

    case "DaysTrend":
      unit = "dy";
      break;

    case "Wind":
      unit = "mph";
      break;

    // ... add other cases as needed
    default:
      unit = "";
      break;
  }

  return `${yValue.toFixed(decimalTrunc)}${unit}`;
}

export const datalabelsFormatter = (value: { y: any[] }, context: any) => {
  const dataset = context.chart.data.datasets[context.datasetIndex];
  const yAxisID = dataset.yAxisID;

  // Check if value is an array (for floating bars) and take the second value (high value) if it is
  const yValue = Array.isArray(value.y) ? "" : value.y;

  // Now ensure that yValue is a number before calling the formatting function
  if (typeof yValue === "number") {
    return formatValueWithUnit(yValue, yAxisID);
  } else {
    //console.error("yValue is not a number: FORMATTER", yValue);
    return ""; // or some default error representation
  }
};

export const tooltipLabelCallback = (context: any) => {
  const label = context.dataset.label || "";
  const yAxisID = context.dataset.yAxisID;
  const yValue = context.parsed.y;

  if (typeof yValue === "number") {
    return `${label}: ${formatValueWithUnit(yValue, yAxisID)}`;
  } else {
    //console.error("yValue is not a number: TOOLTIP", yValue);
    return `${label}: N/A`; // or some default error representation
  }
};

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
  headingVariant: "h6",
  smaSmoothDays: 30,
  lazyLoadHeight: 300,
  lazyLoadOffset: 0,
  doLazyLoadOnce: false,
};

export type ClimateChartDataset = {
  type: "line" | "bar";
  stack?: string;
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
    | "TemperatureTrend"
    | "Precip"
    | "PrecipTrend"
    | "DaysTrend"
    | "Sun_Angle"
    | "Percentage"
    | "PercentageTrend"
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

export const paginatedGrowingSeasonKeys: ClimateDataKeys = {
  Avg: "growing_season",
  Historical: "growing_season",
};

export const annualFrostChanceKeys: ClimateDataKeys = {
  Avg: "morning_frost_chance",
};

export const paginatedFrostChanceKeys: ClimateDataKeys = {
  Avg: "morning_frost_chance",
  Historical: "morning_frost_chance",
};

export const annualStackedSunKeys: StackedBarKeys = {
  Clear: "clear_days",
  Partly: "partly_cloudy_days",
  Cloudy: "cloudy_days",
};

export const paginatedStackedSunKeys: StackedBarKeys = {
  Clear: "clear_days",
  Partly: "partly_cloudy_days",
  Cloudy: "cloudy_days",
};
