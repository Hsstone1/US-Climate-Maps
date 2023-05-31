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
  } from 'chart.js';
import React from "react";
import { Chart } from "react-chartjs-2";



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
);

type MarkerType = {
    key: String;
    lat: number;
    lng: number;
    data: any;
};

type ClimateChartProps = {
    marker: MarkerType;
};
  

const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ClimateChart: React.FC<ClimateChartProps> = ({ marker }) => {

    const createChartData = (marker: MarkerType) => {
        return {
            labels,
            datasets: [

            {
                type: 'line' as const,
                label: 'Record High',
                data: marker.data.monthly_data.weighted_monthly_record_high,
                backgroundColor: 'rgba(237, 68, 62, 0.0)',
                borderColor: 'rgba(237, 68, 62, 0.0)',
                borderWidth: 0,
                pointRadius: 0,
                pointHoverRadius: 0,
                lineTension: 0.6,
                fill: false,
                visible: false,
                yAxisID: 'Temperature',
            },
            {
                type: 'line' as const,
                label: 'Mean Maximum',
                data: marker.data.monthly_data.weighted_monthly_mean_maximum,
                backgroundColor: 'rgba(237, 68, 62, 0.2)',
                borderColor: 'rgba(237, 68, 62, 0.2)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 0,
                lineTension: 0.6,
                fill: false,
                yAxisID: 'Temperature',
            },
            {
                type: 'line' as const,
                label: 'Max Temperature',
                data: marker.data.monthly_data.weighted_monthly_high_avg,
                backgroundColor: 'rgba(243, 105, 75, 0.7)',
                borderColor: 'rgba(243, 105, 75, 0.7)',
                borderWidth: 4,
                pointRadius: 0.5,
                pointHoverRadius: 3,
                lineTension: 0.6,
                fill: false,

                yAxisID: 'Temperature',
            },
            
            {
                type: 'line' as const,
                label: 'Min Temperature',
                data: marker.data.monthly_data.weighted_monthly_low_avg,
                backgroundColor: 'rgba(97, 139, 201, 0.7)',
                borderColor: 'rgba(97, 139, 201, 0.7)',
                borderWidth: 4,
                pointRadius: 0.5,
                pointHoverRadius: 3,
                lineTension: 0.6,
                fill: 'between',
                yAxisID: 'Temperature',
            }, 
            {
                type: 'line' as const,
                label: 'Mean Minimum',
                data: marker.data.monthly_data.weighted_monthly_mean_minimum,
                backgroundColor: 'rgba(137, 182, 249, 0.3)',
                borderColor: 'rgba(137, 182, 249, 0.3)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 0,
                lineTension: 0.6,
                fill: false,
                yAxisID: 'Temperature',
            }, 
            {
                type: 'line' as const,
                label: 'Record Low',
                data: marker.data.monthly_data.weighted_monthly_record_low,
                backgroundColor: 'rgba(137, 182, 249, 0.0)',
                borderColor: 'rgba(137, 182, 249, 0.0)',
                borderWidth: 0,
                pointRadius: 0,
                pointHoverRadius: 0,
                lineTension: 0.6,
                fill: false,
                visible: false,
                yAxisID: 'Temperature',
            },
            {
                type: 'line' as const,
                label: 'Dewpoint',
                data: marker.data.monthly_data.weighted_monthly_dewpoint_avg,
                backgroundColor: 'rgba(15, 176, 0, 0.3)',
                borderColor: 'rgba(15, 176, 0, 0.3)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 0,
                lineTension: 0.6,
                fill: false,
                yAxisID: 'Temperature',
            },
            {
                type: 'bar' as const,
                label: 'Precip Totals',
                data: marker.data.monthly_data.weighted_monthly_precip_avg,
                backgroundColor: 'rgba(137, 217, 249, 0.5)',
                //fill: true,
                borderColor: 'rgba(137, 217, 249, 0.5)',
                yAxisID: 'Precip',
            }
            // Add more datasets for other climate information (e.g., precipitation, humidity)
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
            display:false
          },
          title: {
            display: true,
            text: 'Yearly Climate Averages',
          },
          filler: {
            propagate: true,
          },  
          hover: {
            mode: 'x',
            delay: 100, // delay 100 milliseconds
          },
          tooltip: {
            mode: 'x', // Set the tooltips mode to 'index' to display values for all datasets at the same index
            intersect: true, // Allow tooltips to display values even if not at the center point
            
          },
        },
        
        scales: {
          x: {
            ticks: {
              autoSkip: false,
              minRotation:0,
              maxRotation:0,
              font: {
                size: 8
              },
            },
          },
          Temperature: {
            type: 'linear',
            position: 'left',
            ticks: {
              callback: function (value) {
                return value + ' °F'; // Append 'units' to the tick value
              },
              font: {
                size: 10
              },
            }
          },
          Precip: {
            type: 'linear',
            position: 'right',
            ticks: {
                beginAtZero: true,
                callback: function (value) {
                  return value + ' in'; // Append 'units' to the tick value
                },
                font: {
                    size: 10
                },
            }, 
            grid: {
              display: false,
            },
            
          }
        },
      } as ChartOptions<'bar' | 'line'>;

    return (
        <Chart
          key={marker.key.toString()}
          width={300}
          height={200}
          options={chartOptions}
          data={createChartData(marker)}
          type={"bar"}
        />
    );
}

export default ClimateChart;

