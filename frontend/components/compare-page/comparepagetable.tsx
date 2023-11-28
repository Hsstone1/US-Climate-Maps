import * as React from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { MonthLabels } from "./climate-chart-helpers";
import { LocationColors, MarkerType } from "../location-props";
import Typography from "@mui/material/Typography";

type ComparisonPageProps = {
  locations: MarkerType[];
  heading: string;
  monthly_data: any;
  annual_data: any;
  numDec?: number;
  units?: string;
};

const StyledTableCell = styled(TableCell)(() => ({
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

const ClimateTable = ({
  locations,
  heading,
  monthly_data,
  annual_data,
  numDec = 0,
  units = "",
}: ComparisonPageProps) => {
  return (
    <div>
      <Typography
        sx={{ flex: "1 1 100%" }}
        variant="subtitle1"
        component="div"
        textAlign={"center"}
      >
        {heading}
      </Typography>
      <div className="compare-climate-table">
        <TableContainer component={Paper}>
          <Table style={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                <StyledTableCell>Location</StyledTableCell>
                {MonthLabels.map((month) => (
                  <StyledTableCell key={month}>{month}</StyledTableCell>
                ))}
                <StyledTableCell>Annual</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((location, locIndex) => {
                const combinedData = [
                  ...monthly_data[locIndex],
                  annual_data[locIndex],
                ];

                return (
                  <TableRow key={location.data.location_data.location}>
                    <StyledTableCell
                      style={{
                        whiteSpace: "nowrap",
                        position: "relative",
                        paddingLeft: "10px",
                      }}
                    >
                      <div
                        className="table-location-color-box"
                        style={{
                          position: "absolute",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "10px",
                          height: "10px",
                          backgroundColor: LocationColors(1)[locIndex],
                        }}
                      ></div>
                      {location.data.location_data.location}
                    </StyledTableCell>

                    {combinedData.map((value, i) => (
                      <StyledTableCell key={i}>
                        {i === combinedData.length - 1
                          ? `${value.toFixed(numDec)}${units}`
                          : value.toFixed(numDec)}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <br />
    </div>
  );
};

export default ClimateTable;
