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
