import ClimateTableRow from "./climatetablerow";
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

  const climateData = data.climate_data.avg_annual;

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
              monthly_data={mapClimateData("RECORD_HIGH")}
              annual_data={climateData.RECORD_HIGH}
              rowTitle="Record High (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("EXPECTED_MAX")}
              annual_data={climateData.EXPECTED_MAX}
              rowTitle="Expected Max (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("HIGH_AVG")}
              annual_data={climateData.HIGH_AVG}
              rowTitle="Average High (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("MEAN_AVG")}
              annual_data={climateData.MEAN_AVG}
              rowTitle="Daily Average (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("LOW_AVG")}
              annual_data={climateData.LOW_AVG}
              rowTitle="Average Low (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("EXPECTED_MIN")}
              annual_data={climateData.EXPECTED_MIN}
              rowTitle="Expected Min (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("RECORD_LOW")}
              annual_data={climateData.RECORD_LOW}
              rowTitle="Record Low (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={mapClimateData("PRECIP_AVG")}
              annual_data={climateData.PRECIP_AVG}
              rowTitle="Rainfall (in)"
              dataType="Precip"
              numDec={1}
              divideAnnualBackground={12}
              annual_units=" in"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("PRECIP_DAYS")}
              annual_data={climateData.PRECIP_DAYS}
              rowTitle="Rainy Days"
              dataType="Precip"
              divideAnnualBackground={12}
              annual_units=" days"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("SNOW_AVG")}
              annual_data={climateData.SNOW_AVG}
              rowTitle="Snowfall (in)"
              dataType="Precip"
              numDec={1}
              divideAnnualBackground={12}
              annual_units=" in"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("SNOW_DAYS")}
              annual_data={climateData.SNOW_DAYS}
              rowTitle="Snowy Days"
              dataType="Precip"
              divideAnnualBackground={12}
              annual_units=" days"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={mapClimateData("HUMIDITY_AVG")}
              annual_data={climateData.HUMIDITY_AVG}
              rowTitle="Humidity (%)"
              dataType="Humidity"
              annual_units="%"
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("DEWPOINT_AVG")}
              annual_data={climateData.DEWPOINT_AVG}
              rowTitle="Dewpoint (°F)"
              dataType="Temperature"
              annual_units="°F"
            ></ClimateTableRow>

            <ClimateTableRow
              monthly_data={mapClimateData("SUNSHINE_HOURS")}
              annual_data={climateData.SUNSHINE_HOURS}
              rowTitle="Sunshine Hours"
              dataType="SunHours"
              divideAnnualBackground={12}
            ></ClimateTableRow>
            <ClimateTableRow
              monthly_data={mapClimateData("SUNSHINE_AVG")}
              annual_data={climateData.SUNSHINE_AVG}
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
