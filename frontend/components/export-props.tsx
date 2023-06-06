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
  yAxisID: string; //"Temperature" | "Precip" | "Percentage" | "Wind";
};
