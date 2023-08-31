import React from "react";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import zIndex from "@mui/material/styles/zIndex";

type YearDropdownProps = {
  onSelectYear: (year: string) => void;
};

export default function YearDropdown({ onSelectYear }: YearDropdownProps): any {
  //this is the dropdown menu for the historical weather selection
  //annual is the default average of all years, then it goes from 2023 to 1980
  const years = [
    "annual",
    ...Array.from({ length: 2023 - 1980 + 1 }, (_, index) =>
      (2023 - index).toString()
    ),
  ];

  const handleSelect = (event: React.ChangeEvent<{ value: string }>) => {
    const selectedYear = event.target.value;
    onSelectYear(selectedYear);
  };

  return (
    <FormControl>
      <InputLabel>Select Year</InputLabel>
      <Select
        label="Select Year"
        onChange={handleSelect as any}
        style={{ width: 150, height: 40 }}
      >
        {years.map((year, index) => (
          <MenuItem key={index} value={year}>
            {year}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
