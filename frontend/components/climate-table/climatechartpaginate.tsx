import React, { useState, useEffect } from "react";
import { Box, Pagination } from "@mui/material";
import { MarkerType } from "../export-props";

type ClimateChartProps = {
  locations: MarkerType[];
  children: (location: MarkerType, index?: number) => JSX.Element;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
};

export default function ClimateChartPaginate({
  locations,
  children,
  currentIndex,
  setCurrentIndex,
}: ClimateChartProps) {
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
    } else if (locations.length > 0) {
      // added an else if condition to check if locations array is not empty
      setCurrentChart(locations[currentIndex - 1]);
      setCurrentIndex((prev) => Math.max(prev - 1, 0)); // Boundary check added
    }
  }, [locations, currentIndex, setCurrentIndex]);

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
          {children(currentChart, currentIndex)}
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
