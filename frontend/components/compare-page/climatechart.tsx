import React, { useRef, useMemo } from "react";
import {
  ChartData,
  ChartDataset,
  Chart as ChartJS,
  ChartOptions,
  registerables,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-moment";
import ChartDataLabels from "chartjs-plugin-datalabels";
import moment from "moment";
import { ClimateChartDataset } from "./climatecomparehelpers";
import { TooltipCallbacks } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

ChartJS.register(...registerables, ChartDataLabels, zoomPlugin);

// Define the prop types for your component
type ClimateChartProps = {
  datasetProp: ClimateChartDataset[];
  units?: string;
  adjustUnitsByVal?: number;
  isLeapYear?: boolean;
  isBarChart?: boolean;
};

function formatValueWithUnit(
  yValue: number,
  yAxisID: string,
  decimalTrunc?: 0
): string {
  let unit = "";

  switch (yAxisID) {
    case "Temperature":
      unit = "°F";
      break;
    case "Precip":
      unit = "in";
      break;
    case "Sun_Angle":
      unit = "°";
      break;
    case "Percentage":
      unit = "%";
      break;
    case "Wind":
      unit = "mph";
      break;

    // ... add other cases as needed
    default:
      unit = "";
      break;
  }

  return `${yValue.toFixed(decimalTrunc)}${unit}`;
}

function ClimateChart({
  datasetProp,
  units = "",
  adjustUnitsByVal = 1,
  isLeapYear = false,
  isBarChart = false,
}: ClimateChartProps) {
  const chartRef = useRef(null);

  // Function to convert day index to date string
  const dayOfYearToDate = (dayIndex: number, isLeapYear: boolean): string => {
    const year = isLeapYear ? 2020 : 2021;
    return new Date(year, 0, dayIndex + 1).toISOString().split("T")[0];
  };

  // Transform datasets for line chart
  const transformLineDatasets = (
    datasets: ClimateChartDataset[]
  ): ChartDataset<"line">[] => {
    return datasets.map((dataset) => ({
      ...dataset,
      data: dataset.data.map((value: any, index: number) => ({
        x: dayOfYearToDate(index, isLeapYear),
        y: value,
      })),
      type: "line", // set type to 'line' explicitly
    }));
  };

  // Transform datasets for bar chart
  const transformBarDatasets = (
    datasets: ClimateChartDataset[]
  ): ChartDataset<"bar", any>[] => {
    // Assuming datasets[0] contains the high values and datasets[1] contains the low values
    const [highDataset, lowDataset] = datasets;
    const barChartData = highDataset.data.map(
      (highValue: any, index: number) => ({
        x: dayOfYearToDate(index, isLeapYear),
        y: [lowDataset.data[index], highValue], // Create a floating bar
      })
    );

    return [
      {
        ...highDataset, // Use properties from highDataset for the bar chart
        data: barChartData,
        type: "bar",
        borderSkipped: false,
        categoryPercentage: 0.9,
        barPercentage: 0.9,
      },
    ];
  };

  // Determine the datasets based on the chart type
  const datasets = isBarChart
    ? transformBarDatasets(datasetProp)
    : transformLineDatasets(datasetProp);

  // Create the chart data
  const chartData: ChartData<"bar" | "line"> = useMemo(
    () => ({
      datasets, // datasets is now correctly typed
    }),
    [datasets]
  );

  // Define scale settings as functions or constants for reusability and clarity
  const xAxisOptions = {
    type: "time",
    min: new Date("2021-01-01").getTime(),
    max: new Date("2021-12-31").getTime(),
    time: {
      unit: "day",
      tooltipFormat: "MMM DD",
      displayFormats: {
        month: "MMM",
        day: "MMM DD",
      },
    },
    ticks: {
      autoSkip: false,
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
    max: number,
    min?: number
  ) => ({
    type: "linear",
    position: "left",
    id: axisId,
    display: "auto",
    beginAtZero: false,
    suggestedMax: max,
    suggestedMin: min,
    ticks: {
      callback: function (value: any) {
        return `${value}${unit}`;
      },
      maxTicksLimit: 11,
      stepSize: max / 10,
      font: {
        size: 10,
      },
    },
  });
  const datalabelsFormatter = (value: { y: any[] }, context: any) => {
    const dataset = context.chart.data.datasets[context.datasetIndex];
    const yAxisID = dataset.yAxisID;

    // Check if value is an array (for floating bars) and take the second value (high value) if it is
    const yValue = Array.isArray(value.y) ? value.y[1] : value.y;

    // Now ensure that yValue is a number before calling the formatting function
    if (typeof yValue === "number") {
      return formatValueWithUnit(yValue, yAxisID);
    } else {
      console.error("yValue is not a number:", yValue);
      return ""; // or some default error representation
    }
  };

  const tooltipLabelCallback = (context: any) => {
    const label = context.dataset.label || "";
    const yAxisID = context.dataset.yAxisID;
    const yValue = context.parsed.y;

    if (typeof yValue === "number") {
      return `${label}: ${formatValueWithUnit(yValue, yAxisID)}`;
    } else {
      console.error("yValue is not a number:", yValue);
      return `${label}: N/A`; // or some default error representation
    }
  };

  const tooltipCallbacks: any = {
    title: function (context: { label: any }[]) {
      const dateLabel = context[0].label;
      return moment(dateLabel).format("MMM DD");
    },
    label: tooltipLabelCallback,
  };

  // Combine them into your main chart options
  const chartOptions: any = useMemo(
    () => ({
      responsive: true,
      layout: {
        padding: {
          top: 20,
          left: 10,
        },
      },
      plugins: {
        legend: {
          position: "top",
          display: false,
        },

        filler: {
          propagate: true,
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true, // Enable zooming with mouse wheel
              speed: 0.3, // Sensitivity will be multiplied with this number
            },
            pinch: {
              enabled: true, // Enable zooming with pinch gesture
            },
            mode: "x", // Only allow zooming on the x-axis

            // Define limits for zooming in (7 days) and zooming out (365 days)
            // You will need to calculate the number of milliseconds for 7 and 365 days
            speed: 1, // Set the zooming speed
          },
          pan: {
            enabled: true,
            mode: "x",
            rangeMin: {
              x: new Date("2021-01-01").getTime(), // Assuming this is the min date
            },
            rangeMax: {
              x: new Date("2021-12-31").getTime(), // Assuming this is the max date
            },
            speed: 20, // Set the panning speed
            threshold: 10, // Minimal pan distance required before actually applying pan
          },
          limits: {
            x: {
              min: new Date("2021-01-01").getTime(), // Minimum value to show on the x-axis
              max: new Date("2021-12-31").getTime(), // Maximum value to show on the x-axis
              minRange: 14 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
              maxRange: 365 * 24 * 60 * 60 * 1000, // 365 days in milliseconds
            },
          },
        },
        tooltip: {
          mode: "nearest",
          axis: "x",
          intersect: false,
          callbacks: tooltipCallbacks,
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
            style: "oblique",
            family: "Arial",
          },
          formatter: datalabelsFormatter,
        },
      },
      scales: {
        x: xAxisOptions,
        Temperature: yAxisOptions("Temperature", "F", 100, 0),
        Precip: yAxisOptions("Precip", "in", 5, 0),
        Sun_Angle: yAxisOptions("Sun_Angle", "°", 90, 0),
        Percentage: yAxisOptions("Percentage", "%", 100, 0),
        Wind: yAxisOptions("Wind", "mph", 10, 0),
        Comfort_Index: yAxisOptions("Comfort_Index", "", 100, 0),
        UV_Index: yAxisOptions("UV_Index", "", 10, 0),
        // ... Other Y-axis scales
      },
      animation: {
        duration: 1000,
      },
    }),
    [adjustUnitsByVal, units]
  );

  return (
    <Chart
      ref={chartRef}
      options={chartOptions}
      data={chartData}
      type={isBarChart ? "bar" : "line"}
    />
  );
}

export default React.memo(ClimateChart);
