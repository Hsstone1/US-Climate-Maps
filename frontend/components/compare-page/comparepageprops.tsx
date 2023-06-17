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
  "monthly_high_avg",
  "monthly_low_avg",
  "monthly_mean_avg",
  "monthly_mean_maximum",
  "monthly_record_high",
  "monthly_mean_minimum",
  "monthly_record_low",
  "monthly_HDD_avg",
  "monthly_CDD_avg",
  "monthly_precip_avg",
  "monthly_precip_days_avg",
  "monthly_snow_days_avg",
  "monthly_frost_free_days_avg",
  "monthly_dewpoint_avg",
  "monthly_humidity_avg",
  "monthly_wind_avg",
  "monthly_wind_gust_avg",
  "monthly_sunshine_avg",
  "monthly_sunshine_days_avg",
  "monthly_wind_dir_avg",
];

export const AnnualDataStr = [
  "annual_high_avg",
  "annual_low_avg",
  "annual_mean_avg",
  "annual_mean_maximum",
  "annual_record_high",
  "annual_mean_minimum",
  "annual_record_low",
  "annual_HDD_avg",
  "annual_CDD_avg",
  "annual_precip_avg",
  "annual_snow_avg",
  "annual_precip_days_avg",
  "annual_snow_days_avg",
  "annual_frost_free_days_avg",
  "annual_dewpoint_avg",
  "annual_humidity_avg",
  "annual_wind_avg",
  "annual_wind_gust_avg",
  "annual_sunshine_avg",
  "annual_wind_dir_avg",
];
