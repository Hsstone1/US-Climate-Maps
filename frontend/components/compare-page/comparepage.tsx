import dynamic from "next/dynamic";
import {
  chartConfig,
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
  paginatedGrowingSeasonKeys,
  annualFrostChanceKeys,
  paginatedFrostChanceKeys,
  annualStackedSunKeys,
  paginatedStackedSunKeys,
} from "../climate-chart/climate-chart-helpers";
import {
  createTemperatureDataset,
  createClimateDataset,
  createStackedBarDataset,
} from "../climate-chart/climate-chart-datasets";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineBreaks,
  MarkerType,
  LocationColors,
  API_URL,
} from "../global-utils";
import Table from "./ComparePageTable";
import ClimateChartPaginate from "../climate-chart/ClimateChartPaginate";
import YearSelector from "./YearSelector";
import LazyLoad from "react-lazyload";
import ClimateCalendar from "../climate-calendar/ClimateCalendar";
import { TitleColor } from "../data-value-colors";
import ClimateChartRadio from "../climate-chart/ClimateChartRadio";
import StackedBarChart from "../climate-chart/StackedBarChart";

//This is dynamic import function to load components that rely on
// browser-specific functionalities such as the window object:
const ClimateChart = dynamic(() => import("../climate-chart/ClimateChart"), {
  ssr: false,
});

type ComparisonPageProps = {
  locations: MarkerType[];
  yearlyData: any;
  setYearlyData: any;
  isLoadingYearlyData: any;
  setIsLoadingYearlyData: any;
};

// #########################################
// CONSTANTS
const YEAR_PERC_DEV_10 = 10;
const DEFAULT_X_RANGE_MAX = 365;
const DEFAULT_X_RANGE_MIN = 0;

export default function ComparisonPage({
  locations,
  yearlyData,
  setYearlyData,
  isLoadingYearlyData,
  setIsLoadingYearlyData,
}: ComparisonPageProps) {
  const [selectedYear, setSelectedYear] = useState<string>("Annual");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [xAxisRangeState, setXAxisRangeState] = useState({
    minX: DEFAULT_X_RANGE_MIN,
    maxX: DEFAULT_X_RANGE_MAX,
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
        return locations.map((location) => {
          const climateData = location.data && location.data.climate_data;
          const data = climateData ? climateData[key] : undefined;
          return data ? data[time_granularity] : undefined;
        });
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
        const response = await fetch(API_URL + `/climate_data_db_year`, {
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
        setYearlyData((prevData: any) => {
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
    [yearlyData, setYearlyData]
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

  // Create the datasets for the climate charts
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

  const paginatedGrowingSeasonDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "Percentage",
        paginatedGrowingSeasonKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  const annualFrostChanceDataset = useMemo(() => {
    return createClimateDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "Percentage",
      annualFrostChanceKeys
    );
  }, [locations]);

  const paginatedFrostChanceDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "Percentage",
        paginatedFrostChanceKeys
      )
    );
  }, [locations, selectedYear, yearlyData]);

  // ####################################################
  /*
  const annualStackedSunDataset = useMemo(() => {
    return createStackedBarDataset(
      locations,
      undefined,
      "Annual",
      undefined,
      {},
      "Percentage",
      annualStackedSunKeys,
      "monthly"
    );
  }, [locations]);

  const paginatedStackedSunDataset = useMemo(() => {
    return locations.map((location, index) =>
      createStackedBarDataset(
        [location],
        index,
        selectedYear,
        yearlyData,
        {},
        "Percentage",
        paginatedStackedSunKeys,
        "monthly"
      )
    );
  }, [locations, selectedYear, yearlyData]);

  console.log("ANNUAL BAR STACK: ", annualStackedSunDataset);
*/
  // ####################################################

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

              {/*CLIMATE CALENDAR*/}

              {selectedYear !== "Annual" && (
                <>
                  <LazyLoad
                    height={chartConfig.lazyLoadHeight}
                    offset={chartConfig.lazyLoadOffset}
                    once={chartConfig.doLazyLoadOnce}
                    className="compare-chart-shadow-effect"
                  >
                    <ClimateChartPaginate
                      locations={locations}
                      currentIndex={currentIndex}
                      setCurrentIndex={setCurrentIndex}
                    >
                      {(location, index) => (
                        <div>
                          <p className="chart-title">
                            {selectedYear} Monthly Calendar
                          </p>
                          <p
                            className="chart-heading"
                            style={{ color: TitleColor }}
                          >
                            {location.data.location_data.location}
                          </p>

                          <ClimateCalendar
                            climateData={
                              yearlyData[location.id] &&
                              yearlyData[location.id][selectedYear]
                                ? yearlyData[location.id][selectedYear]
                                    .climate_data
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
                  </LazyLoad>
                  <LineBreaks />
                </>
              )}
              {/*TEMPERATURE AND APPARENT*/}

              <ClimateChartRadio labels={["Actual", "Apparent"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                    Temperatures
                  </p>

                  {selectedYear === "Annual" ? (
                    <ClimateChart
                      datasetProp={annualTemperatureDataset}
                      units={"°"}
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
                          units={"°"}
                          title={location.data.location_data.location}
                          year={parseInt(selectedYear)}
                          xAxisRangeState={xAxisRangeState}
                          onXAxisRangeChange={handleXAxisRangeChange}
                        />
                      )}
                    </ClimateChartPaginate>
                  )}
                  <p className="compare-page-paragraph">
                    Average high and low temperatures for each location. The
                    expected temperature range is the faint area behind the
                    line, which represents the highest and lowest temperatures
                    that have occured historically for each day.
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
                      units={"°"}
                      averageKey={"high_temperature"}
                      isLoading={isLoadingYearlyData}
                      yearPercentDev={YEAR_PERC_DEV_10}
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
                      units={"°"}
                      averageKey={"low_temperature"}
                      isLoading={isLoadingYearlyData}
                      yearPercentDev={YEAR_PERC_DEV_10}
                    ></Table>
                  </div>
                </LazyLoad>

                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                    Apparent Temperatures
                  </p>

                  {selectedYear === "Annual" ? (
                    <ClimateChart
                      datasetProp={annualApparentTemperatureDataset}
                      units={"°"}
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
                          units={"°"}
                          title={location.data.location_data.location}
                          year={parseInt(selectedYear)}
                          xAxisRangeState={xAxisRangeState}
                          onXAxisRangeChange={handleXAxisRangeChange}
                        />
                      )}
                    </ClimateChartPaginate>
                  )}

                  <p className="compare-page-paragraph">
                    Average high and low feels-like temperatures for each
                    location. The expected feels-like temperature range is the
                    faint area behind the line, which represents the highest and
                    lowest apparent temperatures likely for a day.
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
                      units={"°"}
                      averageKey={"apparent_high_temperature"}
                      isLoading={isLoadingYearlyData}
                      yearPercentDev={YEAR_PERC_DEV_10}
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
                      units={"°"}
                      averageKey={"apparent_low_temperature"}
                      isLoading={isLoadingYearlyData}
                      yearPercentDev={YEAR_PERC_DEV_10}
                    ></Table>
                  </div>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />

              {/*PRECIP AND SNOW*/}

              <ClimateChartRadio labels={["Precip", "Snow"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                    Precipitation
                  </p>

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

                  <p className="compare-page-paragraph">
                    Average precipitation in inches for each location.
                    Precipitation is the combined total water content of both
                    rain and snow. A rainy day is counted if there is more than
                    0.01 inches of rainfall accumulation.
                    <br /> <br />
                    The total number of rainy days expected for each month,
                    along with the annual precipitation total are displayed in
                    the table.
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
                      annualColorAdjustment={12}
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
                      annualColorAdjustment={12}
                      units={"dy"}
                      averageKey={"precip_days"}
                      isLoading={isLoadingYearlyData}
                    ></Table>
                  </div>
                </LazyLoad>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                    Snowfall
                  </p>

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

                  <p className="compare-page-paragraph">
                    Average snowfall in inches for each location. A snowy day is
                    counted if there is more than 0.1 inches of accumulation.
                    <br /> <br />
                    The total number of snowy days expected for each month,
                    along with the annual total are displayed in the table.
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
                      annualColorAdjustment={12}
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
                      annualColorAdjustment={12}
                      units={"dy"}
                      averageKey={"snow_days"}
                      isLoading={isLoadingYearlyData}
                    ></Table>
                  </div>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />

              {/*DEWPOINT AND HUMIDITY*/}

              <ClimateChartRadio labels={["Dewpoint", "Humidity"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                    Dewpoint
                  </p>

                  {selectedYear === "Annual" ? (
                    <ClimateChart
                      datasetProp={annualDewpointDataset}
                      units={"°"}
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
                          units={"°"}
                          title={location.data.location_data.location}
                          year={parseInt(selectedYear)}
                          xAxisRangeState={xAxisRangeState}
                          onXAxisRangeChange={handleXAxisRangeChange}
                        />
                      )}
                    </ClimateChartPaginate>
                  )}

                  <p className="compare-page-paragraph">
                    Average dewpoint for each location. The dewpoint is a
                    measure of absolute humidity in the air, rather than the
                    relative humidity percentage which changes with temperature.
                    <br /> <br />
                    Dewpoint is generally a better metric for how humid it feels
                    outside. Dewpoint values bellow 50 degrees are plesant,
                    around 60 degrees begins to feel humid, 70 degrees feels
                    muggy, and above 75 feels oppressive.
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
                      units={"°"}
                      averageKey={"dewpoint"}
                      isLoading={isLoadingYearlyData}
                      yearPercentDev={YEAR_PERC_DEV_10}
                    ></Table>

                    {/* <Table
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
                      annualColorAdjustment={12}
                      units={"dy"}
                      averageKey={"dewpoint_muggy_days"}
                      isLoading={isLoadingYearlyData}
                    ></Table> */}
                  </div>
                </LazyLoad>

                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                    Afternoon Humidity
                  </p>

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

                  <p className="compare-page-paragraph">
                    Average afternoon humidity for each location. In the
                    afternoon when the tempearture is highest, the humidity will
                    be the lowest. The opposite is the case in the morning.
                    <br /> <br />A humidity level below 30 percent is considered
                    comfortable, and above 70 percent is considered very humid.
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
                      yearPercentDev={YEAR_PERC_DEV_10}
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
                      yearPercentDev={YEAR_PERC_DEV_10}
                    ></Table>
                  </div>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />

              {/*SUNSHINE PERCENTAGE AND UV INDEX*/}

              <ClimateChartRadio labels={["Sunshine", "UV Index"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                    Sunshine Percentage
                  </p>

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

                  <p className="compare-page-paragraph">
                    Percentage of sunshine for each location. A day is
                    considered to be sunny if the sun is out more than 70% of
                    each day, Partly Cloudy if its out for more than 40%, and
                    Cloudy if less.
                    <br /> <br />
                    The total number of sunny days expected for each month,
                    along with the annual total are displayed in the table.
                  </p>

                  <div>
                    <Table
                      locations={locations}
                      heading={`${selectedYear} Sunshine Percentage`}
                      monthly_data={extractClimateData(
                        "sun",
                        "monthly",
                        selectedYear
                      )}
                      annual_data={extractClimateData(
                        "sun",
                        "annual",
                        selectedYear
                      )}
                      units={""}
                      averageKey={"sun"}
                      isLoading={isLoadingYearlyData}
                    ></Table>
                    {/* 
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
                      units={"dy"}
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
                      units={"dy"}
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
                      units={"dy"}
                      averageKey={"cloudy_days"}
                      isLoading={isLoadingYearlyData}
                    ></Table>
                    */}
                  </div>
                </LazyLoad>

                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear} UV
                    Index
                  </p>

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

                  <p className="compare-page-paragraph">
                    Average UV Index for each location. The UV index is a
                    measure of the strength of the suns ultraviolet rays. The UV
                    index is highest in the summer and lowest in the winter.
                    Elevation also increases the UV index, so on mountain peaks
                    the sun is often stronger.
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
                      yearPercentDev={YEAR_PERC_DEV_10}
                    ></Table>
                  </div>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />

              {/*WIND*/}

              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
                className="compare-chart-shadow-effect"
              >
                <p className="chart-title">
                  {selectedYear === "Annual" ? "Annual" : selectedYear} Wind
                  Speed
                </p>

                {selectedYear === "Annual" ? (
                  <ClimateChart
                    datasetProp={annualWindDataset}
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
                        data={paginatedWindDataset}
                        units={""}
                        title={location.data.location_data.location}
                        year={parseInt(selectedYear)}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                )}

                <p className="compare-page-paragraph">
                  Average maximum daily wind speed for each location. The
                  average wind values can be seen when viewing historical data.
                </p>
                <div>
                  <Table
                    locations={locations}
                    heading={`${selectedYear} Average Wind Speed (mph)`}
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
                    units={""}
                    averageKey={"wind"}
                    isLoading={isLoadingYearlyData}
                  ></Table>

                  <Table
                    locations={locations}
                    heading={`${selectedYear} Average Wind Gust (mph)`}
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
                    units={""}
                    averageKey={"wind_gust"}
                    isLoading={isLoadingYearlyData}
                  ></Table>
                </div>
              </LazyLoad>
              <LineBreaks />

              {/*COMFORT RATING*/}

              <LazyLoad
                height={chartConfig.lazyLoadHeight}
                offset={chartConfig.lazyLoadOffset}
                once={chartConfig.doLazyLoadOnce}
                className="compare-chart-shadow-effect"
              >
                <p className="chart-title">
                  {selectedYear === "Annual" ? "Annual" : selectedYear} Comfort
                  Rating
                </p>

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

                <p className="compare-page-paragraph">
                  Average comfort rating for each location. The comfort rating
                  is a function of temperature, humidity, and amount of sun. The
                  higher the comfort rating, the more pleasant the weather is.
                  <br />
                  <br />A comfort rating lower than 50 is very harsh, and
                  largely unsuitable for normal life. A rating over 90 is
                  considered very ideal, usally accompanied with plentiful
                  sunshine, low humidity and warm temperatures.
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
                    yearPercentDev={YEAR_PERC_DEV_10}
                  ></Table>
                </div>
              </LazyLoad>
              <LineBreaks />

              {/*GROWING SEASON AND FROST CHANCE*/}

              <ClimateChartRadio labels={["Growing", "Frost"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear}{" "}
                    Growing Season
                  </p>

                  {selectedYear === "Annual" ? (
                    <ClimateChart
                      datasetProp={annualGrowingSeasonDataset}
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
                          data={paginatedGrowingSeasonDataset}
                          year={parseInt(selectedYear)}
                          title={location.data.location_data.location}
                          xAxisRangeState={xAxisRangeState}
                          onXAxisRangeChange={handleXAxisRangeChange}
                        />
                      )}
                    </ClimateChartPaginate>
                  )}
                  <p className="compare-page-paragraph">
                    The growing season is the number of days between the last
                    frost in the spring and the first frost in the fall. The
                    growing season is the time when plants can grow, and is
                    generally when the temperature is above 32 degrees.
                  </p>
                  <div>
                    <Table
                      locations={locations}
                      heading={`${selectedYear} Growing Days`}
                      monthly_data={extractClimateData(
                        "growing_days",
                        "monthly",
                        selectedYear
                      )}
                      annual_data={extractClimateData(
                        "growing_days",
                        "annual",
                        selectedYear
                      )}
                      units="dy"
                      averageKey={"growing_days"}
                      isLoading={isLoadingYearlyData}
                    ></Table>
                  </div>
                </LazyLoad>

                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">
                    {selectedYear === "Annual" ? "Annual" : selectedYear} Frost
                    Chance
                  </p>

                  {selectedYear === "Annual" ? (
                    <ClimateChart
                      datasetProp={annualFrostChanceDataset}
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
                          data={paginatedFrostChanceDataset}
                          year={parseInt(selectedYear)}
                          title={location.data.location_data.location}
                          xAxisRangeState={xAxisRangeState}
                          onXAxisRangeChange={handleXAxisRangeChange}
                        />
                      )}
                    </ClimateChartPaginate>
                  )}

                  <p className="compare-page-paragraph">
                    Frost is likely when the temperature is below 35 degrees,
                    with high humidity, which often occurs in the morning.
                  </p>
                  <div>
                    <Table
                      locations={locations}
                      heading={`${selectedYear} Frost Days`}
                      monthly_data={extractClimateData(
                        "frost_days",
                        "monthly",
                        selectedYear
                      )}
                      annual_data={extractClimateData(
                        "frost_days",
                        "annual",
                        selectedYear
                      )}
                      units={"dy"}
                      averageKey={"frost_days"}
                      isLoading={isLoadingYearlyData}
                    ></Table>
                  </div>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />
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

// This is a wrapper for the Climate Charts when they are being paginated
// Without this wrapper, there is an error when the last paginated chart is selected
// And then a location is removed from the comparison list
const ClimateChartRenderer: React.FC<{
  index: number;
  data: any[];
  units?: string;
  title?: string;
  year?: number;
  xAxisRangeState: { minX: number; maxX: number };
  onXAxisRangeChange: (newState: { minX: number; maxX: number }) => void;
  X_RANGE_MAX?: number;
  X_RANGE_MIN?: number;
  MAX_ZOOM?: number;
  dataType?: "YEARLY" | "MONTHLY" | "DAILY";
  isStacked?: boolean;
  updateChartZoom?: boolean;
}> = ({
  index,
  data,
  units = "",
  title = "",
  year = 2000,
  xAxisRangeState,
  onXAxisRangeChange,
  X_RANGE_MAX = DEFAULT_X_RANGE_MAX,
  X_RANGE_MIN = DEFAULT_X_RANGE_MIN,
  MAX_ZOOM = 30,
  dataType = "DAILY",
  isStacked = false,
  updateChartZoom = true,
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
      X_RANGE_MAX={X_RANGE_MAX}
      X_RANGE_MIN={X_RANGE_MIN}
      MAX_ZOOM={MAX_ZOOM}
      dataType={dataType}
      isStacked={isStacked}
      updateChartZoom={updateChartZoom}
    />
  );
};

/*
{selectedYear === "Annual" ? (
                      <StackedBarChart
                        datasetProp={annualStackedSunDataset}
                        units={"%"}
                        X_RANGE_MIN={0}
                        X_RANGE_MAX={11}
                        dataType="MONTHLY"
                        isStacked={true}
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
                            data={paginatedStackedSunDataset}
                            units={"%"}
                            title={location.data.location_data.location}
                            year={parseInt(selectedYear)}
                            xAxisRangeState={xAxisRangeState}
                            onXAxisRangeChange={handleXAxisRangeChange}
                            X_RANGE_MAX={11}
                            X_RANGE_MIN={0}
                            MAX_ZOOM={12}
                            dataType="MONTHLY"
                            isStacked={true}
                            updateChartZoom={false}
                          />
                        )}
                      </ClimateChartPaginate>
                    )}

*/
