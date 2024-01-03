import { MarkerType, LocationColors, NUM_YEARS } from "../global-utils";
import {
  ClimateChartDataset,
  calculateSMA,
  chartConfig,
} from "../climate-chart/climate-chart-helpers";

type ClimateDataKey =
  | "high_temperature"
  | "low_temperature"
  | "precipitation"
  | "precip_days"
  | "snow"
  | "snow_days"
  | "afternoon_humidity"
  | "dewpoint"
  | "wind"
  | "wind_gust"
  | "sun"
  | "uv_index"
  | "comfort_index"
  | "gdd"
  | "growing_days"
  | "morning_frost_chance"
  | "frost_days";

export type ClimateTrendKeys = {
  [key: string]: ClimateDataKey;
};

export const createClimateTrendsDataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined | null,
  trendsData: any | undefined | null,
  yAxisID: ClimateChartDataset["yAxisID"],
  dataKeys: ClimateTrendKeys,
  multiplyByVal?: number,
  createTrendLine?: boolean,
  isPercent?: boolean
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: any, index: any) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;
    const location_name = "";
    const color = LocationColors(chartConfig.lineAlpha)[colorIndex];
    const background_color = LocationColors(chartConfig.backgroundAlpha)[
      colorIndex
    ];
    const paginated_background_color = LocationColors(
      chartConfig.paginatedBackgroundAlpha
    )[colorIndex];

    // Loop over each key in dataKeys to create datasets
    Object.entries(dataKeys).forEach(([labelSuffix, dataKey]) => {
      const climate_data = get_climate_data(
        location,
        dataKey,
        trendsData,
        isPercent || false,
        {
          multiplyByVal: multiplyByVal,
          windowSize: 1,
        }
      );

      const dataset: ClimateChartDataset = {
        type: "line",
        label: location_name + " " + labelSuffix,
        data: climate_data,
        pointBackgroundColor: background_color,
        backgroundColor: background_color,
        borderColor: paginated_background_color,
        borderWidth: chartConfig.chartBorderWidth,
        pointRadius: 1,
        pointHoverRadius: 3,
        lineTension: chartConfig.lineTension,
        fill: createTrendLine ? "+1" : false,
        yAxisID: yAxisID as ClimateChartDataset["yAxisID"],
      };
      datasets.push(dataset);

      if (createTrendLine) {
        // Assuming your data is in a format that you can derive x and y values
        const xValues = climate_data.map((_: any, i: any) => i); // If x is just indices
        const yValues = climate_data;
        const { slope, intercept } = linearRegression(xValues, yValues);
        const trendLineData = xValues.map((x: number) => slope * x + intercept);

        const trendLineDataset: ClimateChartDataset = {
          type: "line",
          label: location_name + " " + "Trend",
          data: trendLineData,
          pointBackgroundColor: color,
          backgroundColor: color,
          borderColor: color,
          borderWidth: chartConfig.chartBorderWidth,
          pointRadius: 0,
          pointHoverRadius: 0,
          lineTension: chartConfig.lineTension,
          fill: false,
          yAxisID: yAxisID as ClimateChartDataset["yAxisID"],
        };

        datasets.push(trendLineDataset);
      }
    });
  });

  return datasets;
};

const get_climate_data = (
  location: any,
  key: string,
  climateData: null | any,
  isPercent: boolean,
  options: { multiplyByVal?: number; windowSize?: number } = {}
) => {
  const { multiplyByVal = 1, windowSize } = options;

  //TODO this might crash if the key is missing, likely in expected_min and max
  let rawData;
  let annualData = location.data.climate_data[key]["annual"];
  if (climateData[location.id]) {
    rawData = climateData[location.id].climateData.climate_data[key]["annual"];
  } else {
    rawData = [];
  }
  rawData = rawData.slice(0, NUM_YEARS + 1);

  // This turns the data into the percentage change over the average annual data
  // Useful when comparing climate trends

  rawData = rawData.map((val: number) => {
    // Check if both val and annualData are zero
    if (isPercent) {
      if (val <= 1 && annualData <= 1) {
        return 100;
      } else {
        // Perform the regular calculation if they are not both zero
        return ((val * multiplyByVal) / annualData) * 100;
      }
    } else {
      return val * multiplyByVal;
    }
  });
  if (windowSize) {
    return calculateSMA(rawData, windowSize);
  }

  return rawData;
};

// Helper function to calculate the linear regression coefficients
const linearRegression = (x: any[], y: any[]) => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
  const sumXX = x.reduce((acc, val) => acc + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};
