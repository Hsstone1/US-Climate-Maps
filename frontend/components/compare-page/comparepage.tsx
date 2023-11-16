import dynamic from "next/dynamic";

import { ClimateChartDataset } from "./climatecomparehelpers";
import { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import { MarkerType, LocationColors } from "../location-props";
//import ClimateChart from "./climatechart";
import Table from "./comparepagetable";
import ClimateChartPaginate from "./climatechartpaginate";
import YearSelector from "./yearselector";
import LazyLoad from "react-lazyload";

//This is dynamic import function to load components that rely on browser-specific functionalities such as the window object:
const ClimateChart = dynamic(() => import("./climatechart"), { ssr: false });

type ComparisonPageProps = {
  locations: MarkerType[];
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

  const [xAxisRangeState, setXAxisRangeState] = useState({
    minX: 0, // Initial minX
    maxX: 365, // Initial maxX
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

  const annualTemperatureDataset = useMemo(() => {
    return temperature_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      temperature_dataset([location], index, selectedYear, true)
    );
  }, [locations, selectedYear]);

  const annualApparentTemperatureDataset = useMemo(() => {
    return apparent_temperature_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedApparentTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      apparent_temperature_dataset([location], index, selectedYear, true)
    );
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
    return precip_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedPrecipDataset = useMemo(() => {
    return locations.map((location, index) =>
      precip_dataset([location], index, selectedYear)
    );
  }, [locations, selectedYear]);

  const annualSnowDataset = useMemo(() => {
    return snow_dataset(locations, undefined, selectedYear);
  }, [locations, selectedYear]);

  const paginatedSnowDataset = useMemo(() => {
    return locations.map((location, index) =>
      snow_dataset([location], index, selectedYear)
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
                  monthlyDataKey={"HUMIDITY_AVG"}
                  annualDataKey={"HUMIDITY_AVG"}
                  decimalTrunc={0}
                  units={" %"}
                ></Table>
                <Table
                  locations={locations}
                  heading="Morning Humidity"
                  monthlyDataKey={"MORNING_HUMIDITY_AVG"}
                  annualDataKey={"MORNING_HUMIDITY_AVG"}
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
                  monthlyDataKey={"WIND_AVG"}
                  annualDataKey={"WIND_AVG"}
                  decimalTrunc={0}
                  units={" mph"}
                ></Table>

                {
                  <Table
                    locations={locations}
                    heading="Average Wind Gust"
                    monthlyDataKey={"WIND_MAX"}
                    annualDataKey={"WIND_MAX"}
                    decimalTrunc={0}
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
                  monthlyDataKey={"SUNNY_DAYS"}
                  annualDataKey={"SUNNY_DAYS"}
                  decimalTrunc={0}
                  units={" days"}
                ></Table>
                <Table
                  locations={locations}
                  heading="Total Party Cloudy Days"
                  monthlyDataKey={"PARTLY_CLOUDY_DAYS"}
                  annualDataKey={"PARTLY_CLOUDY_DAYS"}
                  decimalTrunc={0}
                  units={" days"}
                ></Table>
                <Table
                  locations={locations}
                  heading="Total Cloudy Days"
                  monthlyDataKey={"CLOUDY_DAYS"}
                  annualDataKey={"CLOUDY_DAYS"}
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
                  monthlyDataKey={"UV_INDEX"}
                  annualDataKey={"UV_INDEX"}
                  decimalTrunc={0}
                  units={""}
                ></Table>

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
                  monthlyDataKey={"MORNING_FROST_CHANCE"}
                  annualDataKey={"MORNING_FROST_CHANCE"}
                  decimalTrunc={0}
                  units={" %"}
                ></Table>

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
  selectedYear: string,
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
      data: mapClimateData(location, "EXPECTED_MAX", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
      data: mapClimateData(location, "HIGH_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
      data: mapClimateData(location, "LOW_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
      data: mapClimateData(location, "EXPECTED_MIN", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
      data: mapClimateData(location, "APPARENT_EXPECTED_MAX", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
      data: mapClimateData(location, "APPARENT_HIGH_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
      data: mapClimateData(location, "APPARENT_LOW_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
      data: mapClimateData(location, "APPARENT_EXPECTED_MIN", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
  selectedYear: string
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
      data: mapClimateData(location, "PRECIP_AVG", "Annual", {
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
      data: mapClimateData(location, "PRECIP_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS * 2,
      }),
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
  selectedYear: string
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
      data: mapClimateData(location, "SNOW_AVG", "Annual", {
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
      data: mapClimateData(location, "SNOW_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS * 2,
      }),
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
  selectedYear: string
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
      data: mapClimateData(location, "AFTERNOON_HUMIDITY_AVG", "Annual", {
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
      data: mapClimateData(location, "AFTERNOON_HUMIDITY_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
  selectedYear: string
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
      data: mapClimateData(location, "DEWPOINT_AVG", "Annual", {
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
      data: mapClimateData(location, "DEWPOINT_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
  selectedYear: string
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
      data: mapClimateData(location, "WIND_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),

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
      data: mapClimateData(location, "WIND_MAX", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),

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
  selectedYear: string
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
      data: mapClimateData(location, "SUNSHINE_AVG", "Annual", {
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
      data: mapClimateData(location, "SUNSHINE_AVG", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
  selectedYear: string
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
      data: mapClimateData(location, "UV_INDEX", "Annual", {
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
      data: mapClimateData(location, "UV_INDEX", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
  selectedYear: string
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
      data: mapClimateData(location, "COMFORT_INDEX", "Annual", {
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
      yAxisID: "Comfort_Index",
    };

    datasets.push(avg);

    const historical: ClimateChartDataset = {
      type: "line",
      label: location_name + " Act",
      data: mapClimateData(location, "COMFORT_INDEX", selectedYear, {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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
  selectedYear: string
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
      data: mapClimateData(location, "GROWING_CHANCE", "Annual", {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
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

    const frost: ClimateChartDataset = {
      type: "line",
      label: location_name + " Frost",
      data: mapClimateData(location, "MORNING_FROST_CHANCE", "Annual", {
        multiplyByVal: 1,
        windowSize: SMA_SMOOTH_DAYS,
      }),
      backgroundColor: background_color,
      borderColor: color,
      borderWidth: borderWidth / 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      lineTension: LINE_TENSION,
      fill: true,
      yAxisID: "Percentage",
    };

    datasets.push(frost);
  });

  return datasets;
};
