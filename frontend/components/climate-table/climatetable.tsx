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
      border: "1px solid black",
      backgroundColor: "#303030",
      padding: "2px",
      margin: "0px",
      textAlign: "center",
      color: "#FFFFFF",
    },
    [`&.${tableCellClasses.body}`]: {
      border: "1px solid black",
      fontSize: 14,
      padding: "2px",
      margin: "0px",
      textAlign: "center",
    },
  }));

  const mapClimateData = (key: string) =>
    data.climate_data.avg_monthly.map(
      (month: { [key: string]: any }) => month[key]
    );
  const climate_data = data.climate_data;

  return (
    <div>
      <Typography
        sx={{
          padding: "0px",
          fontSize: "16px",
          fontWeight: "bold",
          textAlign: "center",
        }}
        component="div" // Using div to ensure block level element, you can also use 'p' or others as needed
      >
        {`${
          data.location_data.location
        } (${data.location_data.elevation.toFixed(0)} ft)`}
      </Typography>

      <Typography
        sx={{
          padding: "0px",
          fontSize: "14px",
          fontWeight: "lighter",
          textAlign: "center",
        }}
        component="div" // Using div to ensure block level element, you can also use 'p' or others as needed
      >
        {`${data.location_data.koppen}, ${data.location_data.plant_hardiness}`}
      </Typography>

      <TableContainer component={Paper}>
        <Table style={{ borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <StyledTableCell component="th">Value</StyledTableCell>
              {monthNames.map((monthName, index) => (
                <StyledTableCell key={index} component="th">
                  {monthName}
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <ClimateTableRow
              monthly_data={climate_data.record_high.monthly_max}
              annual_data={climate_data.record_high.annual_max}
              rowTitle="Record High (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={climate_data.expected_max.monthly_max}
              annual_data={climate_data.expected_max.annual_max}
              rowTitle="Expected Max (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.high_temperature.monthly}
              annual_data={climate_data.high_temperature.annual}
              rowTitle="Average High (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.mean_temperature.monthly}
              annual_data={climate_data.mean_temperature.annual}
              rowTitle="Daily Average (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.low_temperature.monthly}
              annual_data={climate_data.low_temperature.annual}
              rowTitle="Average Low (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.expected_min.monthly_min}
              annual_data={climate_data.expected_min.annual_min}
              rowTitle="Expected Min (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.record_low.monthly_min}
              annual_data={climate_data.record_low.annual_min}
              rowTitle="Record Low (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.precipitation.monthly}
              annual_data={climate_data.precipitation.annual}
              rowTitle="Rainfall (in)"
              dataType="Precip"
              numDec={1}
              divideAnnualBackground={12}
              annual_units=" in"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.precip_days.monthly}
              annual_data={climate_data.precip_days.annual}
              rowTitle="Rainy Days"
              dataType="Precip"
              divideAnnualBackground={12}
              annual_units=" days"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.snow.monthly}
              annual_data={climate_data.snow.annual}
              rowTitle="Snowfall (in)"
              dataType="Precip"
              numDec={1}
              divideAnnualBackground={12}
              annual_units=" in"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.snow_days.monthly}
              annual_data={climate_data.snow_days.annual}
              rowTitle="Snowy Days"
              dataType="Precip"
              divideAnnualBackground={12}
              annual_units=" days"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.mean_humidity.monthly}
              annual_data={climate_data.mean_humidity.annual}
              rowTitle="Humidity (%)"
              dataType="Humidity"
              annual_units="%"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.dewpoint.monthly}
              annual_data={climate_data.dewpoint.annual}
              rowTitle="Dewpoint (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.sunlight_hours.monthly}
              annual_data={climate_data.sunlight_hours.annual}
              rowTitle="Sunlight Hours"
              dataType="SunHours"
              divideAnnualBackground={12}
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={climate_data.sun.monthly}
              annual_data={climate_data.sun.annual}
              rowTitle="Sunshine (%)"
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
