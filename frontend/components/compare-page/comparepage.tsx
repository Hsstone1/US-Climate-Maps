import { ClimateChartDataset } from "./comparepageprops";

import { MarkerType, LocationColors } from "../export-props";
import ClimateChart from "./climatechart";
import Table from "./comparepagetable";
import ClimateTablePaginate from "../climate-table/climatetablepaginate";
import Typography from "@mui/material/Typography";

type ComparisonPageProps = {
  locations: MarkerType[];
};

export default function ComparisonPage({ locations }: ComparisonPageProps) {
  const CHART_BORDER_WIDTH = 2;
  const LINE_TENSION = 0.35;
  const LINE_ALPHA = 1;
  const BACKGROUND_ALPHA = 0.05;
  const HEADING_VARIANT = "h5";
  const SMA_SMOOTH_DAYS = 30;

  // Append first index to end of array for chart
  function appendFirstIndexToEnd(data: number[]): number[] {
    const newData = [...data];
    newData.push(data[0]);
    return newData;
  }

  const mapClimateData = (
    location: any,
    key: string,
    options: { multiplyByVal?: number; windowSize?: number } = {}
  ) => {
    const { multiplyByVal = 1, windowSize } = options;

    const rawData = location.data.climate_data.avg_daily.map(
      (day: { [key: string]: any }) => day[key] * multiplyByVal
    );

    if (windowSize === undefined) {
      return rawData;
    }

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

    return calculateSMA(rawData, windowSize);
  };

  const temperature_dataset = (
    locations: MarkerType[]
  ): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];

    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const background_color = LocationColors(BACKGROUND_ALPHA)[index];

      const high_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "HIGH_AVG", {
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
          mapClimateData(location, "LOW_AVG", {
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
    locations: MarkerType[]
  ): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];

    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const background_color = LocationColors(BACKGROUND_ALPHA)[index];

      const max_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "EXPECTED_MAX", {
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
          mapClimateData(location, "EXPECTED_MIN", {
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

  const precip_dataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const precip: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "PRECIP_AVG", {
            multiplyByVal: 30,
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

  const snow_dataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const snow_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "SNOW_AVG", {
            multiplyByVal: 30,
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

  const humidityDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const humidity_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "HUMIDITY_AVG", {
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
        yAxisID: "Humidity_Percentage",
      };

      datasets.push(humidity_dataset);
    });
    return datasets;
  };

  const dewpointDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const humidity_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "DEWPOINT_AVG", {
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

      datasets.push(humidity_dataset);
    });
    return datasets;
  };

  const windDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const wind_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "WIND_AVG", {
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

  const sunshine_dataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const sunshine_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "SUNSHINE_AVG", {
            multiplyByVal: 0.01,
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
        yAxisID: "Sunshine_Percentage",
      };

      datasets.push(sunshine_dataset);
    });
    return datasets;
  };

  const sun_angle_dataset = (
    locations: MarkerType[]
  ): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const sun_angle: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "SUN_ANGLE", {
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

  const uv_index_dataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const uv_index: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "UV_INDEX", {
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

  const comfortDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const comfort_index_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "COMFORT_INDEX", {
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

  const growingDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const frostfree_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          mapClimateData(location, "GROWING_CHANCE", {
            multiplyByVal: 0.01,
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
        yAxisID: "Sunshine_Percentage",
      };

      datasets.push(frostfree_dataset);
    });
    return datasets;
  };

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
                Yearly High and Low Temperatures
              </Typography>

              <ClimateChart
                datasetProp={temperature_dataset(locations)}
                units={"°F"}
              ></ClimateChart>
              <p style={{ textAlign: "center" }}>
                Average monthly high and low temperatures for each location. The
                dashed line represents the average monthly apparent temperature,
                which can change based on humidity and wind speed.
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
                Yearly Temperature Ranges
              </Typography>

              <ClimateChart
                datasetProp={temperature_range_dataset(locations)}
                units={"°F"}
              ></ClimateChart>
              <p style={{ textAlign: "center" }}>
                Average monthly high and low temperature ranges for each
                location. This is the expected maximum and minimum for each day
                of the year
              </p>

              <div>
                {/* Change this to be the difference between the aparent temperature and normal between high and low*/}
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
                Yearly Growing Season
              </Typography>
              <ClimateChart
                datasetProp={growingDataset(locations)}
                units={"%"}
                adjustUnitsByVal={100}
              ></ClimateChart>
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
              <hr />
              <br />
              <br />

              <Typography
                sx={{ flex: "1 1 100%" }}
                variant={HEADING_VARIANT}
                component="div"
                textAlign={"center"}
              >
                Yearly Rainfall
              </Typography>

              <ClimateChart
                datasetProp={precip_dataset(locations)}
                units={"in"}
              ></ClimateChart>
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
                Yearly Snowfall
              </Typography>
              <ClimateChart
                datasetProp={snow_dataset(locations)}
                units={"in"}
              ></ClimateChart>
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
                  decimalTrunc={1}
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
                Yearly Humidity
              </Typography>

              <ClimateChart
                datasetProp={humidityDataset(locations)}
                units={"%"}
              ></ClimateChart>
              <p style={{ textAlign: "center" }}>
                Average humidity for each month. The humidity is measured in
                percentage. A humidity level below 30 percent is considered
                comfortable, and above 70 percent is considered very humid.
              </p>

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
                Yearly Dewpoint
              </Typography>

              <ClimateChart
                datasetProp={dewpointDataset(locations)}
                units={"°F"}
              ></ClimateChart>
              <p style={{ textAlign: "center" }}>
                The dewpoint is a measure of absolute humidity in the air,
                rather than the relative humidity percentage which changes with
                temperature. Dewpoint values bellow 50 degrees are plesant,
                around 60 degrees begins to feel humid, 70 degrees is very
                muggy, and above 75 is extremely humid.
              </p>

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
                Yearly Wind Speed
              </Typography>
              <ClimateChart
                datasetProp={windDataset(locations)}
                units={"mph"}
              ></ClimateChart>
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
                Yearly Sunshine
              </Typography>
              <ClimateChart
                datasetProp={sunshine_dataset(locations)}
                units={"%"}
                adjustUnitsByVal={100}
              ></ClimateChart>
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
                Yearly Sun Angle
              </Typography>
              <ClimateChart
                datasetProp={sun_angle_dataset(locations)}
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
                  decimalTrunc={1}
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
                Yearly UV Index
              </Typography>
              <ClimateChart
                datasetProp={uv_index_dataset(locations)}
                units={""}
              ></ClimateChart>
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
                Yearly Comfort Rating
              </Typography>
              <ClimateChart
                datasetProp={comfortDataset(locations)}
              ></ClimateChart>
              <p style={{ textAlign: "center" }}>
                Average comfort rating for each month. The comfort rating is a
                function of temperature, humidity, cloudiness, UV index, and
                wind speed. The higher the comfort rating, the more comfortable
                the weather is. A comfort rating lower than 50 is very harsh,
                and largely unsuitable for normal life. A rating over 90 is
                considered very ideal, usally accompanied with sunshine and warm
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
