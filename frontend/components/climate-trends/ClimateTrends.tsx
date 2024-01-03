import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import ClimateChartPaginate from "../climate-chart/ClimateChartPaginate";
import Table from "../compare-page/ComparePageTable";
import LazyLoad from "react-lazyload";

import { chartConfig } from "../climate-chart/climate-chart-helpers";
import {
  LineBreaks,
  API_URL,
  LocationColors,
  MAX_YEAR,
  MIN_YEAR,
  NUM_YEARS,
  MarkerType,
} from "../global-utils";
import { ThemeColor } from "../data-value-colors";
import {
  ClimateTrendKeys,
  createClimateTrendsDataset,
} from "./climate-trends-datasets";
import ClimateChartRadio from "../climate-chart/ClimateChartRadio";
import { Typography } from "@material-ui/core";
//This is dynamic import function to load components that rely on
// browser-specific functionalities such as the window object:
const ClimateChart = dynamic(() => import("../climate-chart/ClimateChart"), {
  ssr: false,
});

type ClimateTrendsProps = {
  locations: MarkerType[];
  climateData: any;
  setClimateData: any;
  isLoadingClimateData: boolean;
  setIsLoadingClimateData: any;
};

export default function ClimateTrends({
  locations,
  climateData,
  setClimateData,
  isLoadingClimateData,
  setIsLoadingClimateData,
}: ClimateTrendsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [xAxisRangeState, setXAxisRangeState] = useState({
    minX: 0,
    maxX: NUM_YEARS,
  });
  const [isPercentageTrend, setIsPercentageTrend] = useState(false);

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

  // Fetch climate trends data for a single location
  const fetchClimateTrendsData = useCallback(
    async (location: any) => {
      // Avoid refetching if data already exists
      if (climateData[location.id]) {
        return;
      }

      try {
        const response = await fetch(API_URL + `/climate_data_db_trends`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            latitude: location.lat,
            longitude: location.lng,
            elevation: location.data.location_data.elevation,
          }),
        });

        const climateData = await response.json();

        console.log("Climate Data:", climateData);

        // Append the fetched data to the correct location in the state
        setClimateData((prevData: any) => {
          // Get the existing data for this location, or an empty object if none exists
          const existingLocationData = prevData[location.id] || {};

          // add the new data for this location
          const updatedLocationData = {
            ...existingLocationData,
            climateData,
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
    [climateData, setClimateData]
  );

  // Fetch the climate trends data when the locations change
  useEffect(() => {
    // This function will be called for each location to fetch its data
    const fetchLocationDataAsync = async (location: MarkerType) => {
      await fetchClimateTrendsData(location);
    };

    // Creating an array of fetch promises for each location
    const fetchPromises = locations.map((location) =>
      fetchLocationDataAsync(location)
    );
    setIsLoadingClimateData(true);

    // Using Promise.all to execute all fetch requests in parallel
    Promise.all(fetchPromises)
      .then(() => {
        setIsLoadingClimateData(false);
      })
      .catch((error) => {
        setIsLoadingClimateData(false);

        console.error("An error occurred while fetching data", error);
      });
  }, [locations]);

  const highTemperatureKeys: ClimateTrendKeys = {
    Actual: "high_temperature",
  };
  const lowTemperatureKeys: ClimateTrendKeys = {
    Actual: "low_temperature",
  };

  const precipKeys: ClimateTrendKeys = {
    Actual: "precipitation",
  };

  const precipDaysKeys: ClimateTrendKeys = {
    Actual: "precip_days",
  };

  const snowKeys: ClimateTrendKeys = {
    Actual: "snow",
  };

  const snowDaysKeys: ClimateTrendKeys = {
    Actual: "snow_days",
  };

  const growingSeasonKeys: ClimateTrendKeys = {
    Actual: "growing_days",
  };

  const frostChanceKeys: ClimateTrendKeys = {
    Actual: "frost_days",
  };

  const paginatedHighTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "TemperatureTrend",
        highTemperatureKeys,
        1,
        true,
        false
      )
    );
  }, [locations, climateData]);

  const paginatedHighTemperaturePercentDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PercentageTrend",
        highTemperatureKeys,
        1,
        true,
        true
      )
    );
  }, [locations, climateData]);

  const paginatedLowTemperatureDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "TemperatureTrend",
        lowTemperatureKeys,
        1,
        true,
        false
      )
    );
  }, [locations, climateData]);

  const paginatedLowTemperaturePercentDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PercentageTrend",
        lowTemperatureKeys,
        1,
        true,
        true
      )
    );
  }, [locations, climateData]);

  const paginatedPrecipDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PrecipTrend",
        precipKeys,
        1,
        true,
        false
      )
    );
  }, [locations, climateData]);

  const paginatedPrecipPercentDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PercentageTrend",
        precipKeys,
        1,
        true,
        true
      )
    );
  }, [locations, climateData]);

  const paginatedPrecipDaysDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "DaysTrend",
        precipDaysKeys,
        1,
        true,
        false
      )
    );
  }, [locations, climateData]);

  const paginatedPrecipDaysPercentDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PercentageTrend",
        precipDaysKeys,
        1,
        true,
        true
      )
    );
  }, [locations, climateData]);

  const paginatedSnowDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PrecipTrend",
        snowKeys,
        1,
        true,
        false
      )
    );
  }, [locations, climateData]);

  const paginatedSnowPercentDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PercentageTrend",
        snowKeys,
        1,
        true,
        true
      )
    );
  }, [locations, climateData]);

  const paginatedSnowDaysDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "DaysTrend",
        snowDaysKeys,
        1,
        true,
        false
      )
    );
  }, [locations, climateData]);

  const paginatedSnowDaysPercentDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PercentageTrend",
        snowDaysKeys,
        1,
        true,
        true
      )
    );
  }, [locations, climateData]);

  const paginatedGrowingSeasonDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "DaysTrend",
        growingSeasonKeys,
        1,
        true,
        false
      )
    );
  }, [locations, climateData]);

  const paginatedGrowingSeasonPercentDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PercentageTrend",
        growingSeasonKeys,
        1,
        true,
        true
      )
    );
  }, [locations, climateData]);

  const paginatedFrostChanceDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "DaysTrend",
        frostChanceKeys,
        1,
        true
      )
    );
  }, [locations, climateData]);

  const paginatedFrostChancePercentDataset = useMemo(() => {
    return locations.map((location, index) =>
      createClimateTrendsDataset(
        [location],
        index,
        climateData,
        "PercentageTrend",
        frostChanceKeys,
        1,
        true,
        true
      )
    );
  }, [locations, climateData]);

  function handleButtonClick(event: any): void {
    setIsPercentageTrend(!isPercentageTrend);
  }

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
              <button onClick={handleButtonClick}>Toggle Percentage</button>
              <ClimateChartRadio labels={["High", "Low"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">Yearly High Temperatures Trend</p>
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateTrendsChartRenderer
                        index={index}
                        data={
                          isPercentageTrend
                            ? paginatedHighTemperaturePercentDataset
                            : paginatedHighTemperatureDataset
                        }
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                        displayLegend={true}
                      />
                    )}
                  </ClimateChartPaginate>
                </LazyLoad>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">Yearly Low Temperatures Trend</p>
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateTrendsChartRenderer
                        index={index}
                        data={
                          isPercentageTrend
                            ? paginatedLowTemperaturePercentDataset
                            : paginatedLowTemperatureDataset
                        }
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />

              <ClimateChartRadio labels={["Precip", "Precip Days"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">Yearly Precipitation Trend</p>
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateTrendsChartRenderer
                        index={index}
                        data={
                          isPercentageTrend
                            ? paginatedPrecipPercentDataset
                            : paginatedPrecipDataset
                        }
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                        displayLegend={true}
                      />
                    )}
                  </ClimateChartPaginate>
                </LazyLoad>

                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">Yearly Rainy Days Trend</p>
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateTrendsChartRenderer
                        index={index}
                        data={
                          isPercentageTrend
                            ? paginatedPrecipDaysPercentDataset
                            : paginatedPrecipDaysDataset
                        }
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                        displayLegend={true}
                      />
                    )}
                  </ClimateChartPaginate>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />

              <ClimateChartRadio labels={["Snow", "Snow Days"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">Yearly Snowfall Trend</p>
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateTrendsChartRenderer
                        index={index}
                        data={
                          isPercentageTrend
                            ? paginatedSnowPercentDataset
                            : paginatedSnowDataset
                        }
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                </LazyLoad>

                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">Yearly Snowy Days Trend</p>
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateTrendsChartRenderer
                        index={index}
                        data={
                          isPercentageTrend
                            ? paginatedSnowDaysPercentDataset
                            : paginatedSnowDaysDataset
                        }
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />

              <ClimateChartRadio labels={["Growing", "Frost"]}>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">Yearly Growing Season Trend</p>
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateTrendsChartRenderer
                        index={index}
                        data={
                          isPercentageTrend
                            ? paginatedGrowingSeasonPercentDataset
                            : paginatedGrowingSeasonDataset
                        }
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                        displayLegend={true}
                      />
                    )}
                  </ClimateChartPaginate>
                </LazyLoad>
                <LazyLoad
                  height={chartConfig.lazyLoadHeight}
                  offset={chartConfig.lazyLoadOffset}
                  once={chartConfig.doLazyLoadOnce}
                  className="compare-chart-shadow-effect"
                >
                  <p className="chart-title">Yearly Frost Chance Trend</p>
                  <ClimateChartPaginate
                    locations={locations}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                  >
                    {(location, index) => (
                      <ClimateTrendsChartRenderer
                        index={index}
                        data={
                          isPercentageTrend
                            ? paginatedFrostChancePercentDataset
                            : paginatedFrostChanceDataset
                        }
                        title={location.data.location_data.location}
                        xAxisRangeState={xAxisRangeState}
                        onXAxisRangeChange={handleXAxisRangeChange}
                      />
                    )}
                  </ClimateChartPaginate>
                </LazyLoad>
              </ClimateChartRadio>
              <LineBreaks />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// This is a wrapper for the Climate Charts when they are being paginated
// Without this wrapper, there is an error when the last paginated chart is selected
// And then a location is removed from the comparison list
const ClimateTrendsChartRenderer: React.FC<{
  index: number;
  data: any[]; // Replace 'any[]' with the appropriate type for your dataset if known.
  units?: string;
  title?: string;
  xAxisRangeState: { minX: number; maxX: number };
  onXAxisRangeChange: (newState: { minX: number; maxX: number }) => void;
  X_RANGE_MIN?: number;
  X_RANGE_MAX?: number;
  MAX_ZOOM?: number;
  dataType?: "YEARLY" | "DAILY";
  displayLegend?: boolean;
}> = ({
  index,
  data,
  units = "",
  title = "",
  xAxisRangeState,
  onXAxisRangeChange,
  X_RANGE_MIN = 0,
  X_RANGE_MAX = NUM_YEARS,
  MAX_ZOOM = 10,
  dataType = "YEARLY",
  displayLegend = true,
}) => {
  if (index < 0 || index >= data.length) {
    return null;
  }
  return (
    <ClimateChart
      datasetProp={data[index]}
      units={units}
      title={title}
      xAxisRangeState={xAxisRangeState}
      onXAxisRangeChange={onXAxisRangeChange}
      X_RANGE_MIN={X_RANGE_MIN}
      X_RANGE_MAX={X_RANGE_MAX}
      MAX_ZOOM={MAX_ZOOM}
      dataType={dataType}
      displayLegend={displayLegend}
    />
  );
};
