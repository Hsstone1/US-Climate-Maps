import {
  Chart as ChartJS,
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
import { Chart } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { ClimateChartDataset } from "./export-props";

ChartJS.register(
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

type ClimateChartProps = {
  datasetProp: ClimateChartDataset[];
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

export default function ClimateChart({ datasetProp }: ClimateChartProps) {
  const createChartData = () => {
    return {
      labels,
      datasets: datasetProp.map((dataset) => ({
        type: dataset.type,
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth,
        pointRadius: dataset.pointRadius,
        pointHoverRadius: dataset.pointHoverRadius,
        lineTension: dataset.lineTension,
        fill: dataset.fill,
        yAxisID: dataset.yAxisID,
      })),
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        display: false,
      },
      title: {
        display: true,
        text: "Yearly Climate Averages",
      },
      filler: {
        propagate: true,
      },
      hover: {
        mode: "x",
        delay: 100, // delay 100 milliseconds
      },
      tooltip: {
        mode: "x", // Set the tooltips mode to 'index' to display values for all datasets at the same index
        intersect: false, // Allow tooltips to display values even if not at the center point
      },
      datalabels: {
        align: "bottom",
        anchor: "center",
        offset: -18,
        display: "auto",
        color: "#808080",

        font: {
          size: 10,
          weight: "bolder",
        },
        formatter: (value) => Math.round(value) + " °F", // Append '°F' to the data label value
      },
    },

    scales: {
      x: {
        ticks: {
          autoSkip: false,
          minRotation: 0,
          maxRotation: 0,
          font: {
            size: 12,
          },
        },
      },
      Temperature: {
        type: "linear",
        position: "left",
        beginAtZero: false,
        suggestedMax: 100,
        ticks: {
          callback: function (value) {
            return value + " °F"; // Append 'units' to the tick value
          },
          maxTicksLimit: 8,

          stepSize: 10,
          font: {
            size: 12,
          },
        },
      },

      /*
      
      Precip: {
        type: "linear",
        position: "left",
        ticks: {
          beginAtZero: true,
          callback: function (value) {
            return value + " in"; // Append 'units' to the tick value
          },
          maxTicksLimit: 8,
          stepSize: 0.2,
          font: {
            size: 10,
          },
        },
      },
      Percentage: {
        type: "linear",
        position: "left",
        ticks: {
          beginAtZero: true,
          callback: function (value) {
            return value + " %"; // Append 'units' to the tick value
          },
          maxTicksLimit: 8,
          stepSize: 10,
          font: {
            size: 10,
          },
        },
      },
      Wind: {
        type: "linear",
        position: "left",
        ticks: {
          beginAtZero: true,
          callback: function (value) {
            return value + " mph"; // Append 'units' to the tick value
          },
          maxTicksLimit: 8,
          stepSize: 1,
          font: {
            size: 10,
          },
        },
      },
      */
    },
  } as ChartOptions<"bar" | "line">;

  return <Chart options={chartOptions} data={createChartData()} type={"bar"} />;
}
