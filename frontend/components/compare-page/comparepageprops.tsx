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
  yAxisID:
    | "Temperature"
    | "Precip"
    | "Sunshine_Percentage"
    | "Sun_Angle"
    | "Humidity_Percentage"
    | "Wind"
    | "Comfort_Index";
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
