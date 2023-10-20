import {
  Chart as InfoWindowChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  ChartOptions,
  Filler,
} from "chart.js";
import React from "react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart } from "react-chartjs-2";
import { MarkerType } from "../export-props";

InfoWindowChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  Filler,
  ChartDataLabels
);

type InfoWindowChartProps = {
  marker: MarkerType;
};

const labels = [
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

const labelUnitMapping: { [key: string]: string } = {
  "Apparent High: ": "°F",
  "Max Temperature: ": "°F",
  "Min Temperature: ": "°F",
  "Apparent Low: ": "°F",
  "Dewpoint Avg: ": "°F",
  "Precip Totals: ": "in",
};

// Define new types for Dataset and DatasetConfig
type DatasetType = "line" | "bar";

type DatasetConfig = {
  type: DatasetType;
  key: string;
  label: string;
  color: string;
  fill?: boolean | string;
  visible?: boolean;
};

export default function InfoWindowChart({ marker }: InfoWindowChartProps) {
  const mapClimateData = (key: string) =>
    marker.data.climate_data.avg_monthly.map(
      (month: { [key: string]: any }) => month[key]
    );

  // Define dataset configurations
  const datasetConfigs: DatasetConfig[] = [
    {
      type: "line",
      key: "apparent_high_temp",
      label: "Apparent High",
      color: "rgba(237, 68, 62, 0.2)",
    },
    {
      type: "line",
      key: "high_temp",
      label: "Max Temperature",
      color: "rgba(243, 105, 75, 0.7)",
    },
    {
      type: "line",
      key: "low_temp",
      label: "Min Temperature",
      color: "rgba(97, 139, 201, 0.7)",
      fill: "between",
    },
    {
      type: "line",
      key: "apparent_low_temp",
      label: "Apparent Low",
      color: "rgba(137, 182, 249, 0.3)",
    },
    {
      type: "line",
      key: "dewpoint_temp",
      label: "Dewpoint Avg",
      color: "rgba(15, 176, 0, 0.5)",
      visible: false,
    },
    // Add more configs if needed
  ];

  const createChartData = () => {
    const datasets = datasetConfigs.map(
      ({ type, key, label, color, fill, visible }) => ({
        type,
        label,
        data: mapClimateData(key),
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        lineTension: 0.6,
        fill: fill || false,
        yAxisID: "Temperature",
        ...(visible === false && { visible: false }),
      })
    );

    // Manually add unique dataset like 'Precip Totals'
    datasets.push({
      type: "bar",
      label: "Precip Totals",
      data: mapClimateData("precip_in"),
      backgroundColor: "rgba(137, 217, 249, 0.5)",
      borderColor: "rgba(137, 217, 249, 0.5)",
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
      lineTension: 0.6,
      yAxisID: "Precip",
      fill: false,
    });

    return {
      labels,
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "chartArea" as const,
        display: false,
      },
      title: {
        display: false,
        text: "Yearly Climate Averages",
      },
      filler: {
        propagate: true,
      },
      hover: {
        //mode: "x",
        delay: 100, // delay 100 milliseconds
      },
      tooltip: {
        mode: "nearest",
        axis: "x",
        intersect: false,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";

            if (label) {
              label += ": ";
            }

            if (context.parsed.y !== null) {
              const unit = labelUnitMapping[label] || ""; // Retrieve the unit based on the label
              let value: number = context.parsed.y; // Ensure the value is typed as number

              // Check if the label corresponds to a temperature value
              if (label.includes("Precip")) {
                value = parseFloat(value.toFixed(1)); // Round temperature to 0 decimal places
              } else {
                value = parseFloat(value.toFixed(0)); // Round precipitation to 1 decimal place
              }

              label += value + " " + unit;
            }

            return label;
          },
        },
      },

      datalabels: {
        display: false,
      },
    },

    scales: {
      x: {
        ticks: {
          autoSkip: false,
          minRotation: 0,
          maxRotation: 0,
          font: {
            size: 8,
          },
        },
      },
      Temperature: {
        type: "linear",
        position: "left",
        ticks: {
          callback: function (value) {
            return value + " °F"; // Append 'units' to the tick value
          },
          maxTicksLimit: 8,
          stepSize: 10,
          font: {
            size: 10,
          },
        },
      },
      Precip: {
        type: "linear",
        position: "right",
        ticks: {
          beginAtZero: true,
          callback: function (value) {
            return value + " in"; // Append 'units' to the tick value
          },
          maxTicksLimit: 8,
          stepSize: 0.5,
          font: {
            size: 10,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  } as ChartOptions<"bar" | "line">;

  return (
    <Chart
      key={marker.id}
      width={300}
      height={200}
      options={chartOptions}
      data={createChartData()}
      type={"bar"}
    />
  );
}
