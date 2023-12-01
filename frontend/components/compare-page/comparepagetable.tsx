import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { MonthLabels } from "./climate-chart-helpers";
import { ColorScaleBar } from "./ColorScaleBar";
import { LocationColors, MarkerType } from "../location-props";
import Typography from "@mui/material/Typography";

type ComparisonPageProps = {
  locations: MarkerType[];
  heading: string;
  monthly_data: any;
  annual_data: any;
  numDec?: number;
  units?: string;
  averageKey: string;
  isLoading?: boolean;
  colorPercentDev?: number;
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

// Helper function for color interpolation
const interpolateColor = (
  color1: { r: any; g: any; b: any },
  color2: { r: any; g: any; b: any },
  factor: number
) => {
  if (factor < 0) factor = 0;
  if (factor > 1) factor = 1;
  const result = {
    r: Math.round(color1.r + factor * (color2.r - color1.r)),
    g: Math.round(color1.g + factor * (color2.g - color1.g)),
    b: Math.round(color1.b + factor * (color2.b - color1.b)),
  };
  return result;
};

const ClimateTable = ({
  locations,
  heading,
  monthly_data,
  annual_data,
  numDec = 0,
  units = "",
  averageKey,
  isLoading = false,
  colorPercentDev = 50,
}: ComparisonPageProps) => {
  const selectedYear = heading.split(" ")[0];

  // This function returns a color for a given value based on the average value
  // and the percent deviation from the average. The color is interpolated
  // between red, white, and green for negative, neutral, and positive values respectively.

  // The colorPercentDev parameter defines the magnitude of the outer bounds of the red and green range.
  // So for example, if colorPercentDev is 50, then the red range is 50% to 100%
  // Then the green range is 100% to 200%
  const getColorForValue = (value: number, average: number) => {
    if (selectedYear === "Annual" && isLoading) {
      return "white";
    }

    // Define constants
    const COLOR_ALPHA = 1;
    const MIN_PERCENTAGE = -colorPercentDev; // 50% threshold
    const MAX_PERCENTAGE = colorPercentDev; // 200% threshold
    const NEUTRAL_PERCENTAGE = 0; // Neutral range (100%)

    const RED = { r: 139, g: 0, b: 0 }; // Dark red for lowest percent deviation
    const WHITE = { r: 255, g: 255, b: 255 }; // White for normal, no deviation
    const GREEN = { r: 0, g: 100, b: 0 }; // Dark green for highest percent deviation

    const percentageDifference = ((value - average) / average) * 100;

    let color;
    if (percentageDifference <= -NEUTRAL_PERCENTAGE) {
      // Interpolate between RED and WHITE for negative values outside neutral range
      color = interpolateColor(
        RED,
        WHITE,
        (percentageDifference - MIN_PERCENTAGE) /
          (-NEUTRAL_PERCENTAGE - MIN_PERCENTAGE)
      );
    } else if (percentageDifference >= NEUTRAL_PERCENTAGE) {
      // Interpolate between WHITE and GREEN for positive values outside neutral range
      color = interpolateColor(
        WHITE,
        GREEN,
        (percentageDifference - NEUTRAL_PERCENTAGE) /
          (MAX_PERCENTAGE - NEUTRAL_PERCENTAGE)
      );
    } else {
      // Neutral (white)
      color = WHITE;
    }

    return `rgba(${color.r}, ${color.g}, ${color.b}, ${COLOR_ALPHA})`;
  };

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
                const average_monthly =
                  location.data.climate_data[averageKey]["monthly"];
                const average_annual =
                  location.data.climate_data[averageKey]["annual"];
                const combined_average = [...average_monthly, average_annual];

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

                    {combinedData.map((value, i) => {
                      const deviation = value - combined_average[i];
                      const deviationText =
                        deviation >= 0
                          ? `(+${deviation.toFixed(numDec)}${units})`
                          : `(${deviation.toFixed(numDec)}${units})`;
                      const cellColor =
                        !isLoading && selectedYear !== "Annual"
                          ? getColorForValue(value, combined_average[i])
                          : "white";

                      return (
                        <StyledTableCell key={i} style={{ padding: "2px" }}>
                          <div>{`${value.toFixed(numDec)}${units}`}</div>

                          {selectedYear !== "Annual" && (
                            <div
                              style={{ color: cellColor, fontSize: "smaller" }}
                            >
                              {deviationText}
                            </div>
                          )}
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

      {selectedYear !== "Annual" && (
        <ColorScaleBar colorPercentDev={colorPercentDev} />
      )}

      <br />
    </div>
  );
};

export default ClimateTable;
