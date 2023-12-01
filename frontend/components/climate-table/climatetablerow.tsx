import { TableRow, TableCell } from "@mui/material";
import { styled } from "@mui/system";

import { getBackgroundColor, getTextColor } from "../data-value-colors";

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
