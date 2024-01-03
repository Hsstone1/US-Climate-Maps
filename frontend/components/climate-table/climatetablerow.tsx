import { TableRow, TableCell } from "@mui/material";
import { styled } from "@mui/system";

import {
  ThemeColor,
  getBackgroundColor,
  getTextColor,
} from "../data-value-colors";

type ClimateTableRowProps = {
  monthly_data: any;
  annual_data: any;
  rowTitle: string;
  dataType:
    | "Temperature"
    | "Precip"
    | "Humidity"
    | "SunHours"
    | "SunPercent"
    | "UV Index";
  numDec?: number;
  divideAnnualBackground?: 1 | 12;
  divideDataByVal?: number;
  annual_units?: string;
};

const StyledTableCell = styled(TableCell)(({}) => ({
  border: `1px solid ${ThemeColor}`,
  whiteSpace: "nowrap",
  padding: "0.05em",
  fontSize: "0.75em",
  margin: "0px",
  "@media screen and (max-width: 768px)": {
    fontSize: "0.6em", // Smaller text on small screens
    // Adjust the font size of children elements
  },
}));

export default function ClimateTableRow({
  monthly_data,
  annual_data,
  rowTitle,
  dataType,
  numDec = 0,
  divideAnnualBackground = 1,
  divideDataByVal = 1,
  annual_units = "",
}: ClimateTableRowProps) {
  return (
    <TableRow>
      <StyledTableCell align="right" style={{ paddingRight: "0.5em" }}>
        {rowTitle}
      </StyledTableCell>
      {monthly_data.map((value: any, index: any) => (
        <StyledTableCell
          key={index}
          style={{
            backgroundColor: getBackgroundColor(
              value / divideDataByVal,
              dataType
            ),
            color: getTextColor(value / divideDataByVal, dataType),
            textAlign: "center",
          }}
        >
          {value.toFixed(numDec)}
        </StyledTableCell>
      ))}

      <StyledTableCell
        style={{
          backgroundColor: getBackgroundColor(
            annual_data / divideAnnualBackground / divideDataByVal,
            dataType
          ),
          color: getTextColor(
            annual_data / divideAnnualBackground / divideDataByVal,
            dataType
          ),
          textAlign: "center",
        }}
      >
        {`${annual_data.toFixed(numDec)}${annual_units}`}
      </StyledTableCell>
    </TableRow>
  );
}
