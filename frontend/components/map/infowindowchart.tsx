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

export default function IndowWindowChart({ marker }: InfoWindowChartProps) {
  const createChartData = (marker: MarkerType) => {
    return {
      labels,
      datasets: [
        {
          type: "line" as const,
          label: "Apparent High",
          data: marker.data.monthly_data.monthly_apparent_high,
          backgroundColor: "rgba(237, 68, 62, 0.2)",
          borderColor: "rgba(237, 68, 62, 0.2)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          lineTension: 0.6,
          fill: false,
          yAxisID: "Temperature",
        },
        {
          type: "line" as const,
          label: "Max Temperature",
          data: marker.data.monthly_data.monthly_high_avg,
          backgroundColor: "rgba(243, 105, 75, 0.7)",
          borderColor: "rgba(243, 105, 75, 0.7)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          lineTension: 0.6,
          fill: false,

          yAxisID: "Temperature",
        },

        {
          type: "line" as const,
          label: "Min Temperature",
          data: marker.data.monthly_data.monthly_low_avg,
          backgroundColor: "rgba(97, 139, 201, 0.7)",
          borderColor: "rgba(97, 139, 201, 0.7)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          lineTension: 0.6,
          fill: "between",
          yAxisID: "Temperature",
        },
        {
          type: "line" as const,
          label: "Apparent Low",
          data: marker.data.monthly_data.monthly_apparent_low,
          backgroundColor: "rgba(137, 182, 249, 0.3)",
          borderColor: "rgba(137, 182, 249, 0.3)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          lineTension: 0.6,
          fill: false,
          yAxisID: "Temperature",
        },

        {
          type: "line" as const,
          label: "Dewpoint Avg",
          data: marker.data.monthly_data.monthly_dewpoint_avg,
          backgroundColor: "rgba(15, 176, 0, 0.5)",
          borderColor: "rgba(15, 176, 0, 0.5)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          lineTension: 0.6,
          fill: false,
          visible: false,
          yAxisID: "Temperature",
        },
        {
          type: "bar" as const,
          label: "Precip Totals",
          data: marker.data.monthly_data.monthly_precip_avg,
          backgroundColor: "rgba(137, 217, 249, 0.5)",
          borderColor: "rgba(137, 217, 249, 0.5)",
          yAxisID: "Precip",
        },
        // Add more datasets for other climate information (e.g., precipitation, humidity)
      ],
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
              label += context.parsed.y.toFixed(1) + " " + unit;
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
      data={createChartData(marker)}
      type={"bar"}
    />
  );
}
