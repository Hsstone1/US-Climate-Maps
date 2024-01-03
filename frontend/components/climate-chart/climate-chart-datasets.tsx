import { MarkerType, LocationColors } from "../global-utils";
import {
  ClimateChartDataset,
  TimeGranularity,
  calculateSMA,
  chartConfig,
  getNumDaysInMonths,
} from "./climate-chart-helpers";

import {
  getBackgroundColor,
  convertKeyToBackgroundID,
} from "../data-value-colors";

type TemperatureDataKey =
  | "expected_max"
  | "high_temperature"
  | "low_temperature"
  | "expected_min"
  | "apparent_expected_max"
  | "apparent_high_temperature"
  | "apparent_low_temperature"
  | "apparent_expected_min"
  | "expected_max_dewpoint"
  | "expected_min_dewpoint";

type ClimateDataKey =
  | "precipitation"
  | "snow"
  | "afternoon_humidity"
  | "dewpoint"
  | "expected_min_dewpoint"
  | "expected_max_dewpoint"
  | "wind"
  | "wind_gust"
  | "sun"
  | "uv_index"
  | "comfort_index"
  | "growing_season"
  | "morning_frost_chance";

type StackedBarKey =
  | "clear_days"
  | "partly_cloudy_days"
  | "cloudy_days"
  | "dewpoint_dry_days"
  | "dewpoint_low_days"
  | "dewpoint_humid_days"
  | "dewpoint_muggy_days"
  | "dewpoint_oppressive_days";

export type TempeartureDataKeys = {
  [key: string]: TemperatureDataKey;
};

export type ClimateDataKeys = {
  [key: string]: ClimateDataKey;
};

export type StackedBarKeys = {
  [key: string]: StackedBarKey;
};

export const createTemperatureDataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined | null,
  selectedYear: string,
  yearlyData: any | undefined | null,
  isBarChart: boolean,
  dataKeys: TempeartureDataKeys
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] | any = [];

  locations.forEach((location: any, index: any) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;
    const isAnnual = selectedYear === "Annual";
    const location_name = "";
    const color = LocationColors(chartConfig.lineAlpha)[colorIndex];
    const background_color = LocationColors(chartConfig.backgroundAlpha)[
      colorIndex
    ];
    const paginated_background_color = LocationColors(
      chartConfig.paginatedBackgroundAlpha
    )[colorIndex];
    const border_width = chartConfig.chartBorderWidth;

    // Loop over each key in dataKeys to create datasets
    Object.entries(dataKeys).forEach(([labelSuffix, dataKey]) => {
      const dataset = {
        type:
          isBarChart && labelSuffix !== "Max" && labelSuffix !== "Min"
            ? "bar"
            : "line",
        label: location_name + " " + labelSuffix,
        data: get_climate_data(
          location,
          dataKey,
          "daily",
          labelSuffix === "Max" || labelSuffix === "Min"
            ? "Annual"
            : selectedYear,
          labelSuffix === "Max" || labelSuffix === "Min" ? null : yearlyData,
          {
            multiplyByVal: 1,
            windowSize: chartConfig.smaSmoothDays,
          }
        ),
        backgroundColor:
          labelSuffix === "Max" || labelSuffix === "Min"
            ? background_color
            : isAnnual
            ? background_color
            : paginated_background_color,
        borderColor: color,
        borderWidth: temperatureBorderWidth(labelSuffix, isAnnual),
        pointRadius: 0,
        pointHoverRadius: 0,
        lineTension: chartConfig.lineTension,
        fill: temperatureFillOption(labelSuffix, isBarChart),
        yAxisID: "Temperature",
      };
      datasets.push(dataset);
    });
  });

  return datasets;
};

const temperatureBorderWidth = (labelSuffix: string, isAnnual: boolean) => {
  if (labelSuffix === "Max" || labelSuffix === "Min") {
    return 0;
  } else if ((labelSuffix === "High" || labelSuffix === "Low") && !isAnnual) {
    return 0;
  } else {
    return chartConfig.chartBorderWidth;
  }
};

// Helper function to determine the fill option based on the label suffix and chart type
const temperatureFillOption = (labelSuffix: string, isBarChart: any) => {
  if (isBarChart) {
    return labelSuffix === "Low" || labelSuffix === "Min" ? "-1" : "+1";
  }
  return labelSuffix === "Low" || labelSuffix === "Min" ? "-2" : "+2";
};

// This function creates the datasets for the climate chart
// This is separate from the above temperature function, since the temperature functions take in 4 datasets
// This function returns an array of datasets

// The datasets are created by looping over each location and each data key
// The data key is used to get the climate data for the location

export const createClimateDataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined | null,
  selectedYear: string,
  yearlyData: any | undefined | null,
  multiplyByVal: {
    avgMultiplyByVal?: number;
    historicalMultiplyByVal?: number;
  },
  yAxisID: ClimateChartDataset["yAxisID"],
  dataKeys: ClimateDataKeys
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  const { avgMultiplyByVal = 1, historicalMultiplyByVal = 1 } = multiplyByVal;

  locations.forEach((location: any, index: any) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;
    const isAnnual = selectedYear === "Annual";
    const location_name = "";
    const color = LocationColors(chartConfig.lineAlpha)[colorIndex];
    const background_color = LocationColors(chartConfig.backgroundAlpha)[
      colorIndex
    ];
    const paginated_background_color = LocationColors(
      chartConfig.paginatedBackgroundAlpha
    )[colorIndex];
    const border_width = chartConfig.chartBorderWidth;

    // Loop over each key in dataKeys to create datasets
    Object.entries(dataKeys).forEach(([labelSuffix, dataKey]) => {
      const climate_data = get_climate_data(
        location,
        dataKey,
        "daily",
        labelSuffix === "Avg" ? "Annual" : selectedYear,
        labelSuffix === "Avg" ? null : yearlyData,
        {
          multiplyByVal:
            labelSuffix === "Avg" ? avgMultiplyByVal : historicalMultiplyByVal,
          windowSize: chartConfig.smaSmoothDays,
        }
      );
      let backgroundColors;
      const conditionalBackgroundColor =
        labelSuffix === "Avg" ||
        labelSuffix === "Gust" ||
        labelSuffix === "High" ||
        labelSuffix === "Low"
          ? background_color
          : paginated_background_color;

      const conditionalBorderColor =
        labelSuffix === "Avg" || labelSuffix === "High" || labelSuffix === "Low"
          ? color
          : background_color;

      //if (!isAnnual) {
      backgroundColors = climate_data.map((dataPoint: number) =>
        getBackgroundColor(dataPoint, convertKeyToBackgroundID(dataKey))
      );
      // } else {
      //   backgroundColors = new Array(climate_data.length).fill(
      //     conditionalBackgroundColor
      //   );
      // }

      const dataset: ClimateChartDataset = {
        type: "line",
        label: location_name + " " + labelSuffix,
        data: climate_data,
        pointBackgroundColor: backgroundColors,
        backgroundColor: backgroundColors,

        borderColor: conditionalBorderColor,

        borderWidth:
          labelSuffix !== "Avg" &&
          labelSuffix !== "High" &&
          labelSuffix !== "Low"
            ? border_width
            : 0.1,
        pointRadius:
          labelSuffix !== "Avg" &&
          labelSuffix !== "High" &&
          labelSuffix !== "Low"
            ? 0
            : 1,
        pointHoverRadius: 0,
        lineTension: chartConfig.lineTension,
        fill: climateFillOption(
          labelSuffix,
          isAnnual,
          isAnnual ? conditionalBackgroundColor : background_color,
          isAnnual ? conditionalBackgroundColor : paginated_background_color
        ),
        yAxisID: yAxisID as ClimateChartDataset["yAxisID"],
      };
      datasets.push(dataset);
    });
  });

  return datasets;
};

const climateFillOption = (
  labelSuffix: string,
  isAnnual: boolean,
  background_color: any,
  paginated_background_color: any
) => {
  if (labelSuffix === "Avg" && isAnnual) {
    return {
      target: "start", // Fills towards the end of the scale
      above: background_color, // Color above the data line
      below: background_color, // Color below the data line
    };
  } else if (labelSuffix !== "Avg" && !isAnnual) {
    return {
      target: "start", // Fills towards the end of the scale
      above: paginated_background_color, // Color above the data line
      below: paginated_background_color, // Color below the data line
    };
  } else if ((labelSuffix === "High" || labelSuffix === "Low") && isAnnual) {
    return {
      target: labelSuffix === "High" ? "+1" : "-1", // Fills towards each dataset
      above: background_color, // Color above the data line
      below: background_color, // Color below the data line
    };
  }
};

export const createStackedBarDataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined | null,
  selectedYear: string,
  yearlyData: any | undefined | null,
  multiplyByVal: {
    avgMultiplyByVal?: number;
    historicalMultiplyByVal?: number;
  },
  yAxisID: ClimateChartDataset["yAxisID"],
  dataKeys: StackedBarKeys,
  timeGranularity: TimeGranularity
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  const { avgMultiplyByVal = 1, historicalMultiplyByVal = 1 } = multiplyByVal;

  locations.forEach((location: any, index: any) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;
    const isAnnual = selectedYear === "Annual";
    const location_name = "";
    const color = LocationColors(chartConfig.lineAlpha)[colorIndex];
    const background_color = LocationColors(chartConfig.backgroundAlpha)[
      colorIndex
    ];
    const paginated_background_color = LocationColors(
      chartConfig.paginatedBackgroundAlpha
    )[colorIndex];
    const border_width = chartConfig.chartBorderWidth;

    // Loop over each key in dataKeys to create datasets
    Object.entries(dataKeys).forEach(([labelSuffix, dataKey]) => {
      const climate_data = get_climate_data_stacked(
        location,
        dataKey,
        timeGranularity,
        selectedYear,
        yearlyData,
        getNumDaysInMonths(selectedYear)
      );

      const dataset: ClimateChartDataset = {
        type: "bar",
        stack: `locationStack-${location.id}`,
        label: location_name + " " + labelSuffix,
        data: climate_data,
        backgroundColor: getStackBackgroundColor(dataKey),
        borderColor: getStackBackgroundColor(dataKey),
        borderWidth: border_width,
        pointRadius: 0,
        pointHoverRadius: 0,
        lineTension: chartConfig.lineTension,
        fill: false,
        yAxisID: yAxisID as ClimateChartDataset["yAxisID"],
      };
      datasets.push(dataset);
    });
  });

  return datasets;
};

const getStackBackgroundColor = (key: any) => {
  switch (key) {
    case "clear_days":
      return "#29b0ff";
    case "partly_cloudy_days":
      return "#96d8ff";
    case "cloudy_days":
      return "#949494";
    case "dewpoint_dry_days":
      return "#00FFFF";
    case "dewpoint_low_days":
      return "#00BFFF";
    case "dewpoint_humid_days":
      return "#0000FF";
    case "dewpoint_muggy_days":
      return "#000080";
    case "dewpoint_oppressive_days":
      return "#000000";
    default:
      return "#000000";
  }
};

const get_climate_data = (
  location: any,
  key: string,
  time_granularity: TimeGranularity,
  selectedYear: "Annual" | string,
  yearlyData: null | any,
  options: { multiplyByVal?: number; windowSize?: number } = {}
) => {
  const { multiplyByVal = 1, windowSize } = options;

  //TODO this might crash if the key is missing, likely in expected_min and max
  let rawData;
  if (selectedYear !== "Annual" && yearlyData?.[location.id]?.[selectedYear]) {
    rawData =
      yearlyData[location.id][selectedYear].climate_data[key][time_granularity];
  } else {
    rawData = location.data.climate_data[key][time_granularity];
  }
  rawData = rawData.map((val: number) => val * multiplyByVal);

  if (windowSize && selectedYear === "Annual") {
    return calculateSMA(rawData, windowSize);
  }

  return rawData;
};

const get_climate_data_stacked = (
  location: any,
  key: string,
  time_granularity: TimeGranularity,
  selectedYear: "Annual" | string,
  yearlyData: null | any,
  multipliers: number[] = []
) => {
  //TODO this might crash if the key is missing, likely in expected_min and max
  let rawData;
  if (selectedYear !== "Annual" && yearlyData?.[location.id]?.[selectedYear]) {
    rawData =
      yearlyData[location.id][selectedYear].climate_data[key][time_granularity];
  } else {
    rawData = location.data.climate_data[key][time_granularity];
  }

  const convertedData = rawData.map((value: number, index: number) => {
    const totalDays = multipliers[index] || 1; // Default to 1 if no multiplier provided
    return totalDays > 0 ? (value / totalDays) * 100 : 0; // Convert to percentage
  });

  return convertedData;
};
