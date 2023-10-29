import React, { useState, useEffect } from "react";
import { Box, Pagination } from "@mui/material";
import { MarkerType } from "../export-props";

type ClimateChartProps = {
  locations: MarkerType[];
  children: (location: MarkerType, index: number) => JSX.Element;
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
    if (locations.length > 0) {
      if (currentIndex >= 0 && currentIndex < locations.length) {
        setCurrentChart(locations[currentIndex]);
      } else {
        const lastIndex = locations.length - 1;
        setCurrentChart(locations[lastIndex]);
        setCurrentIndex(lastIndex);
      }
    } else {
      setCurrentChart(null);
      setCurrentIndex(0);
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
      {currentChart && typeof children === "function" && (
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
