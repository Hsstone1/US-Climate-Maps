import dynamic from "next/dynamic";

import { ClimateChartDataset } from "./comparepageprops";
import { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import { MarkerType, LocationColors } from "../export-props";
//import ClimateChart from "./climatechart";
import Table from "./comparepagetable";
import ClimateChartPaginate from "../climate-table/climatechartpaginate";
import YearSelector from "../historical-weather/yearselector";
import { useZoom } from "./zoomcontext";

//This is dynamic import function to load components that rely on browser-specific functionalities such as the window object:
const ClimateChart = dynamic(() => import("./climatechart"), { ssr: false });

type ComparisonPageProps = {
  locations: MarkerType[];
};

const CHART_BORDER_WIDTH = 2;
//const LINE_TENSION = 0.35;
const LINE_TENSION = 0;
const LINE_ALPHA = 1;
const BACKGROUND_ALPHA = 0.05;
const HEADING_VARIANT = "h5";
const SMA_SMOOTH_DAYS = 30;

//These values are not graphed for the select year data, as they do not change year to year
const excludeFromHistorical = new Set([
  "GROWING_CHANCE",
  "EXPECTED_MAX",
  "EXPECTED_MIN",
  "RECORD_HIGH",
  "RECORD_LOW",
  "SUN_ANGLE",
]);

export default function ComparisonPage({ locations }: ComparisonPageProps) {
  const [selectedYear, setSelectedYear] = useState<string>("Annual");
  const [currentIndex, setCurrentIndex] = useState(0);
  const { zoomLevel } = useZoom();

  useEffect(() => {
    console.log("ComparisonPage: useEffect: RE RENDER: ", zoomLevel);
  }, [zoomLevel]);

  const annualTemperatureDataset = useMemo(() => {
    return temperature_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      temperature_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualApparentTemperatureDataset = useMemo(() => {
    return apparent_temperature_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedApparentTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      apparent_temperature_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualTemperatureRangeDataset = useMemo(() => {
    return temperature_range_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const annualComfortDataset = useMemo(() => {
    return comfort_index_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedComfortDataset = useMemo(() => {
    return locations.map((location, index) =>
      comfort_index_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualPrecipDataset = useMemo(() => {
    return precip_dataset(locations, 30, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedPrecipDataset = useMemo(() => {
    return locations.map((location, index) =>
      precip_dataset([location], 1, index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualSnowDataset = useMemo(() => {
    return snow_dataset(locations, 30, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedSnowDataset = useMemo(() => {
    return locations.map((location, index) =>
      snow_dataset([location], 1, index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualHumidityDataset = useMemo(() => {
    return humidity_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedHumidityDataset = useMemo(() => {
    return locations.map((location, index) =>
      humidity_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualDewpointDataset = useMemo(() => {
    return dewpoint_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedDewpointDataset = useMemo(() => {
    return locations.map((location, index) =>
      dewpoint_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualWindDataset = useMemo(() => {
    return wind_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedWindDataset = useMemo(() => {
    return locations.map((location, index) =>
      wind_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualSunshineDataset = useMemo(() => {
    return sunshine_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedSunshineDataset = useMemo(() => {
    return locations.map((location, index) =>
      sunshine_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualUVIndexDataset = useMemo(() => {
    return uv_index_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedUVIndexDataset = useMemo(() => {
    return locations.map((location, index) =>
      uv_index_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualSunAngleDataset = useMemo(() => {
    return sun_angle_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const annualGrowingSeasonDataset = useMemo(() => {
    return growing_season_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  return (
    <div className="compare-page">
      <div className="compare-page-scroll">
        {locations.length === 0 ? (
          <h3 style={{ textAlign: "center" }}>
            Add a location to view a comparison.
          </h3>
        ) : (
          <div>
            <div className="compare_chart-div">
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} High and
                Low Temperatures
              </Typography>
              {selectedYear === "Annual" ? (
                <ClimateChart
                  datasetProp={annualTemperatureDataset}
                  units={"°F"}
                />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedTemperatureDataset[index]}
                      units={"°F"}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                Average monthly high and low temperatures for each location.
              </p>
              <div>
                {/* Change this to be the difference between the aparent temperature and normal between high and low*/}
                <Table
                  locations={locations}
                  heading="Average High (°F)"
                  monthlyDataKey={"HIGH_AVG"}
                  annualDataKey={"HIGH_AVG"}
                  decimalTrunc={0}
                  units={" °F"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Average Low (°F)"
                  monthlyDataKey={"LOW_AVG"}
                  annualDataKey={"LOW_AVG"}
                  decimalTrunc={0}
                  units={" °F"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />

              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Apparent
                High and Low Temperatures
              </Typography>
              {selectedYear === "Annual" ? (
                <ClimateChart
                  datasetProp={annualApparentTemperatureDataset}
                  units={"°F"}
                />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedApparentTemperatureDataset[index]}
                      units={"°F"}
                    />
                  )}
                </ClimateChartPaginate>
              )}

              <p style={{ textAlign: "center" }}>
                Average monthly apparent high and low temperatures for each
                location. The apparent temperature changes which can change
                based on humidity and wind speed, which can make it feel warmer
                or cooler than the actual temperature.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Apparent Average High (°F)"
                  monthlyDataKey={"APPARENT_HIGH_AVG"}
                  annualDataKey={"APPARENT_HIGH_AVG"}
                  decimalTrunc={0}
                  units={" °F"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Apparent Average Low (°F)"
                  monthlyDataKey={"APPARENT_LOW_AVG"}
                  annualDataKey={"APPARENT_LOW_AVG"}
                  decimalTrunc={0}
                  units={" °F"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              {/*}
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                Annual Temperature Ranges
              </Typography>

              <ClimateChart
                datasetProp={annualTemperatureRangeDataset}
                units={"°F"}
              />

              <p style={{ textAlign: "center" }}>
                Average monthly high and low temperature ranges for each
                location. This is the expected maximum and minimum for each day
                of the year
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Record High (°F)"
                  monthlyDataKey={"RECORD_HIGH"}
                  annualDataKey={"RECORD_HIGH"}
                  decimalTrunc={0}
                  units={" °F"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Record Low (°F)"
                  monthlyDataKey={"RECORD_LOW"}
                  annualDataKey={"RECORD_LOW"}
                  decimalTrunc={0}
                  units={" °F"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Comfort
                Rating
              </Typography>
              {selectedYear === "Annual" ? (
                <ClimateChart datasetProp={annualComfortDataset} units={""} />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedComfortDataset[index]}
                      units={""}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                Average comfort rating for each month. The comfort rating is a
                function of temperature, humidity, amount of sun. The higher the
                comfort rating, the more pleasant the weather is. A comfort
                rating lower than 50 is very harsh, and largely unsuitable for
                normal life. A rating over 90 is considered very ideal, usally
                accompanied with plentiful sunshine, low humidity and warm
                temperatures.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Comfort Rating"
                  monthlyDataKey={"COMFORT_INDEX"}
                  annualDataKey={"COMFORT_INDEX"}
                  decimalTrunc={0}
                  units={""}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />

              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Rainfall
              </Typography>
              {selectedYear === "Annual" ? (
                <ClimateChart datasetProp={annualPrecipDataset} units={"in"} />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedPrecipDataset[index]}
                      units={"in"}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                Rainfall in inches for each month. The total number of rainy
                days expected for each month, along with the annual total are
                displayed in the table. A rainy day is counted if there is more
                than 0.01 inches of accumulation.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Total Rainfall"
                  monthlyDataKey={"PRECIP_AVG"}
                  annualDataKey={"PRECIP_AVG"}
                  decimalTrunc={1}
                  units={" in"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Total Rainy Days"
                  monthlyDataKey={"PRECIP_DAYS"}
                  annualDataKey={"PRECIP_DAYS"}
                  decimalTrunc={0}
                  units={" days"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Snowfall
              </Typography>
              {selectedYear === "Annual" ? (
                <ClimateChart datasetProp={annualSnowDataset} units={"in"} />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedSnowDataset[index]}
                      units={"in"}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                Snowfall in inches for each month. The total number of snowy
                days expected for each month, along with the annual total are
                displayed in the table. A snowy day is counted if there is more
                than 0.1 inches of accumulation.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Total Snowfall"
                  monthlyDataKey={"SNOW_AVG"}
                  annualDataKey={"SNOW_AVG"}
                  decimalTrunc={1}
                  units={" in"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Total Snowy Days"
                  monthlyDataKey={"SNOW_DAYS"}
                  annualDataKey={"SNOW_DAYS"}
                  decimalTrunc={0}
                  units={" days"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Humidity
                Range
              </Typography>
              {selectedYear === "Annual" ? (
                <ClimateChart datasetProp={annualHumidityDataset} units={"%"} />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedHumidityDataset[index]}
                      units={"%"}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                Average humidity range for each month. In the morning when the
                tempearture is lowest, the humidity will be highest. The
                opposite is the case in the afternoon. The humidity is measured
                in percentage. A humidity level below 30 percent is considered
                comfortable, and above 70 percent is considered very humid. The
                table contains the average humidity for each month, as well as
                the chance a morning will have frost. Frost is likely when the
                temperature is below 32 degrees, with high humidity.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Average Humidity"
                  monthlyDataKey={"HUMIDITY_AVG"}
                  annualDataKey={"HUMIDITY_AVG"}
                  decimalTrunc={0}
                  units={" %"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Chance of Frost"
                  monthlyDataKey={"MORNING_FROST_CHANCE"}
                  annualDataKey={"MORNING_FROST_CHANCE"}
                  decimalTrunc={0}
                  units={" %"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Dewpoint
              </Typography>

              {selectedYear === "Annual" ? (
                <ClimateChart
                  datasetProp={annualDewpointDataset}
                  units={"°F"}
                />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedDewpointDataset[index]}
                      units={"°F"}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                The dewpoint is a measure of absolute humidity in the air,
                rather than the relative humidity percentage which changes with
                temperature. Dewpoint values bellow 50 degrees are plesant,
                around 60 degrees begins to feel humid, 70 degrees is very
                muggy, and above 75 is extremely humid.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Average Dewpoint"
                  monthlyDataKey={"DEWPOINT_AVG"}
                  annualDataKey={"DEWPOINT_AVG"}
                  decimalTrunc={0}
                  units={" °F"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Total Muggy Days"
                  monthlyDataKey={"NUM_HIGH_DEWPOINT_DAYS"}
                  annualDataKey={"NUM_HIGH_DEWPOINT_DAYS"}
                  decimalTrunc={0}
                  units={" days"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Wind Speed
              </Typography>

              {selectedYear === "Annual" ? (
                <ClimateChart datasetProp={annualWindDataset} units={"mph"} />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedWindDataset[index]}
                      units={"mph"}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                Average wind speed for each month. The table contains the
                average wind speed for each month. The wind speed is measured in
                miles per hour.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Average Wind Speed"
                  monthlyDataKey={"WIND_AVG"}
                  annualDataKey={"WIND_AVG"}
                  decimalTrunc={0}
                  units={" mph"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Sunshine
                Percentage
              </Typography>
              {selectedYear === "Annual" ? (
                <ClimateChart datasetProp={annualSunshineDataset} units={"%"} />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedSunshineDataset[index]}
                      units={"%"}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                Percent possible sunshine for each month. The total number of
                sunny days expected for each month, along with the annual total
                are displayed in the table. A sunny day is counted if the sun is
                out more than 30% of each day.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Total Sunny Days"
                  monthlyDataKey={"SUNNY_DAYS"}
                  annualDataKey={"SUNNY_DAYS"}
                  decimalTrunc={0}
                  units={" days"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} UV Index
              </Typography>
              {selectedYear === "Annual" ? (
                <ClimateChart datasetProp={annualUVIndexDataset} units={""} />
              ) : (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <ClimateChart
                      datasetProp={paginatedUVIndexDataset[index]}
                      units={""}
                    />
                  )}
                </ClimateChartPaginate>
              )}
              <p style={{ textAlign: "center" }}>
                Average UV Index. The UV index is a measure of the strength of
                the sun's ultraviolet rays. The table contains the average UV
                index for each month. The UV index is highest in the summer and
                lowest in the winter.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Monthly UV Index"
                  monthlyDataKey={"UV_INDEX"}
                  annualDataKey={"UV_INDEX"}
                  decimalTrunc={0}
                  units={""}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                Annual Sun Angle
              </Typography>
              <ClimateChart
                datasetProp={annualSunAngleDataset}
                units={"°"}
              ></ClimateChart>
              <p style={{ textAlign: "center" }}>
                Average sun angle for each month. The sun angle is the angle of
                the sun above the horizon, measured at the highest point in the
                day. The table contains the average sun angle for each month.
                The sun angle is highest in the summer and lowest in the winter.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Monthly Sun Angle"
                  monthlyDataKey={"SUN_ANGLE"}
                  annualDataKey={"SUN_ANGLE"}
                  decimalTrunc={0}
                  units={"°"}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />

              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                Annual Growing Season
              </Typography>
              <ClimateChart
                datasetProp={annualGrowingSeasonDataset}
                units={"%"}
              />

              <p style={{ textAlign: "center" }}>
                Average frost free growing season. The table contains the
                monthly Cooling Degree Days (CDD) and Heating Degree Days (HDD).
                Cooling degree days are the number of degrees that a day's
                average temperature is above 65°F. Heating degree days are the
                number of degrees that a day's average temperature is below
                65°F. The total number of CDD and HDD for each month, along with
                the annual total are displayed in the table. These values are a
                metric in how severe a season is.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Cooling Degree Days (CDD)"
                  monthlyDataKey={"CDD"}
                  annualDataKey={"CDD"}
                  decimalTrunc={0}
                  units={""}
                ></Table>

                <Table
                  locations={locations}
                  heading="Heating Degree Days (HDD)"
                  monthlyDataKey={"HDD"}
                  annualDataKey={"HDD"}
                  decimalTrunc={0}
                  units={""}
                ></Table>
              </div>
              <br />
              <br />
               {*/}
            </div>
          </div>
        )}
      </div>
      <div className="year-selector-footer">
        {
          // Check if locations array has data
          locations && locations.length > 0 ? (
            <YearSelector
              historical={locations[0].data.climate_data.historical}
              onYearChange={setSelectedYear}
            />
          ) : (
            // Fallback UI: Display a message (or any other component) when no locations are available
            <p />
          )
        }
      </div>
    </div>
  );
}

// Append first index to end of array for chart
function appendFirstIndexToEnd(data: number[]): number[] {
  const newData = [...data];
  newData.push(data[0]);
  return newData;
}

const mapClimateData = (
  location: any,
  key: string,
  selectedYear: string,
  options: { multiplyByVal?: number; windowSize?: number } = {}
) => {
  const { multiplyByVal = 1, windowSize } = options;

  // This selects the average data for all years if the annual option is selected
  // Otherwise, it selects the data for the selected year
  //console.log(selectedYear);
  const rawData =
    selectedYear === "Annual" || excludeFromHistorical.has(key)
      ? location.data.climate_data.avg_daily.map(
          (day: { [key: string]: any }) => day[key] * multiplyByVal
        )
      : location.data.climate_data.historical[selectedYear].daily.map(
          (day: { [key: string]: any }) => day[key] * multiplyByVal
        );

  // SMA calculation to smooth the data
  const calculateSMA = (data: number[], window_size: number) => {
    let rollingAverages = [];

    // Determine how many data points should be taken before and after the current point
    let beforeAfterCount = Math.floor(window_size / 2);

    for (let i = 0; i < data.length; i++) {
      let start_index = i - beforeAfterCount;
      let end_index = i + beforeAfterCount + 1; // Include the current data point

      let validWindowData;
      if (start_index < 0 || end_index > data.length) {
        // If the window exceeds array bounds, we handle it by slicing the array differently
        // This step will depend on how you want to handle the boundaries (e.g., repeat, use available data, etc.)
        // Here's an example of using available data:
        validWindowData = data.slice(
          Math.max(0, start_index),
          Math.min(data.length, end_index)
        );
      } else {
        validWindowData = data.slice(start_index, end_index);
      }

      let validValues = validWindowData.filter((value) => value != null);

      if (validValues.length > 0) {
        let sum = validValues.reduce((a, b) => a + b, 0);
        let avg = sum / validValues.length;
        rollingAverages.push(avg);
      } else {
        rollingAverages.push(null); // No valid values in the window
      }
    }

    return rollingAverages;
  };
  // Only calculate the SMA if windowSize is provided and either:
  // 1. The selectedYear is "Annual", or
  // 2. The key is in the excludeFromHistorical set
  if (
    windowSize &&
    (selectedYear === "Annual" || excludeFromHistorical.has(key))
  ) {
    return calculateSMA(rawData, windowSize);
  }

  return rawData;
};

const temperature_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: MarkerType, index) => {
    // Use the selectedIndex if provided; otherwise, use the loop index
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];

    const high_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "HIGH_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),
      backgroundColor: background_color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,

      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "+1",
      yAxisID: "Temperature",
    };

    const low_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "LOW_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),
      backgroundColor: background_color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "-1",
      yAxisID: "Temperature",
    };

    datasets.push(high_dataset, low_dataset);
  });

  return datasets;
};

const apparent_temperature_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];

    const high_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "APPARENT_HIGH_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),
      backgroundColor: background_color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,

      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "+1",
      yAxisID: "Temperature",
    };

    const low_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "APPARENT_LOW_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),
      backgroundColor: background_color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "-1",
      yAxisID: "Temperature",
    };

    datasets.push(high_dataset, low_dataset);
  });

  return datasets;
};

const temperature_range_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];

    const max_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "EXPECTED_MAX", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),
      backgroundColor: background_color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,

      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "+1",
      yAxisID: "Temperature",
    };

    const min_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "EXPECTED_MIN", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),
      backgroundColor: background_color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "-1",
      yAxisID: "Temperature",
    };

    datasets.push(max_dataset, min_dataset);
  });

  return datasets;
};

const precip_dataset = (
  locations: MarkerType[],
  multiplier: number = 1,
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const precip: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "PRECIP_AVG", selectedYear, {
          multiplyByVal: multiplier,
          windowSize: SMA_SMOOTH_DAYS * 2,
        })
      ),

      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "Precip",
    };

    datasets.push(precip);
  });
  return datasets;
};

const snow_dataset = (
  locations: MarkerType[],
  multiplier: number = 1,
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const snow_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "SNOW_AVG", selectedYear, {
          multiplyByVal: multiplier,
          windowSize: SMA_SMOOTH_DAYS * 2,
        })
      ),

      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "Precip",
    };

    datasets.push(snow_dataset);
  });
  return datasets;
};

const humidity_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const morning_humidity_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "MORNING_HUMIDITY_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),

      backgroundColor: background_color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "+1",
      yAxisID: "Percentage",
    };

    const afternoon_humidity_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "AFTERNOON_HUMIDITY_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),

      backgroundColor: background_color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "-1",
      yAxisID: "Percentage",
    };

    datasets.push(morning_humidity_dataset, afternoon_humidity_dataset);
  });
  return datasets;
};

const dewpoint_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const dewpoint_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "DEWPOINT_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),

      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "Temperature",
    };

    datasets.push(dewpoint_dataset);
  });
  return datasets;
};

const wind_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const wind_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "WIND_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),

      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "Wind",
    };

    datasets.push(wind_dataset);
  });
  return datasets;
};

const sunshine_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const sunshine_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "SUNSHINE_AVG", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),

      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "Percentage",
    };

    datasets.push(sunshine_dataset);
  });
  return datasets;
};

const sun_angle_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const sun_angle: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "SUN_ANGLE", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),

      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "Sun_Angle",
    };

    datasets.push(sun_angle);
  });
  return datasets;
};

const uv_index_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const uv_index: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "UV_INDEX", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),

      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "UV_Index",
    };

    datasets.push(uv_index);
  });
  return datasets;
};

const comfort_index_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const comfort_index_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "COMFORT_INDEX", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),

      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "Comfort_Index",
    };

    datasets.push(comfort_index_dataset);
  });
  return datasets;
};

const growing_season_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const frostfree_dataset: ClimateChartDataset = {
      type: "line",
      label: location.data.location_data.location,
      data: appendFirstIndexToEnd(
        mapClimateData(location, "GROWING_CHANCE", selectedYear, {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        })
      ),
      backgroundColor: color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: false,
      yAxisID: "Percentage",
    };

    datasets.push(frostfree_dataset);
  });
  return datasets;
};
