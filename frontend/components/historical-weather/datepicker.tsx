import React from "react";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";

type YearDropdownProps = {
  onSelectYear: (year: string) => void;
};

export default function YearDropdown({ onSelectYear }: YearDropdownProps): any {
  //this is the dropdown menu for the historical weather selection
  //annual is the default average of all years, then it goes from 2023 to 1980
  const years = [
    "Average",
    ...Array.from({ length: 2023 - 1980 + 1 }, (_, index) =>
      (2023 - index).toString()
    ),
  ];

  const handleSelect: any = (event: React.ChangeEvent<{ value: string }>) => {
    onSelectYear(event.target.value);
  };

  return (
    <FormControl>
      <InputLabel>Yearly Data</InputLabel>
      <Select
        label="Yearly Data"
        onChange={handleSelect}
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
