import React, { useRef, useMemo, useCallback, useEffect } from "react";
import { ChartData, Chart as ChartJS, registerables } from "chart.js";
import { Chart } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  ClimateChartDataset,
  MonthLabels,
  datalabelsFormatter,
  dayOfYearToDate,
  formatValueWithUnit,
  tooltipLabelCallback,
} from "./climate-chart-helpers";
import { TitleColor } from "../data-value-colors";
import { MIN_YEAR } from "../global-utils";

ChartJS.register(...registerables, ChartDataLabels);

// Define the prop types for your component
type ClimateChartProps = {
  datasetProp: ClimateChartDataset[];
  units?: string;
  adjustUnitsByVal?: number;
  title?: string;
  year?: number;
  X_RANGE_MIN?: number;
  X_RANGE_MAX?: number;
  dataType?: "YEARLY" | "MONTHLY" | "DAILY";
  displayLegend?: boolean;
  isStacked?: boolean;
};

function StackedBarChart({
  datasetProp,
  title = "",
  year = 2000,
  X_RANGE_MIN = 0,
  X_RANGE_MAX = 11,
  dataType = "MONTHLY",
  displayLegend = false,
  isStacked = false,
}: ClimateChartProps) {
  const stackedBarDatasets = useMemo(() => {
    const numberOfLocations = datasetProp.length;
    const categoryPercentage =
      numberOfLocations > 0 ? 1 / numberOfLocations : 1;
    const barPercentage = 0.95; // Adjust this as needed for bar thickness

    return datasetProp.map((dataset, index) => {
      // Ensure each dataset is part of the same stack
      return {
        ...dataset,
        type: "bar" as const,
        categoryPercentage,
        barPercentage,
      };
    });
  }, [datasetProp]);

  // Define scale settings as functions or constants for reusability and clarity
  const xAxisOptions = {
    type: "linear",
    offset: false,
    min: X_RANGE_MIN,
    max: X_RANGE_MAX,
    stacked: isStacked,

    ticks: {
      callback: function (value: number) {
        // This displays the years as the x axis index, rather than the date
        // Used in the climate trends component
        if (dataType === "YEARLY") {
          return (MIN_YEAR + value).toFixed(0);
        } else if (dataType === "MONTHLY") {
          return MonthLabels[value];
        } else {
          return dayOfYearToDate(value, year);
        }
      },
      autoSkip: true,
      maxTicksLimit: 30,
      minRotation: 0,
      maxRotation: 0,
      font: {
        size: 10,
      },
    },
  };

  const yAxisOptions = (
    axisId: string,
    unit: string,
    suggested_max: number,
    suggested_min: number = 0,
    stepsize: number = 10,
    max?: number
  ) => ({
    type: "linear",
    offset: false,
    position: "left",
    id: axisId,
    display: "auto",
    beginAtZero: false,
    suggestedMin: suggested_min,
    suggestedMax: suggested_max,
    max: max,
    stacked: isStacked,
    ticks: {
      callback: function (value: any) {
        return `${value}${unit}`;
      },
      maxTicksLimit: 12,
      stepSize: stepsize,
      font: {
        size: 10,
      },
    },
  });

  const tooltipCallbacks: any = {
    title: function (context: { label: any }[]) {
      const xAxisIndex = parseInt(context[0].label);

      if (dataType === "YEARLY") {
        // Calculate the year based on the index and return it
        return (MIN_YEAR + xAxisIndex).toFixed(0);
      } else if (dataType === "MONTHLY") {
        return MonthLabels[xAxisIndex];
      } else {
        // If the datatype is not 'YEARLY', use the original callback
        return dayOfYearToDate(xAxisIndex, year);
      }
    },
    label: tooltipLabelCallback,
  };

  // Combine them into your main chart options
  const chartOptions: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 16 / 9,

      plugins: {
        legend: {
          position: "bottom",
          display: displayLegend,
          paddingTop: "0",
          paddingBottom: "0",
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 20,
          },
          color: TitleColor,
        },

        filler: {
          propagate: true,
        },

        tooltip: {
          mode: "nearest",
          axis: "x",
          intersect: false,
          callbacks: tooltipCallbacks,
        },

        datalabels: {
          align: "end",
          offset: -20,

          color: "#808080",
          padding: {
            top: 20,
            right: 30,
            bottom: 20,
            left: 30,
          },
          font: {
            size: 10,
            style: "oblique",
            family: "Arial",
          },

          display: "auto",

          formatter: datalabelsFormatter,
        },
      },
      scales: {
        x: xAxisOptions,
        Percentage: yAxisOptions("Percentage", "%", 100, 0, 10, 100),
      },

      animation: {
        duration: 250,
        easing: "linear",
      },
    }),
    [title, xAxisOptions, yAxisOptions, tooltipCallbacks, datalabelsFormatter]
  );

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
  ]; // Example labels
  const data = {
    labels: labels,
    datasets: stackedBarDatasets,
  };

  console.log("StackedBarChart", data);

  return (
    <div className="chart-container">
      <Chart
        options={chartOptions}
        data={data}
        type="bar"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}

export default React.memo(StackedBarChart);
