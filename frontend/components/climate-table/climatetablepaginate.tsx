import ClimateTable from "./climatetable";
import { MarkerType } from "../export-props";
import React, { useState, useEffect } from "react";

type ClimateTableProps = {
  locations: MarkerType[];
};

export default function ClimateTablePaginate({ locations }: ClimateTableProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChart, setCurrentChart] = useState<MarkerType | null>(null);

  useEffect(() => {
    //This is a hack to prevent the app from crashing when the user removes a location
    //when the current index is at the end of the array
    if (
      locations.length > 0 &&
      currentIndex >= 0 &&
      currentIndex < locations.length
    ) {
      setCurrentChart(locations[currentIndex]);
    } else {
      setCurrentChart(locations[currentIndex - 1]);
      handlePrevious();
    }
  }, [locations, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

  return (
    <div>
      {/* Render the current chart if it exists */}
      {currentChart && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ClimateTable data={currentChart.data} />
        </div>
      )}

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
