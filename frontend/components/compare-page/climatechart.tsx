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
import { ClimateChartDataset } from "./comparepageprops";

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

export default function ClimateChart({ datasetProp }: ClimateChartProps) {
  const createChartData = () => {
    return {
      labels: [
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
        "",
      ],
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
        datalabels: {
          formatter: (value: any, context: any) => {
            const yAxisID = context.dataset.yAxisID;
            const skippedIndexes = [1, 2, 4, 5, 7, 8, 10, 11];

            if (skippedIndexes.includes(context.dataIndex)) {
              return "";
            }
            if (yAxisID === "Temperature") {
              return value.toFixed(0) + " °F";
            } else if (yAxisID === "Precip") {
              return value.toFixed(1) + " in";
            } else if (yAxisID === "Sunshine_Percentage") {
              return (value * 100).toFixed(0) + " %";
            } else if (yAxisID === "Humidity_Percentage") {
              return value.toFixed(0) + " %";
            } else if (yAxisID === "Wind") {
              return value.toFixed(0) + " mph";
            } else if (yAxisID === "Sun_Angle") {
              return value.toFixed(1) + " °";
            } else {
              return value.toFixed(0);
            }
          },
        },
      })),
    };
  };

  const chartOptions = {
    responsive: true,
    layout: {
      padding: {
        top: 20,
        right: 40,
        bottom: 20,
        left: 40,
      },
    },
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
        intersect: true, // Allow tooltips to display values even if not at the center point
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
        display: "auto",
        beginAtZero: false,
        suggestedMax: 100,
        ticks: {
          callback: function (value) {
            return value + " °F "; // Append 'units' to the tick value
          },
          maxTicksLimit: 10,

          stepSize: 10,
          font: {
            size: 12,
          },
        },
      },

      Precip: {
        type: "linear",
        position: "left",
        display: "auto",
        min: 0,
        suggestedMax: 5,
        ticks: {
          beginAtZero: true,
          callback: function (value) {
            return value + " in "; // Append 'units' to the tick value
          },
          maxTicksLimit: 10,
          stepSize: 0.2,
          font: {
            size: 10,
          },
        },
      },

      Sunshine_Percentage: {
        type: "linear",
        position: "left",
        display: "auto",
        max: 1.005,
        min: 0,
        ticks: {
          beginAtZero: true,
          callback: function (value: number) {
            return (value * 100).toFixed(0) + " % "; // Multiply by 100 and append "%"
          },
          maxTicksLimit: 10,
          stepSize: 0.1,
          font: {
            size: 10,
          },
        },
      },

      Sun_Angle: {
        type: "linear",
        position: "left",
        display: "auto",
        max: 90,
        min: 0,
        ticks: {
          beginAtZero: true,

          maxTicksLimit: 10,
          stepSize: 10,
          font: {
            size: 10,
          },
        },
      },

      Humidity_Percentage: {
        type: "linear",
        position: "left",
        display: "auto",
        max: 100,
        min: 0,
        ticks: {
          beginAtZero: true,
          callback: function (value: number) {
            return value.toFixed(0) + " % "; // Multiply by 100 and append "%"
          },
          maxTicksLimit: 10,
          stepSize: 10,
          font: {
            size: 10,
          },
        },
      },

      Wind: {
        type: "linear",
        position: "left",
        display: "auto",
        ticks: {
          beginAtZero: true,
          callback: function (value) {
            return value + " mph "; // Append 'units' to the tick value
          },
          maxTicksLimit: 10,
          stepSize: 1,
          font: {
            size: 10,
          },
        },
      },

      Comfort_Index: {
        type: "linear",
        position: "left",
        display: "auto",
        max: 100,
        min: 0,
        ticks: {
          beginAtZero: true,

          maxTicksLimit: 10,
          stepSize: 10,
          font: {
            size: 10,
          },
        },
      },
    },
  } as ChartOptions<"bar" | "line">;

  return (
    <Chart options={chartOptions} data={createChartData()} type={"line"} />
  );
}
