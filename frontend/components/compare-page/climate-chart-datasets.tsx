import { MarkerType, LocationColors } from "../location-props";
import {
  ClimateChartDataset,
  TimeGranularity,
  chartConfig,
} from "./climate-chart-helpers";

import {
  getBackgroundColor,
  convertKeyToBackgroundID,
} from "../data-value-colors";

const CHART_BORDER_WIDTH = chartConfig.chartBorderWidth;
const LINE_TENSION = chartConfig.lineTension;
const LINE_ALPHA = chartConfig.lineAlpha;
const BACKGROUND_ALPHA = chartConfig.backgroundAlpha;
const PAGINATED_BACKGROUND_ALPHA = chartConfig.paginatedBackgroundAlpha;
const SMA_SMOOTH_DAYS = chartConfig.smaSmoothDays;

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
  | "growing_season";

export type TempeartureDataKeys = {
  [key: string]: TemperatureDataKey;
};

export type ClimateDataKeys = {
  [key: string]: ClimateDataKey;
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
    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const border_width = CHART_BORDER_WIDTH;

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
            windowSize: SMA_SMOOTH_DAYS,
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
        lineTension: LINE_TENSION,
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
    return CHART_BORDER_WIDTH;
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
    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const border_width = CHART_BORDER_WIDTH;

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
          windowSize: SMA_SMOOTH_DAYS,
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

      if (!isAnnual) {
        backgroundColors = climate_data.map((dataPoint: number) =>
          getBackgroundColor(dataPoint, convertKeyToBackgroundID(dataKey))
        );
      } else {
        backgroundColors = new Array(climate_data.length).fill(
          conditionalBackgroundColor
        );
      }

      const dataset: ClimateChartDataset = {
        type: "line",
        label: location_name + " " + labelSuffix,
        data: climate_data,
        pointBackgroundColor: isAnnual
          ? conditionalBackgroundColor
          : backgroundColors,
        backgroundColor: isAnnual
          ? conditionalBackgroundColor
          : backgroundColors,

        borderColor: conditionalBorderColor,

        borderWidth: border_width,
        pointRadius: 0,
        pointHoverRadius: 0,
        lineTension: LINE_TENSION,
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

  // SMA calculation to smooth the data
  const calculateSMA = (data: number[], window_size: number) => {
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

  if (windowSize && selectedYear === "Annual") {
    return calculateSMA(rawData, windowSize);
  }

  return rawData;
};
