import React, { useRef, useMemo, useCallback, useEffect } from "react";
import {
  ChartData,
  ChartDataset,
  Chart as ChartJS,
  registerables,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { ClimateChartDataset } from "./climatecomparehelpers";
import zoomPlugin from "chartjs-plugin-zoom";

ChartJS.register(...registerables, ChartDataLabels, zoomPlugin);

// Define the prop types for your component
type ClimateChartProps = {
  datasetProp: ClimateChartDataset[];
  units?: string;
  adjustUnitsByVal?: number;
  title?: string;
  year?: number;
  xAxisRangeState: { minX: number; maxX: number };
  onXAxisRangeChange: (newState: { minX: number; maxX: number }) => void;
};

function formatValueWithUnit(
  yValue: number,
  yAxisID: string,
  decimalTrunc?: 0
): string {
  let unit = "";

  // Conditions where the value should not be printed
  if ((yAxisID === "Precip" || yAxisID === "Wind") && yValue === 0) {
    return ""; // Return empty string for 0 precip or wind
  } else if (yAxisID === "Percentage" && yValue === 100) {
    return ""; // Return empty string for 100% humidity or comfort index
  }

  switch (yAxisID) {
    case "Temperature":
      unit = "°F";
      break;
    case "Precip":
      unit = "in";
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

function dayOfYearToDate(dayIndex: number, year: number): string {
  const date = new Date(year, 0, dayIndex + 1);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function debounce(func: () => void, wait: number) {
  let timeout: NodeJS.Timeout;

  return function executedFunction() {
    const later = () => {
      clearTimeout(timeout);
      func();
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function ClimateChart({
  datasetProp,
  title = "",
  year = 2023,
  xAxisRangeState,
  onXAxisRangeChange,
}: ClimateChartProps) {
  const chartRef = useRef<ChartJS | null>(null);
  const X_RANGE_MIN = 0;
  const X_RANGE_MAX =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 365 : 364;
  const DEBOUNCE_TIME_MS = 100;

  const updateXAxisRange = () => {
    const chart = chartRef.current;
    if (chart) {
      onXAxisRangeChange({
        minX: chart.scales.x.min,
        maxX: chart.scales.x.max,
      });
    }
  };

  const debouncedRangeChange = useCallback(
    debounce(updateXAxisRange, DEBOUNCE_TIME_MS),
    []
  );

  useEffect(() => {
    const chart = chartRef.current;
    if (chart && chart.options.scales?.x) {
      chart.options.scales.x.min = xAxisRangeState.minX;

      chart.options.scales.x.max = xAxisRangeState.maxX;
      chart.update();
    }
  }, [xAxisRangeState]);

  // Transform datasets for line chart
  const transformedLineDatasets = useMemo(() => {
    return datasetProp
      .filter((d) => d.type === "line")
      .map((dataset) => ({
        ...dataset,
        data: dataset.data.map((value: any, index: any) => ({
          x: index,
          y: value,
        })),
        type: "line" as const, // set type to 'line' explicitly
      }));
  }, [datasetProp]);

  // Transform datasets for bar chart
  const transformedBarDatasets = useMemo(() => {
    if (datasetProp.filter((d) => d.type === "bar").length < 2) {
      //console.error("Expected 2 datasets, received: ", datasetProp.length);
      return [];
    }

    const [highDataset, lowDataset] = datasetProp.filter(
      (d) => d.type === "bar"
    );
    const barChartData = highDataset.data.map(
      (highValue: any, index: string | number) => ({
        x: index,
        y: [lowDataset.data[index], highValue], // Create a floating bar
      })
    );

    return [
      {
        ...highDataset,
        data: barChartData,
        type: "bar" as const,
        borderSkipped: false,
        categoryPercentage: 0.95,
        barPercentage: 0.95,
      },
    ];
  }, [datasetProp]);

  const lineDatasets = transformedLineDatasets;
  const barDatasets = transformedBarDatasets;
  // Combine datasets
  const combinedDatasets = [...lineDatasets, ...barDatasets];

  // Create the chart data
  const chartData: ChartData<"bar" | "line"> = useMemo(
    () => ({
      datasets: combinedDatasets,
    }),
    [combinedDatasets]
  );

  // Define scale settings as functions or constants for reusability and clarity
  const xAxisOptions = {
    type: "linear",
    offset: false,
    min: xAxisRangeState.minX,
    max: xAxisRangeState.maxX,

    ticks: {
      callback: function (value: number) {
        return dayOfYearToDate(value, year);
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
    stepsize: number = 10
  ) => ({
    type: "linear",
    offset: false,
    position: "left",
    id: axisId,
    display: "auto",
    beginAtZero: false,
    suggestedMin: suggested_min,
    suggestedMax: suggested_max,

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
  const datalabelsFormatter = (value: { y: any[] }, context: any) => {
    const dataset = context.chart.data.datasets[context.datasetIndex];
    const yAxisID = dataset.yAxisID;

    // Check if value is an array (for floating bars) and take the second value (high value) if it is
    const yValue = Array.isArray(value.y) ? "" : value.y;

    // Now ensure that yValue is a number before calling the formatting function
    if (typeof yValue === "number") {
      return formatValueWithUnit(yValue, yAxisID);
    } else {
      //console.error("yValue is not a number: FORMATTER", yValue);
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
      //console.error("yValue is not a number: TOOLTIP", yValue);
      return `${label}: N/A`; // or some default error representation
    }
  };

  const tooltipCallbacks: any = {
    title: function (context: { label: any }[]) {
      const dayIndex = parseInt(context[0].label);
      // Convert day index to date string
      return dayOfYearToDate(dayIndex, year); // Assuming 'year' is available in the scope
    },
    label: tooltipLabelCallback,
  };
  // Combine them into your main chart options
  const chartOptions: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 16 / 9,
      layout: {
        padding: {
          top: 0,
          left: 30,
        },
      },

      plugins: {
        legend: {
          position: "top",
          display: false,
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 20,
          },
        },

        filler: {
          propagate: true,
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
              speed: 0.3,
            },
            pinch: {
              enabled: true,
            },
            mode: "x",
            onZoomComplete: function () {
              debouncedRangeChange();
            },
          },
          pan: {
            enabled: true,
            mode: "x",
            rangeMin: {
              x: X_RANGE_MIN,
            },
            rangeMax: {
              x: X_RANGE_MAX,
            },
            onPanComplete: function () {
              debouncedRangeChange();
            },
          },
          limits: {
            x: {
              min: X_RANGE_MIN,
              max: X_RANGE_MAX,
              minRange: 30, //number of days
              maxRange: X_RANGE_MAX,
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
        Temperature: yAxisOptions("Temperature", "F", 100, 0, 10),
        Dewpoint: yAxisOptions("Dewpoint", "F", 80, 0, 10),
        Precip: yAxisOptions("Precip", "in", 5, 0, 1),
        Percentage: yAxisOptions("Percentage", "%", 100, 0, 10),
        Wind: yAxisOptions("Wind", "mph", 20, 0, 1),
        Comfort_Index: yAxisOptions("Comfort_Index", "", 100, 0, 10),
        UV_Index: yAxisOptions("UV_Index", "", 10, 0, 1),

        // ... Other Y-axis scales
      },

      animation: {
        duration: 250,
        easing: "linear",
      },
    }),
    [
      title,
      xAxisOptions,
      yAxisOptions,
      tooltipCallbacks,
      datalabelsFormatter,
      debouncedRangeChange,
    ]
  );

  return (
    <div className="chart-container">
      <Chart
        ref={chartRef}
        options={chartOptions}
        data={chartData}
        type={"line"}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}

export default React.memo(ClimateChart);
