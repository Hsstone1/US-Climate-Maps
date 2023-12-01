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
import CustomSlider from "../CustomSlider";

type YearSelectorProps = {
  onYearChange: (year: string) => void;
};

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
      <CustomSlider
        value={selectedYear}
        marks={yearLabels}
        valueLabelFormat={(value: any) =>
          value === maxYear + 1 ? "Annual" : value.toString()
        }
        onChange={handleSliderChange}
        onChangeCommitted={handleSliderChangeCommitted}
        min={minYear}
        max={maxYear + 1}
      />
    </Box>
  );
}
