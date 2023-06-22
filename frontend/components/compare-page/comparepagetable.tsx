import * as React from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { MonthLabels } from "./comparepageprops";
import { LocationColors, MarkerType } from "../export-props";
import Typography from "@mui/material/Typography";

type ComparisonPageProps = {
  locations: MarkerType[];
  heading: string; //'Mean Maximum'
  monthlyDataStr: string; //'monthly_mean_maximum'
  annualDataStr: string; //'annual_record_high'
  decimalTrunc: number;
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
  monthlyDataStr,
  annualDataStr,
  decimalTrunc,
  units = "",
}: ComparisonPageProps) => {
  const monthlyDataArr = locations.map(
    (location) => location.data.monthly_data
  );
  const filteredMonthlyDataArr = monthlyDataArr.map(
    (data) => data[monthlyDataStr]
  );

  const annualDataArr = locations.map((location) => location.data.annual_data);
  const filteredAnnualDataArr = annualDataArr.map(
    (data) => data[annualDataStr]
  );

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
            {/* TODO the mui tables and colored square pass over the nav bar when scrolling */}
            {locations.map((location, index) => (
              <TableRow key={location.data.location_data.location}>
                <StyledTableCell
                  style={{
                    whiteSpace: "nowrap",
                    position: "relative",
                    paddingLeft: "10px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "10px",
                      height: "10px",
                      backgroundColor: LocationColors(1)[index],
                    }}
                  ></div>
                  {location.data.location_data.location}
                </StyledTableCell>

                {filteredMonthlyDataArr[index].map(
                  (value: number, i: number) => (
                    <StyledTableCell key={i}>
                      {value % 1 === 0 ? 0 : value.toFixed(decimalTrunc)}
                    </StyledTableCell>
                  )
                )}
                <StyledTableCell style={{ whiteSpace: "nowrap" }}>
                  {filteredAnnualDataArr[index].toFixed(decimalTrunc) + units}
                </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <br />
    </div>
  );
};

export default ClimateTable;
