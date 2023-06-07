export type MarkerType = {
  id: string;
  lat: number;
  lng: number;
  data: any;
};

export type ClimateChartDataset = {
  type: "line" | "bar";
  label: string; //Location Name
  data: any;
  backgroundColor?: string; //rgba(N, N, N, 0.N)
  borderColor: string; //rgba(N, N, N, 0.N)
  borderWidth?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  lineTension?: number;
  fill?: boolean;
  yAxisID:
    | "Temperature"
    | "Precip"
    | "Sunshine_Percentage"
    | "Humidity_Percentage"
    | "Wind";
};

export const Colors = (alpha: number): string[] => [
  `rgba(255, 0, 0, ${alpha})`,
  `rgba(0, 255, 0, ${alpha})`,
  `rgba(0, 0, 255, ${alpha})`,
  `rgba(252, 186, 3, ${alpha})`,
  `rgba(255, 0, 255, ${alpha})`,
  `rgba(0, 255, 255, ${alpha})`,
  `rgba(123, 45, 67, ${alpha})`,
  `rgba(89, 234, 78, ${alpha})`,
  `rgba(12, 56, 178, ${alpha})`,
  `rgba(201, 89, 145, ${alpha})`,
];
