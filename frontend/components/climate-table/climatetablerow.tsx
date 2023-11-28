import { TableRow, TableCell } from "@mui/material";
import { styled } from "@mui/system";

import {
  TemperatureColors,
  PrecipColors,
  SunColors,
  UV_Index_Colors,
} from "./climate-table-colors";

type ClimateTableRowProps = {
  monthly_data: any;
  annual_data: any;
  rowTitle: string;
  dataType:
    | "Temperature"
    | "Precip"
    | "Snow"
    | "Humidity"
    | "SunHours"
    | "SunPercent"
    | "UV Index";
  numDec?: number;
  divideAnnualBackground?: 1 | 12;
  annual_units?: string;
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: "1px solid black",
  whiteSpace: "nowrap",
  padding: "2px",
  textAlign: "right",
  fontSize: "12px",
}));

export default function ClimateTableRow({
  monthly_data,
  annual_data,
  rowTitle,
  dataType,
  numDec = 0,
  divideAnnualBackground = 1,
  annual_units = "",
}: ClimateTableRowProps) {
  const getBackgroundColor = (value: number, dataType: string) => {
    if (dataType === "Temperature") {
      //Degrees F, -20 is dark blue, 130 is dark red
      const lowerValue = -20;
      const upperValue = 130;
      if (value > upperValue) {
        return TemperatureColors[TemperatureColors.length - 1];
      }
      if (value < lowerValue) {
        return TemperatureColors[0];
      }
      return TemperatureColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (TemperatureColors.length - 1)
        )
      ];
    } else if (dataType === "Precip") {
      //Inches of rain per month 0 is light blue, 12 is dark blue

      const lowerValue = 0;
      const upperValue = 12;
      if (value > upperValue) {
        return PrecipColors[PrecipColors.length - 1];
      }
      if (value < lowerValue) {
        return PrecipColors[0];
      }
      return PrecipColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (PrecipColors.length - 1)
        )
      ];
    } else if (dataType === "Humidity") {
      const lowerValue = 20;
      const upperValue = 90;
      if (value > upperValue) {
        return PrecipColors[PrecipColors.length - 1];
      }
      if (value < lowerValue) {
        return PrecipColors[0];
      }
      return PrecipColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (PrecipColors.length - 1)
        )
      ];
    } else if (dataType === "SunHours") {
      const lowerValue = 0;
      const upperValue = 400;
      if (value > upperValue) {
        return SunColors[SunColors.length - 1];
      }
      if (value < lowerValue) {
        return SunColors[0];
      }
      return SunColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (SunColors.length - 1)
        )
      ];
    } else if (dataType === "SunPercent") {
      const lowerValue = 0;
      const upperValue = 100;
      if (value > upperValue) {
        return SunColors[SunColors.length - 1];
      }
      if (value < lowerValue) {
        return SunColors[0];
      }
      return SunColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (SunColors.length - 1)
        )
      ];
    } else if (dataType === "UV Index") {
      if (value <= 2.5) {
        return UV_Index_Colors[0];
      } else if (value <= 5.5) {
        return UV_Index_Colors[1];
      } else if (value <= 7.5) {
        return UV_Index_Colors[2];
      } else if (value < 10.5) {
        return UV_Index_Colors[3];
      } else {
        return UV_Index_Colors[4];
      }
    }
  };

  const getTextColor = (value: number, dataType: string) => {
    if (dataType === "Temperature") {
      return value >= 89.5 || value <= 0.5 ? "#FFFFFF" : "#000000";
    } else if (dataType === "Precip") {
      return value >= 4.5 ? "#FFFFFF" : "#000000";
    } else if (dataType === "Humidity") {
      return value >= 9.5 ? "#FFFFFF" : "#000000";
    } else if (dataType === "SunHours") {
      return value <= 49.5 ? "#FFFFFF" : "#000000";
    } else if (dataType === "SunPercent") {
      return value <= 19.5 ? "#FFFFFF" : "#000000";
    }
  };

  return (
    <TableRow>
      <StyledTableCell align="right">{rowTitle}</StyledTableCell>
      {monthly_data.map((value: any, index: any) => (
        <StyledTableCell
          key={index}
          style={{
            backgroundColor: getBackgroundColor(value, dataType),
            color: getTextColor(value, dataType),
            textAlign: "center",
          }}
        >
          {value.toFixed(numDec)}
        </StyledTableCell>
      ))}

      <StyledTableCell
        style={{
          backgroundColor: getBackgroundColor(
            annual_data / divideAnnualBackground,
            dataType
          ),
          color: getTextColor(annual_data / divideAnnualBackground, dataType),
          textAlign: "center",
        }}
      >
        {`${annual_data.toFixed(numDec)}${annual_units}`}
      </StyledTableCell>
    </TableRow>
  );
}
