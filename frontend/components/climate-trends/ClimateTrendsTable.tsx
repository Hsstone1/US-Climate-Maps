import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { MonthLabels } from "../climate-chart/climate-chart-helpers";
import { ColorScaleBar } from "../compare-page/ColorScaleBar";
import { LocationColors, MarkerType } from "../global-utils";
import Typography from "@mui/material/Typography";
import { ThemeColor, interpolateColor } from "../data-value-colors";

type ClimateTrendsPageProps = {
  locations: MarkerType[];
  heading: string;
  data: any;
  numDec?: number;
  units?: string;
  averageKey: string;
  isLoading?: boolean;
  colorPercentDev?: number;
};

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    border: `1px solid ${ThemeColor}`,
    backgroundColor: ThemeColor,
    margin: "0px",
    padding: "0px",
    textAlign: "center",
    color: "#FFFFFF",
  },
  [`&.${tableCellClasses.body}`]: {
    border: `1px solid ${ThemeColor}`,
    margin: "0px",
    padding: "0px",

    textAlign: "center",
  },

  "@media screen and (max-width: 768px)": {
    fontSize: "0.6em", // Smaller text on small screens
    // Adjust the font size of children elements
  },
}));

const ClimateTable = ({
  locations,
  heading,
  data,
  numDec = 0,
  units = "",
  averageKey,
  isLoading = false,
  colorPercentDev = 50,
}: ClimateTrendsPageProps) => {
  const selectedYear = heading.split(" ")[0];

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
                <StyledTableCell>Tempearture</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((location, locIndex) => {
                const average_annual =
                  location.data.climate_data[averageKey]["annual"];

                return (
                  <TableRow key={location.data.location_data.location}>
                    <StyledTableCell
                      style={{
                        whiteSpace: "nowrap",
                        position: "relative",
                        paddingLeft: "1em",
                        paddingRight: "1em",
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

                    {data.map((value: any, i: any) => {
                      return (
                        <StyledTableCell key={i}>
                          <div>{`${
                            value === 0
                              ? value.toFixed(0)
                              : value.toFixed(numDec)
                          }${units}`}</div>
                        </StyledTableCell>
                      );
                    })}
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
