import React, { useRef, useMemo, useCallback, useEffect } from "react";
import {
  ChartData,
  ChartDataset,
  Chart as ChartJS,
  registerables,
} from "chart.js";
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
import zoomPlugin from "chartjs-plugin-zoom";
import { TitleColor } from "../data-value-colors";
import { MIN_YEAR } from "../global-utils";

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
  X_RANGE_MIN?: number;
  X_RANGE_MAX?: number;
  MAX_ZOOM?: number;
  dataType?: "YEARLY" | "MONTHLY" | "DAILY";
  displayLegend?: boolean;
  isStacked?: boolean;
  updateChartZoom?: boolean;
};

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
  X_RANGE_MIN = 0,
  X_RANGE_MAX = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    ? 365
    : 364,
  MAX_ZOOM = 30,
  dataType = "DAILY",
  displayLegend = false,
  isStacked = false,
  updateChartZoom = true,
}: ClimateChartProps) {
  const chartRef = useRef<ChartJS | null>(null);

  const DEBOUNCE_TIME_MS = 100;

  const updateXAxisRange = () => {
    const chart = chartRef.current;
    if (chart) {
      if (updateChartZoom) {
        onXAxisRangeChange({
          minX: chart.scales.x.min,
          maxX: chart.scales.x.max,
        });
      }
    }
  };

  const debouncedRangeChange = useCallback(
    debounce(updateXAxisRange, DEBOUNCE_TIME_MS),
    []
  );

  useEffect(() => {
    const chart = chartRef.current;
    if (chart && chart.options.scales?.x) {
      if (updateChartZoom) {
        chart.options.scales.x.min = xAxisRangeState.minX;

        chart.options.scales.x.max = xAxisRangeState.maxX;
        chart.update();
      }
    }
  }, [xAxisRangeState, updateChartZoom]);

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

  const chartData: ChartData<"bar" | "line"> = useMemo(() => {
    const combinedDatasets = [...lineDatasets, ...barDatasets];

    return {
      datasets: combinedDatasets,
    };
  }, [lineDatasets, barDatasets]); // Dependencies are the arrays used inside combinedDatasets

  // Define scale settings as functions or constants for reusability and clarity
  const xAxisOptions = {
    type: "linear",
    offset: false,
    min: updateChartZoom ? xAxisRangeState.minX : X_RANGE_MIN,
    max: updateChartZoom ? xAxisRangeState.maxX : X_RANGE_MAX,
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
    suggested_max?: number | undefined,
    suggested_min?: number | undefined,
    stepsize: number = 1,
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
          //display: displayLegend,
          display: true,
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

              //This is the minimum number of x values that can be displayed at once
              // If X_RANGE_MAX is more than 300, then this chart must be displaying days of the year
              // Rather than individual years, as in the case of the climate trends component
              minRange: MAX_ZOOM,
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
        Temperature: yAxisOptions("Temperature", "°", 100, 0, 10),
        Dewpoint: yAxisOptions("Dewpoint", "°", 80, 0, 10),
        Precip: yAxisOptions("Precip", "in", 5, 0, 1),
        Percentage: yAxisOptions("Percentage", "%", 100, 0, 10, 100),
        Wind: yAxisOptions("Wind", "", 20, 0, 1),
        Comfort_Index: yAxisOptions("Comfort_Index", "", 100, 0, 10),
        UV_Index: yAxisOptions("UV_Index", "", 10, 0, 1),

        TemperatureTrend: yAxisOptions("TemperatureTrend", "°"),
        PrecipTrend: yAxisOptions("PrecipTrend", "in"),
        DaysTrend: yAxisOptions("DaysTrend", "days"),
        PercentageTrend: yAxisOptions("PercentageTrend", "%"),

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
