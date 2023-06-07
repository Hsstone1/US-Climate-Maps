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

export const MonthlyDataStr = [
  "weighted_monthly_high_avg",
  "weighted_monthly_low_avg",
  "weighted_monthly_mean_avg",
  "weighted_monthly_mean_maximum",
  "weighted_monthly_record_high",
  "weighted_monthly_mean_minimum",
  "weighted_monthly_record_low",
  "weighted_monthly_HDD_avg",
  "weighted_monthly_CDD_avg",
  "weighted_monthly_precip_avg",
  "weighted_monthly_precip_days_avg",
  "weighted_monthly_snow_days_avg",
  "weighted_monthly_frost_free_days_avg",
  "weighted_monthly_dewpoint_avg",
  "weighted_monthly_humidity_avg",
  "weighted_monthly_wind_avg",
  "weighted_monthly_wind_gust_avg",
  "weighted_monthly_sunshine_avg",
  "weighted_monthly_sunshine_days_avg",
  "weighted_monthly_wind_dir_avg",
];

export const AnnualDataStr = [
  "weighted_annual_high_avg",
  "weighted_annual_low_avg",
  "weighted_annual_mean_avg",
  "weighted_annual_mean_maximum",
  "weighted_annual_record_high",
  "weighted_annual_mean_minimum",
  "weighted_annual_record_low",
  "weighted_annual_HDD_avg",
  "weighted_annual_CDD_avg",
  "weighted_annual_precip_avg",
  "weighted_annual_snow_avg",
  "weighted_annual_precip_days_avg",
  "weighted_annual_snow_days_avg",
  "weighted_annual_frost_free_days_avg",
  "weighted_annual_dewpoint_avg",
  "weighted_annual_humidity_avg",
  "weighted_annual_wind_avg",
  "weighted_annual_wind_gust_avg",
  "weighted_annual_sunshine_avg",
  "weighted_annual_wind_dir_avg",
];
