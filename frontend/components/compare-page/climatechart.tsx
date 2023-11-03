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
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { Chart } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { ClimateChartDataset } from "./comparepageprops";
import zoomPlugin from "chartjs-plugin-zoom";
import { useZoom } from "./zoomcontext";

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
  ChartDataLabels,
  zoomPlugin
);

type ClimateChartProps = {
  datasetProp: ClimateChartDataset[];
  units?: string;
  adjustUnitsByVal?: number;
  isLeapYear?: boolean;
};

// Define month names
const MONTHS = [
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

function ClimateChart({
  datasetProp,
  units = "",
  adjustUnitsByVal = 1,
  isLeapYear = false,
}: ClimateChartProps) {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  /*
  const { zoomLevel, setZoomLevel } = useZoom();
  useEffect(() => {
    const chartInstance = chartRef.current;
    if (zoomLevel && chartInstance) {
      const xScale = chartInstance.scales.x;
      xScale.min = zoomLevel.xMin;
      xScale.max = zoomLevel.xMax;
      chartInstance.update();
    }
  }, [zoomLevel]);
  const handleZoom = useCallback(
    ({ chart }: { chart: any }) => {
      if (chart && chart.scales) {
        const xScale = chart.scales.x;
        if (xScale) {
          const currentZoomState = {
            xMin: xScale.min,
            xMax: xScale.max,
          };
          setZoomLevel(currentZoomState);
        }
      }
    },
    [setZoomLevel]
  );
  */

  // This function generates labels with month names at the correct indices
  const generateMonthLabels = useCallback(() => {
    // Days in months (non-leap year by default)
    const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Adjust for leap year
    if (isLeapYear) {
      daysInMonths[1] = 29; // February
    }

    // Generate labels
    const labels = new Array(isLeapYear ? 366 : 365).fill("");
    let dayCounter = 0;

    for (let i = 0; i < daysInMonths.length; i++) {
      labels[dayCounter] = MONTHS[i]; // Set the month label
      dayCounter += daysInMonths[i]; // Move to the next month position
    }

    return labels;
  }, [isLeapYear]);

  //This function generates labels with day and month names at the correct indices
  const generateDateLabels = useCallback(() => {
    const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (isLeapYear) {
      daysInMonths[1] = 29; // February in leap year
    }

    const dateLabels = [];
    let totalDays = 0;

    for (let month = 0; month < daysInMonths.length; month++) {
      for (let day = 1; day <= daysInMonths[month]; day++) {
        dateLabels.push({ day, month: month + 1, totalDays });
        totalDays++;
      }
    }

    return dateLabels;
  }, [isLeapYear]);

  const createChartData = useCallback(() => {
    return {
      labels: generateMonthLabels(),
      datasets: datasetProp.map((dataset) => ({
        type: dataset.type,
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth,
        borderDash: dataset.borderDash,
        pointRadius: dataset.pointRadius,
        pointHoverRadius: dataset.pointHoverRadius,
        lineTension: dataset.lineTension,
        fill: dataset.fill,
        yAxisID: dataset.yAxisID,
        datalabels: {
          formatter: (value: any, context: any) => {
            const yAxisID = context.dataset.yAxisID;

            //TODO error when removing the last location when select year is active for datasets that do not
            //Have data for select years, so for example, the Sun angle dataset does not have data for select years
            if (!dataset.data || dataset.data.length === 0) {
              return ""; // Return empty string or any other placeholder if the data doesn't exist
            }

            if (yAxisID === "Temperature") {
              return value.toFixed(0) + "°F";
            } else if (yAxisID === "Precip" && value !== 0) {
              return value.toFixed(1) + "in";
            } else if (yAxisID === "Percentage" && value !== 0 && value !== 1) {
              return value.toFixed(0) + "%";
            } else if (yAxisID === "Wind") {
              return value.toFixed(0) + " mph";
            } else if (yAxisID === "Sun_Angle") {
              return value.toFixed(1) + "°";
            } else if (value !== 1 && value !== 0) {
              return value.toFixed(0);
            } else {
              return "";
            }
          },
        },
      })),
    };
  }, [datasetProp, generateMonthLabels]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      layout: {
        padding: {
          top: 20,
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

        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: {
              enabled: true,
              speed: 0.3,
            },
            pinch: {
              enabled: true,
            },
            mode: "x",
          },
        },

        tooltip: {
          mode: "nearest",
          axis: "x",
          intersect: false,
          callbacks: {
            title: function (context) {
              // Get the first tooltip item assuming there is one dataset, otherwise, might need to choose the appropriate one
              const tooltipItem = context.length ? context[0] : null;

              if (tooltipItem) {
                const dateLabels = generateDateLabels();
                const date = dateLabels[tooltipItem.dataIndex];

                // Return the string to be displayed at the top of the tooltip
                return `${MONTHS[date.month - 1]} ${date.day}`;
              }

              return "";
            },

            label: (context) => {
              let label = context.dataset.label || "";

              if (label) {
                label += ": ";
              }

              if (context.parsed.y !== null) {
                label +=
                  (context.parsed.y * adjustUnitsByVal).toFixed(1) +
                  " " +
                  units;
              }

              return label;
            },
          },
        },

        datalabels: {
          align: "bottom",
          anchor: "center",
          offset: -25,
          display: "auto",
          color: "#808080",

          padding: {
            top: 10,
            right: 20,
            bottom: 10,
            left: 20,
          },
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
            maxTicksLimit: 12,
            minRotation: 0,
            maxRotation: 0,
            font: {
              size: 10,
            },
          },
        },
        Temperature: {
          type: "linear",
          position: "left",
          display: "auto",
          beginAtZero: false,
          suggestedMax: 100,
          suggestedMin: 0,
          ticks: {
            callback: function (value) {
              return value + "F";
            },
            maxTicksLimit: 10,

            stepSize: 10,
            font: {
              size: 10,
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
              return value + "in";
            },
            maxTicksLimit: 10,
            stepSize: 1,
            font: {
              size: 10,
            },
          },
        },

        Percentage: {
          type: "linear",
          position: "left",
          display: "auto",
          max: 100,
          min: 0,
          ticks: {
            beginAtZero: true,
            callback: function (value: number) {
              return value.toFixed(0) + "%"; // Multiply by 100 and append "%"
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
          min: 0,
          suggestedMax: 10,
          ticks: {
            beginAtZero: true,
            callback: function (value) {
              return value + "mph";
            },
            maxTicksLimit: 10,

            stepSize: 1,
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

        UV_Index: {
          type: "linear",
          position: "left",
          display: "auto",
          suggestedMax: 10,
          min: 0,
          ticks: {
            beginAtZero: true,

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
    }),
    [generateDateLabels, adjustUnitsByVal, units]
  ) as ChartOptions<"bar" | "line">;

  const memoizedChartData = useMemo(() => createChartData(), [createChartData]);

  return (
    <Chart
      ref={chartRef}
      options={chartOptions}
      data={memoizedChartData}
      type={"line"}
    />
  );
}

export default React.memo(ClimateChart);
