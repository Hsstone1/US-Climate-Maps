import React, { SyntheticEvent } from "react";
import {
  Button,
  Typography,
  Box,
  Slider,
  Tooltip,
  styled,
} from "@mui/material";
import { useEffect, useState } from "react";

type YearSelectorProps = {
  onYearChange: (year: string) => void;
};

// Custom styling for the Slider component
const CompactSlider = styled(Slider)(({ theme }) => ({
  paddingTop: theme.spacing(2), // Reduce top padding
  paddingBottom: theme.spacing(1), // Reduce bottom padding

  // Adjust the style of the value label to bring it closer to the slider
  "& .MuiSlider-valueLabel": {
    top: 0, // Adjust the top position to bring it closer
  },

  // Adjust the style of the track and thumb for a more compact appearance
  "& .MuiSlider-track": {
    height: 3, // Adjust the track height
  },
  "& .MuiSlider-thumb": {
    height: 20, // Adjust the thumb size
    width: 20, // Adjust the thumb size
  },
}));

export default function YearSelector({ onYearChange }: YearSelectorProps) {
  //const currentYear = new Date().getFullYear();
  const maxYear = 2022;
  const minYear = 1980;
  const [selectedYear, setSelectedYear] = useState(maxYear + 1);

  const generateYearLabels = () => {
    const labels = [];
    labels.push({ value: maxYear + 1, label: "Annual" });

    for (let year = minYear; year <= maxYear; year += 5) {
      labels.push({ value: year, label: year.toString() });
    }
    return labels;
  };

  const yearLabels = generateYearLabels();

  const handleSliderChange = (
    event: Event | SyntheticEvent<Element, Event>,
    newValue: number | number[]
  ) => {
    setSelectedYear(newValue as number);
  };

  const handleSliderChangeCommitted = (
    event: Event | SyntheticEvent<Element, Event>,
    newValue: number | number[]
  ) => {
    const yearValue = newValue === maxYear + 1 ? "Annual" : newValue.toString();
    onYearChange(yearValue);
    setSelectedYear(newValue as number);
  };

  return (
    <Box textAlign="center" className="year-selector-footer">
      <CompactSlider
        value={selectedYear}
        marks={yearLabels}
        valueLabelFormat={(value) =>
          value === maxYear + 1 ? "Annual" : value.toString()
        }
        valueLabelDisplay="auto"
        onChange={handleSliderChange}
        onChangeCommitted={handleSliderChangeCommitted}
        min={minYear}
        max={maxYear + 1}
      />
    </Box>
  );
}
