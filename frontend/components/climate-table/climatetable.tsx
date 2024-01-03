import ClimateTableRow from "./ClimateTableRow";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import * as React from "react";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ThemeColor } from "../data-value-colors";

type TableProps = {
  data: any;
};

export default function ClimateTable({ data }: TableProps) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Year",
  ];

  const StyledTableCell = styled(TableCell)((noBackground) => ({
    [`&.${tableCellClasses.head}`]: {
      border: `1px solid ${ThemeColor}`,
      backgroundColor: ThemeColor,
      padding: "0.05em",
      fontSize: "0.75em",
      textAlign: "center",
      color: "#FFFFFF",
    },

    "@media screen and (max-width: 768px)": {
      fontSize: "0.6em", // Smaller text on small screens
      // Adjust the font size of children elements
    },
  }));

  const climate_data = data.climate_data;

  return (
    <div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Value</StyledTableCell>
              {monthNames.map((monthName, index) => (
                <StyledTableCell key={index}>{monthName}</StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <ClimateTableRow
              monthly_data={climate_data.record_high.monthly_max}
              annual_data={climate_data.record_high.annual_max}
              rowTitle="R-High"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={climate_data.high_temperature.monthly}
              annual_data={climate_data.high_temperature.annual}
              rowTitle="High"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={climate_data.mean_temperature.monthly}
              annual_data={climate_data.mean_temperature.annual}
              rowTitle="Average"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={climate_data.low_temperature.monthly}
              annual_data={climate_data.low_temperature.annual}
              rowTitle="Low"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={climate_data.record_low.monthly_min}
              annual_data={climate_data.record_low.annual_min}
              rowTitle="R-Low"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={climate_data.dewpoint.monthly}
              annual_data={climate_data.dewpoint.annual}
              rowTitle="Dewpoint"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.mean_humidity.monthly}
              annual_data={climate_data.mean_humidity.annual}
              rowTitle="Humidity"
              dataType="Humidity"
              annual_units="%"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.precipitation.monthly}
              annual_data={climate_data.precipitation.annual}
              rowTitle="Precip"
              dataType="Precip"
              numDec={0}
              divideAnnualBackground={12}
              annual_units=" in"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.snow.monthly}
              annual_data={climate_data.snow.annual}
              rowTitle="Snow"
              dataType="Precip"
              numDec={0}
              divideAnnualBackground={12}
              annual_units=" in"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.precip_days.monthly}
              annual_data={climate_data.precip_days.annual}
              rowTitle="Precip Days"
              dataType="Precip"
              divideAnnualBackground={12}
              divideDataByVal={2}
              annual_units=" days"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={climate_data.snow_days.monthly}
              annual_data={climate_data.snow_days.annual}
              rowTitle="Snowy Days"
              dataType="Precip"
              divideAnnualBackground={12}
              divideDataByVal={2}
              annual_units=" days"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={climate_data.sun.monthly}
              annual_data={climate_data.sun.annual}
              rowTitle="Sunlight"
              dataType="SunPercent"
              annual_units="%"
            ></ClimateTableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <br />
    </div>
  );
}
