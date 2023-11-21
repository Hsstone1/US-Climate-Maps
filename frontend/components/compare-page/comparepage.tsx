import dynamic from "next/dynamic";

import { ClimateChartDataset, TimeGranularity } from "./climatecomparehelpers";
import { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import { MarkerType, LocationColors } from "../location-props";
import Table from "./comparepagetable";
import ClimateChartPaginate from "./climatechartpaginate";
import YearSelector from "./yearselector";
import LazyLoad from "react-lazyload";

//This is dynamic import function to load components that rely on
// browser-specific functionalities such as the window object:
const ClimateChart = dynamic(() => import("./climatechart"), { ssr: false });

type ComparisonPageProps = {
  locations: MarkerType[];
};

type YearlyData = {
  [locationId: string]: {
    [year: string]: any;
  };
};

const CHART_BORDER_WIDTH = 1.5;
//const LINE_TENSION = 0.35;
const LINE_TENSION = 0.5;
const LINE_ALPHA = 1;
const BACKGROUND_ALPHA = 0.04;
const PAGINATED_BACKGROUND_ALPHA = 0.5;
const HEADING_VARIANT = "h5";
const SMA_SMOOTH_DAYS = 30;
const LAZY_LOAD_HEIGHT = 300;
const LAZY_LOAD_OFFSET = 0;
const DO_LAZY_LOAD_ONCE = false;

let apiUrl = process.env.NEXT_PUBLIC_API_URL;

//These values are not graphed for the select year data, as they do not change year to year
const excludeFromHistorical = new Set([
  "GROWING_CHANCE",
  "EXPECTED_MAX",
  "EXPECTED_MIN",
  "APPARENT_EXPECTED_MAX",
  "APPARENT_EXPECTED_MIN",
  "RECORD_HIGH",
  "RECORD_LOW",
  "SUN_ANGLE",
]);

export default function ComparisonPage({ locations }: ComparisonPageProps) {
  const [selectedYear, setSelectedYear] = useState<string>("Annual");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [locationsWithYearlyData, setLocationsWithYearlyData] =
    useState(locations);
  const [yearlyData, setYearlyData] = useState<YearlyData>({});

  const [xAxisRangeState, setXAxisRangeState] = useState({
    minX: 0,
    maxX: 365,
  });

  const handleXAxisRangeChange = useCallback((newState) => {
    setXAxisRangeState((prevState) => {
      if (
        newState.minX !== prevState.minX ||
        newState.maxX !== prevState.maxX
      ) {
        return newState;
      }
      return prevState; // Return same reference if no change
    });
  }, []);

  // Function to extract climate data based on a key and time range, like daily, monthly, annual
  const extractClimateData = (
    key: string | number,
    TimeGranularity: string | number
  ) => {
    return locations.map(
      (location) => location.data.climate_data[key][TimeGranularity]
    );
  };

  const fetchYearData = useCallback(
    async (location: any, year: any) => {
      // Avoid refetching if data already exists
      if (yearlyData[location.id] && yearlyData[location.id][year]) {
        return;
      }

      try {
        const response = await fetch(apiUrl + `/climate_data_db_year`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            latitude: location.lat,
            longitude: location.lng,
            elevation: location.data.location_data.elevation,
            year: year,
          }),
        });

        const climateData = await response.json();

        // Append the fetched data to the correct location in the state
        setYearlyData((prevData: YearlyData) => {
          // Get the existing data for this location, or an empty object if none exists
          const existingLocationData = prevData[location.id] || {};

          // add the new data for this location
          const updatedLocationData = {
            ...existingLocationData,
            [year]: climateData,
          };

          // Return the new state with the updated data for this location
          return {
            ...prevData,
            [location.id]: updatedLocationData,
          };
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    },
    [yearlyData]
  );

  // Fetch the yearly data for the selected year and location when they change
  useEffect(() => {
    const location = locations[currentIndex];

    if (selectedYear !== "Annual") {
      fetchYearData(location, selectedYear);
    }
  }, [selectedYear, currentIndex, locations, fetchYearData]);

  const annualTemperatureDataset = useMemo(() => {
    return temperature_dataset(locations, undefined, selectedYear, yearlyData);
  }, [locations, selectedYear, yearlyData]);

  const paginatedTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      temperature_dataset([location], index, selectedYear, yearlyData, true)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualApparentTemperatureDataset = useMemo(() => {
    return apparent_temperature_dataset(
      locations,
      undefined,
      selectedYear,
      yearlyData
    );
  }, [locations, selectedYear, yearlyData]);

  const paginatedApparentTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      apparent_temperature_dataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        true
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualComfortDataset = useMemo(() => {
    return comfort_index_dataset(
      locations,
      undefined,
      selectedYear,
      yearlyData
    );
  }, [locations, selectedYear, yearlyData]);

  const paginatedComfortDataset = useMemo(() => {
    return locations.map((location, index) =>
      comfort_index_dataset([location], index, selectedYear, yearlyData)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualPrecipDataset = useMemo(() => {
    return precip_dataset(locations, undefined, selectedYear, yearlyData);
  }, [locations, selectedYear, yearlyData]);

  const paginatedPrecipDataset = useMemo(() => {
    return locations.map((location, index) =>
      precip_dataset([location], index, selectedYear, yearlyData)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualSnowDataset = useMemo(() => {
    return snow_dataset(locations, undefined, selectedYear, yearlyData);
  }, [locations, selectedYear, yearlyData]);

  const paginatedSnowDataset = useMemo(() => {
    return locations.map((location, index) =>
      snow_dataset([location], index, selectedYear, yearlyData)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualHumidityDataset = useMemo(() => {
    return humidity_dataset(locations, undefined, selectedYear, yearlyData);
  }, [locations, selectedYear, yearlyData]);

  const paginatedHumidityDataset = useMemo(() => {
    return locations.map((location, index) =>
      humidity_dataset([location], index, selectedYear, yearlyData)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualDewpointDataset = useMemo(() => {
    return dewpoint_dataset(locations, undefined, selectedYear, yearlyData);
  }, [locations, selectedYear, yearlyData]);

  const paginatedDewpointDataset = useMemo(() => {
    return locations.map((location, index) =>
      dewpoint_dataset([location], index, selectedYear, yearlyData)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualWindDataset = useMemo(() => {
    return wind_dataset(locations, undefined, selectedYear, yearlyData);
  }, [locations, selectedYear, yearlyData]);

  const paginatedWindDataset = useMemo(() => {
    return locations.map((location, index) =>
      wind_dataset([location], index, selectedYear, yearlyData)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualSunshineDataset = useMemo(() => {
    return sunshine_dataset(locations, undefined, selectedYear, yearlyData);
  }, [locations, selectedYear, yearlyData]);

  const paginatedSunshineDataset = useMemo(() => {
    return locations.map((location, index) =>
      sunshine_dataset([location], index, selectedYear, yearlyData)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualUVIndexDataset = useMemo(() => {
    return uv_index_dataset(locations, undefined, selectedYear, yearlyData);
  }, [locations, selectedYear, yearlyData]);

  const paginatedUVIndexDataset = useMemo(() => {
    return locations.map((location, index) =>
      uv_index_dataset([location], index, selectedYear, yearlyData)
    );
  }, [locations, selectedYear, yearlyData]);

  const annualGrowingSeasonDataset = useMemo(() => {
    return growing_season_dataset(
      locations,
      undefined,
      selectedYear,
      yearlyData
    );
  }, [locations, selectedYear, yearlyData]);

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
              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualTemperatureDataset}
                    units={"°F"}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedTemperatureDataset}
                        units={"°F"}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>
              <p style={{ textAlign: "center" }}>
                Average high and low temperatures for each location. The
                expected temperature range is the faint area behind the line,
                which represents the highest and lowest temperatures likely for
                a day. The table contains the average high and low temperatures
                for each month.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Average High (°F)"
                  monthly_data={extractClimateData(
                    "high_temperature",
                    "monthly"
                  )}
                  annual_data={extractClimateData("high_temperature", "annual")}
                  numDec={0}
                  units={" °F"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Average Low (°F)"
                  monthly_data={extractClimateData(
                    "low_temperature",
                    "monthly"
                  )}
                  annual_data={extractClimateData("low_temperature", "annual")}
                  numDec={0}
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
              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualApparentTemperatureDataset}
                    units={"°F"}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedApparentTemperatureDataset}
                        units={"°F"}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average high and low feels-like temperatures for each location.
                The expected feels-like temperature range is the faint area
                behind the line, which represents the highest and lowest
                apparent temperatures likely for a day.The table contains the
                average high and low apparent temperatures for each month.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Apparent Average High (°F)"
                  monthly_data={extractClimateData(
                    "apparent_high_temperature",
                    "monthly"
                  )}
                  annual_data={extractClimateData(
                    "apparent_high_temperature",
                    "annual"
                  )}
                  numDec={0}
                  units={" °F"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Apparent Average Low (°F)"
                  monthly_data={extractClimateData(
                    "apparent_low_temperature",
                    "monthly"
                  )}
                  annual_data={extractClimateData(
                    "apparent_low_temperature",
                    "annual"
                  )}
                  numDec={0}
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
                {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                Precipitation
              </Typography>
              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualPrecipDataset}
                    units={"in"}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedPrecipDataset}
                        units={"in"}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average precipitation in inches for each location. Precipitation
                is the combined total water content of both rain and snow. A
                rainy day is counted if there is more than 0.01 inches of
                rainfall accumulation. The total number of rainy days expected
                for each month, along with the annual precipitation total are
                displayed in the table.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Total Precipitation"
                  monthly_data={extractClimateData("precipitation", "monthly")}
                  annual_data={extractClimateData("precipitation", "annual")}
                  numDec={1}
                  units={" in"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Total Rainy Days"
                  monthly_data={extractClimateData("precip_days", "monthly")}
                  annual_data={extractClimateData("precip_days", "annual")}
                  numDec={0}
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
              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualSnowDataset}
                    units={"in"}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedSnowDataset}
                        units={"in"}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average snowfall in inches for each location. A snowy day is
                counted if there is more than 0.1 inches of accumulation. The
                total number of snowy days expected for each month, along with
                the annual total are displayed in the table.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Total Snowfall"
                  monthly_data={extractClimateData("snow", "monthly")}
                  annual_data={extractClimateData("snow", "annual")}
                  numDec={1}
                  units={" in"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Total Snowy Days"
                  monthly_data={extractClimateData("snow_days", "monthly")}
                  annual_data={extractClimateData("snow_days", "annual")}
                  numDec={0}
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
                {selectedYear === "Annual" ? "Annual" : selectedYear} Afternoon
                Humidity
              </Typography>
              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualHumidityDataset}
                    units={"%"}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedHumidityDataset}
                        units={"%"}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average afternoon humidity for each location. In the afternoon
                when the tempearture is highest, the humidity will be the
                lowest. The opposite is the case in the morning. A humidity
                level below 30 percent is considered comfortable, and above 70
                percent is considered very humid. The table contains the average
                humidity for each month.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Average Humidity"
                  monthly_data={extractClimateData("mean_humidity", "monthly")}
                  annual_data={extractClimateData("mean_humidity", "annual")}
                  numDec={0}
                  units={" %"}
                ></Table>
                <Table
                  locations={locations}
                  heading="Morning Humidity"
                  monthly_data={extractClimateData(
                    "morning_humidity",
                    "monthly"
                  )}
                  annual_data={extractClimateData("morning_humidity", "annual")}
                  numDec={0}
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

              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualDewpointDataset}
                    units={"°F"}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedDewpointDataset}
                        units={"°F"}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average dewpoint for each location. The dewpoint is a measure of
                absolute humidity in the air, rather than the relative humidity
                percentage which changes with temperature. Dewpoint is generally
                a better metric for how humid it feels outside. Dewpoint values
                bellow 50 degrees are plesant, around 60 degrees begins to feel
                humid, 70 degrees feels muggy, and above 75 feels oppressive.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Average Dewpoint"
                  monthly_data={extractClimateData("dewpoint", "monthly")}
                  annual_data={extractClimateData("dewpoint", "annual")}
                  numDec={0}
                  units={" °F"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Total Muggy Days"
                  monthly_data={extractClimateData(
                    "dewpoint_muggy_days",
                    "monthly"
                  )}
                  annual_data={extractClimateData(
                    "dewpoint_muggy_days",
                    "annual"
                  )}
                  numDec={0}
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

              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualWindDataset}
                    units={"mph"}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedWindDataset}
                        units={"mph"}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average wind speed for each location. The expected wind gust
                peak for each location is the faint line.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Average Wind Speed"
                  monthly_data={extractClimateData("wind", "monthly")}
                  annual_data={extractClimateData("wind", "annual")}
                  numDec={0}
                  units={" mph"}
                ></Table>

                {
                  <Table
                    locations={locations}
                    heading="Average Wind Gust"
                    monthly_data={extractClimateData("wind_gust", "monthly")}
                    annual_data={extractClimateData("wind_gust", "annual")}
                    numDec={0}
                    units={" mph"}
                  ></Table>
                }
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

              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualSunshineDataset}
                    units={"%"}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedSunshineDataset}
                        units={"%"}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Percentage of sunshine for each location. A day is considered to
                be sunny if the sun is out more than 70% of each day, Partly
                Cloudy if its out for more than 40%, and Cloudy if less.The
                total number of sunny days expected for each month, along with
                the annual total are displayed in the table.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Total Sunny Days"
                  monthly_data={extractClimateData("clear_days", "monthly")}
                  annual_data={extractClimateData("clear_days", "annual")}
                  numDec={0}
                  units={" days"}
                ></Table>
                <Table
                  locations={locations}
                  heading="Total Party Cloudy Days"
                  monthly_data={extractClimateData(
                    "partly_cloudy_days",
                    "monthly"
                  )}
                  annual_data={extractClimateData(
                    "partly_cloudy_days",
                    "annual"
                  )}
                  numDec={0}
                  units={" days"}
                ></Table>
                <Table
                  locations={locations}
                  heading="Total Cloudy Days"
                  monthly_data={extractClimateData("cloudy_days", "monthly")}
                  annual_data={extractClimateData("cloudy_days", "annual")}
                  numDec={0}
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
              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualUVIndexDataset}
                    units={""}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedUVIndexDataset}
                        year={parseInt(selectedYear)}
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average UV Index for each location. The UV index is a measure of
                the strength of the suns ultraviolet rays. The UV index is
                highest in the summer and lowest in the winter. Elevation also
                increases the UV index, so on mountain peaks the sun is often
                stronger.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Monthly UV Index"
                  monthly_data={extractClimateData("uv_index", "monthly")}
                  annual_data={extractClimateData("uv_index", "annual")}
                  numDec={0}
                  units={""}
                ></Table>

                <Table
                  locations={locations}
                  heading="Monthly Sun Angle"
                  monthly_data={extractClimateData("sun_angle", "monthly")}
                  annual_data={extractClimateData("sun_angle", "annual")}
                  numDec={0}
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
                {selectedYear === "Annual" ? "Annual" : selectedYear} Comfort
                Rating
              </Typography>
              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualComfortDataset}
                    units={""}
                    xAxisRangeState={xAxisRangeState}
                    onXAxisRangeChange={handleXAxisRangeChange}
                  />
                ) : (
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateChartRenderer
                        index={index}
                        data={paginatedComfortDataset}
                        year={parseInt(selectedYear)}
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average comfort rating for each location. The comfort rating is
                a function of temperature, humidity, and amount of sun. The
                higher the comfort rating, the more pleasant the weather is. A
                comfort rating lower than 50 is very harsh, and largely
                unsuitable for normal life. A rating over 90 is considered very
                ideal, usally accompanied with plentiful sunshine, low humidity
                and warm temperatures.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Comfort Rating"
                  monthly_data={extractClimateData("comfort_index", "monthly")}
                  annual_data={extractClimateData("comfort_index", "annual")}
                  numDec={0}
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
                Annual Growing Season
              </Typography>
              <LazyLoad
                height={LAZY_LOAD_HEIGHT}
                offset={LAZY_LOAD_OFFSET}
                once={DO_LAZY_LOAD_ONCE}
              >
                <ClimateChart
                  datasetProp={annualGrowingSeasonDataset}
                  units={"%"}
                  year={
                    selectedYear === "Annual" ? 2023 : parseInt(selectedYear)
                  }
                  xAxisRangeState={xAxisRangeState}
                  onXAxisRangeChange={handleXAxisRangeChange}
                />
              </LazyLoad>

              <p style={{ textAlign: "center" }}>
                Average span between freezing temperatures, known as the growing
                season. The table contains the monthly Cooling Degree Days (CDD)
                Heating Degree Days (HDD), and chance of frost in the morning.
                Cooling degree days are a measure of how much cooling is needed,
                based on the duration the average temperature is above 65°F.
                Heating degree days are the opposite. HDD and CDD are a good
                measure in how severe a season is, and can translate into higher
                utility bills. Frost is likely when the temperature is below 32
                degrees, with high humidity, which often occurs in the morning.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading="Chance of Frost"
                  monthly_data={extractClimateData(
                    "morning_frost_chance",
                    "monthly"
                  )}
                  annual_data={extractClimateData(
                    "morning_frost_chance",
                    "annual"
                  )}
                  numDec={0}
                  units={" %"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Cooling Degree Days (CDD)"
                  monthly_data={extractClimateData("cdd", "monthly")}
                  annual_data={extractClimateData("cdd", "annual")}
                  numDec={0}
                  units={""}
                ></Table>

                <Table
                  locations={locations}
                  heading="Heating Degree Days (HDD)"
                  monthly_data={extractClimateData("hdd", "monthly")}
                  annual_data={extractClimateData("hdd", "annual")}
                  numDec={0}
                  units={""}
                ></Table>
              </div>
              <br />
              <br />
            </div>
          </div>
        )}
      </div>
      <div className="year-selector-footer">
        <YearSelector onYearChange={setSelectedYear} />
      </div>
    </div>
  );
}

const ClimateChartRenderer: React.FC<{
  index: number;
  data: any[]; // Replace 'any[]' with the appropriate type for your dataset if known.
  units?: string;
  title?: string;
  year?: number;
  xAxisRangeState: { minX: number; maxX: number };
  onXAxisRangeChange: (newState: { minX: number; maxX: number }) => void;
}> = ({
  index,
  data,
  units = "",
  title = "",
  year = 2023,
  xAxisRangeState,
  onXAxisRangeChange,
}) => {
  if (index < 0 || index >= data.length) {
    return null;
  }
  return (
    <ClimateChart
      datasetProp={data[index]}
      units={units}
      title={title}
      year={year}
      xAxisRangeState={xAxisRangeState}
      onXAxisRangeChange={onXAxisRangeChange}
    />
  );
};

const get_climate_data = (
  location: any,
  key: string,
  time_granularity: TimeGranularity,
  selectedYear: "Annual" | string,
  yearlyData: null | any,
  options: { multiplyByVal?: number; windowSize?: number } = {}
) => {
  const { multiplyByVal = 1, windowSize } = options;

  //TODO this might crash if the key is missing, likely in expected_min and max
  let rawData;
  if (selectedYear !== "Annual" && yearlyData?.[location.id]?.[selectedYear]) {
    rawData =
      yearlyData[location.id][selectedYear].climate_data[key][time_granularity];
  } else {
    rawData = location.data.climate_data[key][time_granularity];
  }
  rawData = rawData.map((val: number) => val * multiplyByVal);

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
  selectedYear: string,
  yearlyData: any,
  isBarChart: boolean = false
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: MarkerType, index) => {
    // Use the selectedIndex if provided; otherwise, use the loop index
    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";
    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const border_width = isAnnual ? CHART_BORDER_WIDTH : 0;

    const max_dataset: ClimateChartDataset = {
      type: "line",
      label: location_name + " Max",
      data: get_climate_data(
        location,
        "expected_max",
        "daily",
        "Annual",
        null,
        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: background_color,
      borderColor: paginated_background_color,
      borderWidth: CHART_BORDER_WIDTH / 2,

      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,

      fill: isBarChart ? "+1" : "+2",
      //fill: false,
      yAxisID: "Temperature",
    };

    const high_dataset: ClimateChartDataset = {
      type: isBarChart ? "bar" : "line",
      label: location_name + " High",
      data: get_climate_data(
        location,
        "high_temperature",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: isAnnual ? background_color : paginated_background_color,
      borderColor: color,
      borderWidth: border_width,

      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "+1",
      yAxisID: "Temperature",
    };

    const low_dataset: ClimateChartDataset = {
      type: isBarChart ? "bar" : "line",
      label: location_name + " Low",
      data: get_climate_data(
        location,
        "low_temperature",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: isAnnual ? background_color : paginated_background_color,
      borderColor: color,
      borderWidth: border_width,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "-1",
      yAxisID: "Temperature",
    };

    const min_dataset: ClimateChartDataset = {
      type: "line",
      label: location_name + " Min ",
      data: get_climate_data(
        location,
        "expected_min",
        "daily",
        "Annual",
        null,
        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: background_color,
      borderColor: paginated_background_color,
      borderWidth: CHART_BORDER_WIDTH / 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isBarChart ? "-1" : "-2",
      //fill: false,

      yAxisID: "Temperature",
    };

    datasets.push(max_dataset, high_dataset, low_dataset, min_dataset);
  });

  return datasets;
};

const apparent_temperature_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any,
  isBarChart: boolean = false
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const border_width = isAnnual ? CHART_BORDER_WIDTH : 0;

    const max_dataset: ClimateChartDataset = {
      type: "line",
      label: location_name + " Max",
      data: get_climate_data(
        location,
        "apparent_expected_max",
        "daily",
        "Annual",
        null,
        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: background_color,
      borderColor: paginated_background_color,
      borderWidth: CHART_BORDER_WIDTH / 2,

      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isBarChart ? "+1" : "+2",
      yAxisID: "Temperature",
    };

    const high_dataset: ClimateChartDataset = {
      type: isBarChart ? "bar" : "line",
      label: location_name + " High",
      data: get_climate_data(
        location,
        "apparent_high_temperature",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: isAnnual ? background_color : paginated_background_color,
      borderColor: color,
      borderWidth: border_width,

      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "+1",
      yAxisID: "Temperature",
    };

    const low_dataset: ClimateChartDataset = {
      type: isBarChart ? "bar" : "line",
      label: location_name + " Low",
      data: get_climate_data(
        location,
        "apparent_low_temperature",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: isAnnual ? background_color : paginated_background_color,
      borderColor: color,
      borderWidth: border_width,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: "-1",
      yAxisID: "Temperature",
    };

    const min_dataset: ClimateChartDataset = {
      type: "line",
      label: location_name + " Min ",
      data: get_climate_data(
        location,
        "apparent_expected_min",
        "daily",
        "Annual",
        null,
        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: background_color,
      borderColor: paginated_background_color,
      borderWidth: CHART_BORDER_WIDTH / 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isBarChart ? "-1" : "-2",
      yAxisID: "Temperature",
    };

    datasets.push(max_dataset, high_dataset, low_dataset, min_dataset);
  });

  return datasets;
};

const precip_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = isAnnual ? CHART_BORDER_WIDTH : 0;

    const avg: ClimateChartDataset = {
      type: "line",
      label: location_name + " Avg",
      data: get_climate_data(
        location,
        "precipitation",
        "daily",
        "Annual",
        null,
        {
          multiplyByVal: 30,
          windowSize: SMA_SMOOTH_DAYS * 2,
        }
      ),
      backgroundColor: background_color,
      borderColor: isAnnual ? color : paginated_background_color,
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isAnnual ? true : false,
      yAxisID: "Precip",
    };

    datasets.push(avg);

    // Dataset for historical values
    const historical: ClimateChartDataset = {
      type: "line",
      label: location_name + " Act",
      data: get_climate_data(
        location,
        "precipitation",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS * 2,
        }
      ),
      backgroundColor: paginated_background_color,
      borderColor: paginated_background_color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Precip",
    };

    if (selectedYear !== "Annual") {
      datasets.push(historical);
    }
  });
  return datasets;
};

const snow_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = isAnnual ? CHART_BORDER_WIDTH : 0;

    const avg: ClimateChartDataset = {
      type: "line",
      label: location_name + " Avg",
      data: get_climate_data(location, "snow", "daily", "Annual", null, {
        multiplyByVal: 30,
        windowSize: SMA_SMOOTH_DAYS * 2,
      }),
      backgroundColor: background_color,
      borderColor: isAnnual ? color : paginated_background_color,
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isAnnual ? true : false,
      yAxisID: "Precip",
    };

    datasets.push(avg);

    // Dataset for historical values
    const historical: ClimateChartDataset = {
      type: "line",
      label: location_name + " Act",
      data: get_climate_data(
        location,
        "snow",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS * 2,
        }
      ),
      backgroundColor: paginated_background_color,
      borderColor: paginated_background_color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Precip",
    };

    if (!isAnnual) {
      datasets.push(historical);
    }
  });
  return datasets;
};

const humidity_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = isAnnual ? CHART_BORDER_WIDTH : 0;

    const avg: ClimateChartDataset = {
      type: "line",
      label: location_name + " Avg",
      data: get_climate_data(
        location,
        "afternoon_humidity",
        "daily",
        "Annual",
        null,
        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: background_color,
      borderColor: isAnnual ? color : paginated_background_color,
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isAnnual ? true : false,
      yAxisID: "Percentage",
    };

    datasets.push(avg);

    const historical: ClimateChartDataset = {
      type: "line",
      label: location_name + " Act",
      data: get_climate_data(
        location,
        "afternoon_humidity",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: paginated_background_color,
      borderColor: paginated_background_color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Percentage",
    };

    if (!isAnnual) {
      datasets.push(historical);
    }
  });
  return datasets;
};

const dewpoint_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //    const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = isAnnual ? CHART_BORDER_WIDTH : 0;

    const avg: ClimateChartDataset = {
      type: "line",
      label: location_name + " Avg",
      data: get_climate_data(location, "dewpoint", "daily", "Annual", null, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
      backgroundColor: background_color,
      borderColor: isAnnual ? color : paginated_background_color,
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isAnnual
        ? {
            target: "start", // Fills towards the end of the scale
            above: background_color, // Color above the data line
            below: background_color, // Color below the data line
          }
        : false,
      yAxisID: "Dewpoint",
    };

    datasets.push(avg);

    const historical: ClimateChartDataset = {
      type: "line",
      label: location_name + " Act",
      data: get_climate_data(
        location,
        "dewpoint",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: paginated_background_color,
      borderColor: paginated_background_color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: {
        target: "start", // Fills towards the end of the scale
        above: paginated_background_color, // Color above the data line
        below: paginated_background_color, // Color below the data line
      },
      yAxisID: "Dewpoint",
    };

    if (!isAnnual) {
      datasets.push(historical);
    }
  });

  return datasets;
};

const wind_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const background_color = isAnnual
      ? LocationColors(BACKGROUND_ALPHA)[colorIndex]
      : LocationColors(PAGINATED_BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = isAnnual ? CHART_BORDER_WIDTH : 0;

    const wind_dataset: ClimateChartDataset = {
      type: "line",
      label: location_name + " Avg ",
      data: get_climate_data(
        location,
        "wind",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),

      backgroundColor: background_color,
      borderColor: color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Wind",
    };

    const max_wind_dataset: ClimateChartDataset = {
      type: "line",
      label: location_name + " Max",
      data: get_climate_data(
        location,
        "wind_gust",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),

      backgroundColor: background_color,
      borderColor: background_color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Wind",
    };

    datasets.push(wind_dataset, max_wind_dataset);

    datasets.push(wind_dataset);
  });

  return datasets;
};

const sunshine_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = isAnnual ? CHART_BORDER_WIDTH : 0;

    const avg: ClimateChartDataset = {
      type: "line",
      label: location_name + " Avg",
      data: get_climate_data(location, "sun", "daily", "Annual", null, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
      backgroundColor: background_color,
      borderColor: isAnnual ? color : paginated_background_color,
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isAnnual ? true : false,
      yAxisID: "Percentage",
    };

    datasets.push(avg);

    const historical: ClimateChartDataset = {
      type: "line",
      label: location_name + " Act",
      data: get_climate_data(
        location,
        "sun",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: paginated_background_color,
      borderColor: paginated_background_color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Percentage",
    };

    if (!isAnnual) {
      datasets.push(historical);
    }
  });

  return datasets;
};

const uv_index_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];

  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = isAnnual ? CHART_BORDER_WIDTH : 0;

    const avg: ClimateChartDataset = {
      type: "line",
      label: location_name + " Avg",
      data: get_climate_data(location, "uv_index", "daily", "Annual", null, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
      backgroundColor: background_color,
      borderColor: isAnnual ? color : paginated_background_color,
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isAnnual ? true : false,
      yAxisID: "UV_Index",
    };

    datasets.push(avg);

    const historical: ClimateChartDataset = {
      type: "line",
      label: location_name + " Act",
      data: get_climate_data(
        location,
        "uv_index",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: paginated_background_color,
      borderColor: paginated_background_color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "UV_Index",
    };

    if (!isAnnual) {
      datasets.push(historical);
    }
  });

  return datasets;
};

const comfort_index_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = isAnnual ? CHART_BORDER_WIDTH : 0;

    const avg: ClimateChartDataset = {
      type: "line",
      label: location_name + " Avg",
      data: get_climate_data(
        location,
        "comfort_index",
        "daily",
        "Annual",
        null,
        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: background_color,
      borderColor: isAnnual ? color : paginated_background_color,
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: isAnnual ? true : false,
      yAxisID: "Comfort_Index",
    };

    datasets.push(avg);

    const historical: ClimateChartDataset = {
      type: "line",
      label: location_name + " Act",
      data: get_climate_data(
        location,
        "comfort_index",
        "daily",
        selectedYear,
        yearlyData,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: paginated_background_color,
      borderColor: paginated_background_color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Comfort_Index",
    };

    if (!isAnnual) {
      datasets.push(historical);
    }
  });

  return datasets;
};

const growing_season_dataset = (
  locations: MarkerType[],
  selectedIndex: number | undefined,
  selectedYear: string,
  yearlyData: any
): ClimateChartDataset[] => {
  const datasets: ClimateChartDataset[] = [];
  locations.forEach((location: MarkerType, index) => {
    const isAnnual = selectedYear === "Annual";
    //const location_name = isAnnual ? location.data.location_data.location : "";
    const location_name = "";

    const colorIndex =
      typeof selectedIndex !== "undefined" ? selectedIndex : index;

    const color = LocationColors(LINE_ALPHA)[colorIndex];
    const paginated_background_color = LocationColors(
      PAGINATED_BACKGROUND_ALPHA
    )[colorIndex];
    const background_color = LocationColors(BACKGROUND_ALPHA)[colorIndex];
    const borderWidth = CHART_BORDER_WIDTH;

    const avg: ClimateChartDataset = {
      type: "line",
      label: location_name + " Growing",
      data: get_climate_data(
        location,
        "growing_season",
        "daily",
        "Annual",
        null,

        {
          multiplyByVal: 1,
          windowSize: SMA_SMOOTH_DAYS,
        }
      ),
      backgroundColor: background_color,
      borderColor: color,
      borderWidth: borderWidth,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Percentage",
    };

    datasets.push(avg);
  });

  return datasets;
};
