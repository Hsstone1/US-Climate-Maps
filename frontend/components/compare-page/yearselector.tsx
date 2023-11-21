import React from "react";
import { Button, Typography, Box } from "@mui/material";
import { useEffect, useState } from "react";

type YearSelectorProps = {
  onYearChange: (year: string) => void;
};

export default function YearSelector({ onYearChange }: YearSelectorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState("Annual");
  //const currentYear = new Date().getFullYear();
  const currentYear = 2022;
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) =>
    (currentYear - i).toString()
  );

  useEffect(() => {
    onYearChange(selectedYear);
  }, [selectedYear, onYearChange]);

  return (
    <Box textAlign="center" className="year-selector-footer">
      <Button variant="outlined" onClick={() => setIsOpen(!isOpen)}>
        Year Selector {isOpen ? "▼" : "▲"}
      </Button>

      {isOpen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            overflowX: "auto",
          }}
        >
          <Button
            variant="contained"
            color={selectedYear === "Annual" ? "primary" : "inherit"}
            onClick={() => setSelectedYear("Annual")}
            style={{ margin: "0 8px" }}
          >
            Annual
          </Button>

          {years.map((year) => (
            <Button
              key={year}
              variant="contained"
              color={selectedYear === year ? "primary" : "inherit"}
              onClick={() => setSelectedYear(year)}
              style={{ margin: "0 8px" }}
            >
              {year}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}
