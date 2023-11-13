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
  fill?: boolean | number | string;
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
    | "UV_Index";
  yAxisID_R?:
    | "Temperature"
    | "Precip"
    | "Sun_Angle"
    | "Percentage"
    | "Wind"
    | "Comfort_Index"
    | "UV_Index";
};

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
