import dynamic from "next/dynamic";
import {
  chartConfig,
  TimeGranularity,
  temperatureKeys,
  apparentTemperatureKeys,
  annualPrecipKeys,
  paginatedPrecipKeys,
  annualSnowKeys,
  paginatedSnowKeys,
  annualHumidityKeys,
  paginatedHumidityKeys,
  annualDewpointKeys,
  paginatedDewpointKeys,
  annualWindKeys,
  paginatedWindKeys,
  annualSunshineKeys,
  paginatedSunshineKeys,
  annualUVIndexKeys,
  paginatedUVIndexKeys,
  annualComfortKeys,
  paginatedComfortKeys,
  annualGrowingSeasonKeys,
} from "./climate-chart-helpers";
import {
  createTemperatureDataset,
  createClimateDataset,
} from "./climate-chart-datasets";
import { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import { MarkerType, LocationColors } from "../location-props";
import Table from "./ComparePageTable";
import ClimateChartPaginate from "./ClimateChartPaginate";
import YearSelector from "./YearSelector";
import LazyLoad from "react-lazyload";
import ClimateCalendar from "../climate-calendar/ClimateCalendar";
import { TitleColor, getTemperatureColor } from "../data-value-colors";

//This is dynamic import function to load components that rely on
// browser-specific functionalities such as the window object:
const ClimateChart = dynamic(() => import("./ClimateChart"), { ssr: false });

type ComparisonPageProps = {
  locations: MarkerType[];
};

type YearlyData = {
  [locationId: string]: {
    [year: string]: any;
  };
};

// #########################################
// CONSTANTS
// #########################################

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const TEMPERATURE_COLOR_PERC_DEV = 10;

export default function ComparisonPage({ locations }: ComparisonPageProps) {
  const [selectedYear, setSelectedYear] = useState<string>("Annual");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [yearlyData, setYearlyData] = useState<YearlyData>({});
  const [isLoadingYearlyData, setIsLoadingYearlyData] = useState(false);

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
  const extractClimateData = useCallback(
    (key: string, time_granularity: string, year: any) => {
      if (year === "Annual") {
        return locations.map(
          (location) => location.data.climate_data[key][time_granularity]
        );
      } else {
        return locations.map((location) => {
          const locationYearData = yearlyData[location.id]
            ? yearlyData[location.id][year]
            : null;
          return locationYearData
            ? locationYearData.climate_data[key][time_granularity]
            : location.data.climate_data[key][time_granularity];
        });
      }
    },
    [locations, yearlyData]
  );

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

  // ####################################################
  // THIS ALLOWS CONCURRENT YEAR DATA RETRIEVAL DB QUERY
  // Fetch the yearly data for the selected year and location when they change
  useEffect(() => {
    // This function will be called for each location to fetch its data
    const fetchLocationDataAsync = async (location: MarkerType) => {
      if (selectedYear !== "Annual") {
        await fetchYearData(location, selectedYear);
      }
    };

    // Creating an array of fetch promises for each location
    const fetchPromises = locations.map((location) =>
      fetchLocationDataAsync(location)
    );
    setIsLoadingYearlyData(true);

    // Using Promise.all to execute all fetch requests in parallel
    Promise.all(fetchPromises)
      .then(() => {
        setIsLoadingYearlyData(false);
      })
      .catch((error) => {
        setIsLoadingYearlyData(false);

        console.error("An error occurred while fetching data", error);
      });
  }, [selectedYear, locations]);

  // THIS ALLOWS FOR ONLY ONE LOCATION YEAR DATA RETRIEVAL DB QUERY
  /*
  useEffect(() => {
    const location = locations[currentIndex];

    if (selectedYear !== "Annual") {
      fetchYearData(location, selectedYear);
    }
  }, [selectedYear, currentIndex, locations]);
*/

  // Create the datasets for the climate charts
  //

  const annualTemperatureDataset = useMemo(() => {
    return createTemperatureDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      false,
      temperatureKeys
    );
  }, [locations]);

  const paginatedTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      createTemperatureDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        true,
        temperatureKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualApparentTemperatureDataset = useMemo(() => {
    return createTemperatureDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      false,
      apparentTemperatureKeys
    );
  }, [locations]);

  const paginatedApparentTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      createTemperatureDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        true,
        apparentTemperatureKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualPrecipDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      { avgMultiplyByVal: 30 },
      "Precip",
      annualPrecipKeys
    );
  }, [locations]);

  const paginatedPrecipDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        { avgMultiplyByVal: 30 },
        "Precip",
        paginatedPrecipKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualSnowDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      { avgMultiplyByVal: 30 },
      "Precip",
      annualSnowKeys
    );
  }, [locations]);

  const paginatedSnowDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        { avgMultiplyByVal: 30 },
        "Precip",
        paginatedSnowKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualHumidityDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "Percentage",
      annualHumidityKeys
    );
  }, [locations]);

  const paginatedHumidityDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "Percentage",
        paginatedHumidityKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualDewpointDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "Temperature",
      annualDewpointKeys
    );
  }, [locations]);

  const paginatedDewpointDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "Dewpoint",
        paginatedDewpointKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualWindDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "Wind",
      annualWindKeys
    );
  }, [locations]);

  const paginatedWindDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "Wind",
        paginatedWindKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualSunshineDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "Percentage",
      annualSunshineKeys
    );
  }, [locations]);

  const paginatedSunshineDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "Percentage",
        paginatedSunshineKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualUVIndexDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "UV_Index",
      annualUVIndexKeys
    );
  }, [locations]);

  const paginatedUVIndexDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "UV_Index",
        paginatedUVIndexKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualComfortDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "Comfort_Index",
      annualComfortKeys
    );
  }, [locations]);

  const paginatedComfortDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "Comfort_Index",
        paginatedComfortKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualGrowingSeasonDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "Percentage",
      annualGrowingSeasonKeys
    );
  }, [locations]);

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

              {selectedYear !== "Annual" && (
                <ClimateChartPaginate
                  locations={locations}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                >
                  {(location, index) => (
                    <div>
                      <Typography
                        variant="h6"
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          color: TitleColor,
                        }}
                      >
                        {location.data.location_data.location}
                      </Typography>
                      <Typography variant="h6" style={{ textAlign: "center" }}>
                        {selectedYear}
                      </Typography>
                      <ClimateCalendar
                        climateData={
                          yearlyData[location.id] &&
                          yearlyData[location.id][selectedYear]
                            ? yearlyData[location.id][selectedYear].climate_data
                            : location.data.climate_data
                        }
                        selectedYear={selectedYear}
                        record_high_data={
                          location.data.climate_data["record_high"]["daily"]
                        }
                        record_low_data={
                          location.data.climate_data["record_low"]["daily"]
                        }
                      />
                    </div>
                  )}
                </ClimateChartPaginate>
              )}

              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} High and
                Low Temperatures
              </Typography>
              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Average High (°F)`}
                  monthly_data={extractClimateData(
                    "high_temperature",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "high_temperature",
                    "annual",
                    selectedYear
                  )}
                  units={"°F"}
                  averageKey={"high_temperature"}
                  isLoading={isLoadingYearlyData}
                  colorPercentDev={TEMPERATURE_COLOR_PERC_DEV}
                ></Table>

                <Table
                  locations={locations}
                  heading={`${selectedYear} Average Low (°F)`}
                  monthly_data={extractClimateData(
                    "low_temperature",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "low_temperature",
                    "annual",
                    selectedYear
                  )}
                  units={"°F"}
                  averageKey={"low_temperature"}
                  isLoading={isLoadingYearlyData}
                  colorPercentDev={TEMPERATURE_COLOR_PERC_DEV}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />

              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Apparent
                High and Low Temperatures
              </Typography>
              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Apparent Average High (°F)`}
                  monthly_data={extractClimateData(
                    "apparent_high_temperature",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "apparent_high_temperature",
                    "annual",
                    selectedYear
                  )}
                  units={"°F"}
                  averageKey={"apparent_high_temperature"}
                  isLoading={isLoadingYearlyData}
                  colorPercentDev={TEMPERATURE_COLOR_PERC_DEV}
                ></Table>

                <Table
                  locations={locations}
                  heading={`${selectedYear} Apparent Average Low (°F)`}
                  monthly_data={extractClimateData(
                    "apparent_low_temperature",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "apparent_low_temperature",
                    "annual",
                    selectedYear
                  )}
                  units={"°F"}
                  averageKey={"apparent_low_temperature"}
                  isLoading={isLoadingYearlyData}
                  colorPercentDev={TEMPERATURE_COLOR_PERC_DEV}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />

              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                Precipitation
              </Typography>
              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Average Precipitation`}
                  monthly_data={extractClimateData(
                    "precipitation",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "precipitation",
                    "annual",
                    selectedYear
                  )}
                  numDec={1}
                  units={"in"}
                  averageKey={"precipitation"}
                  isLoading={isLoadingYearlyData}
                ></Table>

                <Table
                  locations={locations}
                  heading={`${selectedYear} Total Rainy Days`}
                  monthly_data={extractClimateData(
                    "precip_days",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "precip_days",
                    "annual",
                    selectedYear
                  )}
                  units={" days"}
                  averageKey={"precip_days"}
                  isLoading={isLoadingYearlyData}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Snowfall
              </Typography>
              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Average Snowfall`}
                  monthly_data={extractClimateData(
                    "snow",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "snow",
                    "annual",
                    selectedYear
                  )}
                  numDec={1}
                  units={"in"}
                  averageKey={"snow"}
                  isLoading={isLoadingYearlyData}
                ></Table>

                <Table
                  locations={locations}
                  heading={`${selectedYear} Total Snowy Days`}
                  monthly_data={extractClimateData(
                    "snow_days",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "snow_days",
                    "annual",
                    selectedYear
                  )}
                  units={" days"}
                  averageKey={"snow_days"}
                  isLoading={isLoadingYearlyData}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Afternoon
                Humidity
              </Typography>
              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Average Humidity`}
                  monthly_data={extractClimateData(
                    "mean_humidity",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "mean_humidity",
                    "annual",
                    selectedYear
                  )}
                  units={"%"}
                  averageKey={"mean_humidity"}
                  isLoading={isLoadingYearlyData}
                  colorPercentDev={TEMPERATURE_COLOR_PERC_DEV}
                ></Table>
                <Table
                  locations={locations}
                  heading={`${selectedYear} Average Morning Humidity`}
                  monthly_data={extractClimateData(
                    "morning_humidity",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "morning_humidity",
                    "annual",
                    selectedYear
                  )}
                  units={"%"}
                  averageKey={"morning_humidity"}
                  isLoading={isLoadingYearlyData}
                  colorPercentDev={TEMPERATURE_COLOR_PERC_DEV}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Dewpoint
              </Typography>

              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Average Dewpoint (°F)`}
                  monthly_data={extractClimateData(
                    "dewpoint",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "dewpoint",
                    "annual",
                    selectedYear
                  )}
                  units={"°F"}
                  averageKey={"dewpoint"}
                  isLoading={isLoadingYearlyData}
                  colorPercentDev={TEMPERATURE_COLOR_PERC_DEV}
                ></Table>

                <Table
                  locations={locations}
                  heading={`${selectedYear} Total Muggy Days`}
                  monthly_data={extractClimateData(
                    "dewpoint_muggy_days",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "dewpoint_muggy_days",
                    "annual",
                    selectedYear
                  )}
                  units={" days"}
                  averageKey={"dewpoint_muggy_days"}
                  isLoading={isLoadingYearlyData}
                ></Table>
              </div>

              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Wind Speed
              </Typography>

              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                Average maximum daily wind speed for each location. The average
                wind values can be seen when viewing historical data.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading={`${selectedYear} Average Wind Speed`}
                  monthly_data={extractClimateData(
                    "wind",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "wind",
                    "annual",
                    selectedYear
                  )}
                  units={"mph"}
                  averageKey={"wind"}
                  isLoading={isLoadingYearlyData}
                ></Table>

                {
                  <Table
                    locations={locations}
                    heading={`${selectedYear} Average Wind Gust`}
                    monthly_data={extractClimateData(
                      "wind_gust",
                      "monthly",
                      selectedYear
                    )}
                    annual_data={extractClimateData(
                      "wind_gust",
                      "annual",
                      selectedYear
                    )}
                    units={"mph"}
                    averageKey={"wind_gust"}
                    isLoading={isLoadingYearlyData}
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
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Sunshine
                Percentage
              </Typography>

              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Total Sunny Days`}
                  monthly_data={extractClimateData(
                    "clear_days",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "clear_days",
                    "annual",
                    selectedYear
                  )}
                  units={" days"}
                  averageKey={"clear_days"}
                  isLoading={isLoadingYearlyData}
                ></Table>
                <Table
                  locations={locations}
                  heading={`${selectedYear} Total Partly Cloudy Days`}
                  monthly_data={extractClimateData(
                    "partly_cloudy_days",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "partly_cloudy_days",
                    "annual",
                    selectedYear
                  )}
                  units={" days"}
                  averageKey={"partly_cloudy_days"}
                  isLoading={isLoadingYearlyData}
                ></Table>
                <Table
                  locations={locations}
                  heading={`${selectedYear} Total Cloudy Days`}
                  monthly_data={extractClimateData(
                    "cloudy_days",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "cloudy_days",
                    "annual",
                    selectedYear
                  )}
                  units={" days"}
                  averageKey={"cloudy_days"}
                  isLoading={isLoadingYearlyData}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} UV Index
              </Typography>
              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Average UV Index`}
                  monthly_data={extractClimateData(
                    "uv_index",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "uv_index",
                    "annual",
                    selectedYear
                  )}
                  averageKey={"uv_index"}
                  isLoading={isLoadingYearlyData}
                ></Table>

                <Table
                  locations={locations}
                  heading={`${selectedYear} Average Sun Angle`}
                  monthly_data={extractClimateData(
                    "sun_angle",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "sun_angle",
                    "annual",
                    selectedYear
                  )}
                  units={"°"}
                  averageKey={"sun_angle"}
                  isLoading={isLoadingYearlyData}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />
              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                {selectedYear === "Annual" ? "Annual" : selectedYear} Comfort
                Rating
              </Typography>
              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                  heading={`${selectedYear} Average Comfort Rating`}
                  monthly_data={extractClimateData(
                    "comfort_index",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "comfort_index",
                    "annual",
                    selectedYear
                  )}
                  averageKey={"comfort_index"}
                  isLoading={isLoadingYearlyData}
                ></Table>
              </div>
              <br />
              <br />
              <hr />
              <br />
              <br />

              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={chartConfig.headingVariant}
                component="div"
                textAlign={"center"}
              >
                Annual Growing Season
              </Typography>
              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
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
                utility bills. Frost is likely when the temperature is below 35
                degrees, with high humidity, which often occurs in the morning.
              </p>
              <div>
                <Table
                  locations={locations}
                  heading={`${selectedYear} Average Frost Chance`}
                  monthly_data={extractClimateData(
                    "morning_frost_chance",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "morning_frost_chance",
                    "annual",
                    selectedYear
                  )}
                  units={"%"}
                  averageKey={"morning_frost_chance"}
                  isLoading={isLoadingYearlyData}
                  colorPercentDev={TEMPERATURE_COLOR_PERC_DEV}
                ></Table>

                <Table
                  locations={locations}
                  heading={`${selectedYear} Average Cooling Degree Days`}
                  monthly_data={extractClimateData(
                    "cdd",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "cdd",
                    "annual",
                    selectedYear
                  )}
                  averageKey={"cdd"}
                  isLoading={isLoadingYearlyData}
                ></Table>

                <Table
                  locations={locations}
                  heading={`${selectedYear} Average Heating Degree Days`}
                  monthly_data={extractClimateData(
                    "hdd",
                    "monthly",
                    selectedYear
                  )}
                  annual_data={extractClimateData(
                    "hdd",
                    "annual",
                    selectedYear
                  )}
                  averageKey={"hdd"}
                  isLoading={isLoadingYearlyData}
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
