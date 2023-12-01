import React, { useRef, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const ClimatePieChart = ({
  dataset,
  title,
  year,
  labels,
}: {
  dataset: number[];
  title: string;
  year: string;
  labels: string[];
}) => {
  const chartRef = useRef(null);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Weather Conditions",
        data: dataset, // Assuming dataset is an array like [63, 144, 156]
        backgroundColor: [
          "rgba(255, 206, 86, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(153, 102, 255, 0.7)",
        ],
        borderColor: [
          "rgba(255, 206, 86, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 20,
        },
      },
    },
  };

  return (
    <div>
      <Pie ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  );
};

export default React.memo(ClimatePieChart);
