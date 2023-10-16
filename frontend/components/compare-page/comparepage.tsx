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

  // Append first index to end of array for chart
  function appendFirstIndexToEnd(data: number[]): number[] {
    const newData = [...data];
    newData.push(data[0]);
    return newData;
  }

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
          location.data.monthly_data.monthly_high_avg
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
        data: appendFirstIndexToEnd(location.data.monthly_data.monthly_low_avg),
        backgroundColor: background_color,
        borderColor: color,
        borderWidth: CHART_BORDER_WIDTH,
        pointRadius: 0,
        pointHoverRadius: 0,
        lineTension: LINE_TENSION,
        fill: "-1",
        yAxisID: "Temperature",
      };

      const apparent_high_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          location.data.monthly_data.monthly_apparent_high
        ),
        backgroundColor: LocationColors(0.4)[index],
        borderColor: LocationColors(0.4)[index],
        borderWidth: 1,
        borderDash: [3, 3],
        pointRadius: 0,
        pointHoverRadius: 0,
        lineTension: LINE_TENSION,
        fill: false,
        yAxisID: "Temperature",
      };

      const apparent_low_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          location.data.monthly_data.monthly_apparent_low
        ),
        backgroundColor: LocationColors(0.4)[index],
        borderColor: LocationColors(0.4)[index],
        borderWidth: 1,
        borderDash: [3, 3],
        pointRadius: 0,
        pointHoverRadius: 0,
        lineTension: LINE_TENSION,
        fill: false,
        yAxisID: "Temperature",
      };

      datasets.push(
        high_dataset,
        low_dataset,
        apparent_high_dataset,
        apparent_low_dataset
      );
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
          location.data.monthly_data.monthly_precip_avg
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
          location.data.monthly_data.monthly_snow_avg
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

  const sunshine_dataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const sunshine_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          location.data.monthly_data.monthly_sunshine_avg
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
          location.data.monthly_data.monthly_sun_angle
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

  const humidityDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const humidity_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          location.data.monthly_data.monthly_humidity_avg
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

  const windDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const wind_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          location.data.monthly_data.monthly_wind_gust_avg
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

  const comfortDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(LINE_ALPHA)[index];
      const comfort_index_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: appendFirstIndexToEnd(
          location.data.monthly_data.monthly_comfort_index
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
          location.data.monthly_data.monthly_frost_free_days_avg
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
            <div className="compare_climate_table-div">
              <ClimateTablePaginate
                locations={locations}
              ></ClimateTablePaginate>
            </div>

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
                <Table
                  locations={locations}
                  heading="Mean Maximum Temperature (°F)"
                  monthlyDataStr={"monthly_mean_maximum"}
                  annualDataStr={"annual_record_high"}
                  decimalTrunc={0}
                  units={" °F"}
                ></Table>

                <Table
                  locations={locations}
                  heading="Mean Minimum Temperature (°F)"
                  monthlyDataStr={"monthly_mean_minimum"}
                  annualDataStr={"annual_record_low"}
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
                monthly Cooling Degree Days (CDD) and Heating Degree Days (HDD),
                which is a function of average temperatures for the day bellow
                and above 65 degrees, respectively.
              </p>

              <div>
                <Table
                  locations={locations}
                  heading="Cooling Degree Days (CDD)"
                  monthlyDataStr={"monthly_CDD_avg"}
                  annualDataStr={"annual_CDD_avg"}
                  decimalTrunc={0}
                  units={""}
                ></Table>

                <Table
                  locations={locations}
                  heading="Heating Degree Days (HDD)"
                  monthlyDataStr={"monthly_HDD_avg"}
                  annualDataStr={"annual_HDD_avg"}
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
                  heading="Total Rainy Days"
                  monthlyDataStr={"monthly_precip_days_avg"}
                  annualDataStr={"annual_precip_days_avg"}
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
                  heading="Total Snowy Days"
                  monthlyDataStr={"monthly_snow_days_avg"}
                  annualDataStr={"annual_snow_days_avg"}
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
                  monthlyDataStr={"monthly_sunshine_days_avg"}
                  annualDataStr={"annual_sunshine_days_avg"}
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
                  monthlyDataStr={"monthly_sun_angle"}
                  annualDataStr={"annual_sun_angle_avg"}
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
                Yearly Dewpoint and Humidity
              </Typography>

              <ClimateChart
                datasetProp={humidityDataset(locations)}
                units={"%"}
              ></ClimateChart>
              <p style={{ textAlign: "center" }}>
                Average humidity percentage for each month. The table contains
                the average dewpoint for each month. The dewpoint is a measure
                of absolute humidity in the air, rather than the relative
                humidity percentage which changes with temperature. Dewpoint
                values bellow 50 degrees are plesant, around 60 degrees begins
                to feel humid, 70 degrees is very muggy, and above 75 is
                extremely humid.
              </p>

              <div>
                <Table
                  locations={locations}
                  heading="Average Dewpoint (°F)"
                  monthlyDataStr={"monthly_dewpoint_avg"}
                  annualDataStr={"annual_dewpoint_avg"}
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
                  heading="Highest Expected Daily Wind Speed"
                  monthlyDataStr={"monthly_wind_gust_peak"}
                  annualDataStr={"annual_wind_gust_peak"}
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
                Yearly Comfort Rating
              </Typography>
              <ClimateChart
                datasetProp={comfortDataset(locations)}
              ></ClimateChart>
              <p style={{ textAlign: "center" }}>
                Average comfort rating for each month. The table contains the
                average comfort rating for each month. The comfort rating is a
                function of temperature, humidity, cloudiness, UV index, and
                wind speed. The higher the comfort rating, the more comfortable
                the weather is. A comfort rating lower than 30 is very harsh,
                and largely unsuitable for human life.
              </p>

              <div>
                <Table
                  locations={locations}
                  heading="Monthly Comfort Rating"
                  monthlyDataStr={"monthly_comfort_index"}
                  annualDataStr={"annual_comfort_index"}
                  decimalTrunc={0}
                ></Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
