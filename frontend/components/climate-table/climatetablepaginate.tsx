import ClimateTable from "./climatetable";
import { MarkerType } from "../export-props";
import React, { useState } from "react";
type ClimateTableProps = {
  locations: MarkerType[];
};

export default function ClimateTablePaginate({ locations }: ClimateTableProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex: any) => prevIndex + 1);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex: any) => prevIndex - 1);
  };

  const currentChart = locations[currentIndex];

  return (
    <div>
      {/* Render the current chart */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ClimateTable data={currentChart.data} />
      </div>

      {/* Pagination buttons */}
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}
      >
        <button disabled={currentIndex === 0} onClick={handlePrevious}>
          Previous
        </button>
        <button
          disabled={currentIndex === locations.length - 1}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
