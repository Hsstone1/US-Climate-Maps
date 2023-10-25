import ClimateTable from "./climatetable";
import { MarkerType } from "../export-props";
import React, { useState, useEffect } from "react";
import { Button, Box } from "@mui/material";
import Pagination from "@mui/material/Pagination";

type ClimateChartProps = {
  locations: MarkerType[];
  children: (location: MarkerType) => JSX.Element;
};

export default function ClimateChartPaginate({
  locations,
  children,
}: ClimateChartProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChart, setCurrentChart] = useState<MarkerType | null>(null);

  useEffect(() => {
    // This is a hack to prevent the app from crashing when the user removes a location
    // when the current index is at the end of the array
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

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentIndex(page - 1);
  };

  return (
    <div>
      {/* Render the current chart if it exists */}
      {currentChart && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          {children(currentChart)}
        </div>
      )}

      {/* Pagination */}
      <Box display="flex" justifyContent="center" marginTop={2}>
        <Pagination
          count={locations.length}
          page={currentIndex + 1}
          onChange={handlePageChange}
          shape="rounded"
        />
      </Box>
      <br />
      <hr />
    </div>
  );
}
