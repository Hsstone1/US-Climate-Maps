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
  backgroundAlpha: 0.05,
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
