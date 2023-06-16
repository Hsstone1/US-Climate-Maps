import { ClimateChartDataset } from "./comparepageprops";

import { MarkerType, LocationColors } from "../export-props";
import ClimateChart from "./climatechart";
import Table from "./comparepagetable";
import ClimateTablePaginate from "../climate-table/climatetablepaginate";

type ComparisonPageProps = {
  locations: MarkerType[];
};

const getRandomRgbValue = () => Math.floor(Math.random() * 256);
const getRandomColor = () => {
  const r = getRandomRgbValue();
  const g = getRandomRgbValue();
  const b = getRandomRgbValue();
  return `rgba(${r}, ${g}, ${b}, 0.7)`;
};

export default function ComparisonPage({ locations }: ComparisonPageProps) {
  const highlowDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];

    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(0.7)[index];
      const high_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_high_avg,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
        fill: false,
        yAxisID: "Temperature",
      };

      const low_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_low_avg,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
        fill: false,
        yAxisID: "Temperature",
      };

      datasets.push(high_dataset);
      datasets.push(low_dataset);
    });
    return datasets;
  };

  const precipDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(0.7)[index];
      const precip_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_precip_avg,

        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
        fill: false,
        yAxisID: "Precip",
      };

      datasets.push(precip_dataset);
    });
    return datasets;
  };

  const snowDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(0.7)[index];
      const snow_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_snow_avg,

        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
        fill: false,
        yAxisID: "Precip",
      };

      datasets.push(snow_dataset);
    });
    return datasets;
  };

  const sunshineDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(0.7)[index];
      const sunshine_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_sunshine_avg,

        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
        fill: false,
        yAxisID: "Sunshine_Percentage",
      };

      datasets.push(sunshine_dataset);
    });
    return datasets;
  };

  const humidityDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(0.7)[index];
      const humidity_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_humidity_avg,

        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
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
      const color = LocationColors(0.7)[index];
      const wind_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_wind_gust_avg,

        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
        fill: false,
        yAxisID: "Wind",
      };

      datasets.push(wind_dataset);
    });
    return datasets;
  };

  const growingDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = LocationColors(0.7)[index];
      const frostfree_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_frost_free_days_avg,

        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.35,
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
        <div className="compare_chart-div">
          {/* <ClimateTablePaginate locations={locations}></ClimateTablePaginate> */}

          <h3 style={{ textAlign: "center" }}>
            Yearly High and Low Temperatures
          </h3>
          <ClimateChart datasetProp={highlowDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Average high and low temperatures for each month. The average
            expected maximumum and miniminum temperaturees for each month are
            displayed in the table. The record high and low is provided in the
            annual column.
          </p>
          <div>
            <Table
              locations={locations}
              heading="Mean Maximum Temperature (°F)"
              monthlyDataStr={"weighted_monthly_mean_maximum"}
              annualDataStr={"weighted_annual_record_high"}
              decimalTrunc={0}
              units={" °F"}
            ></Table>

            <br />

            <Table
              locations={locations}
              heading="Mean Minimum Temperature (°F)"
              monthlyDataStr={"weighted_monthly_mean_minimum"}
              annualDataStr={"weighted_annual_record_low"}
              decimalTrunc={0}
              units={" °F"}
            ></Table>
          </div>
          <br />
          <hr />
          <br />
          <h3 style={{ textAlign: "center" }}>Yearly Rainfall</h3>
          <ClimateChart datasetProp={precipDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Rainfall in inches for each month. The total number of rainy days
            expected for each month, along with the annual total are displayed
            in the table. A rainy day is counted if there is more than 0.01
            inches of accumulation.
          </p>
          <div>
            <Table
              locations={locations}
              heading="Total Rainy Days"
              monthlyDataStr={"weighted_monthly_precip_days_avg"}
              annualDataStr={"weighted_annual_precip_days_avg"}
              decimalTrunc={0}
              units={" days"}
            ></Table>
          </div>

          <br />
          <hr />
          <br />
          <h3 style={{ textAlign: "center" }}>Yearly Snowfall</h3>
          <ClimateChart datasetProp={snowDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Snowfall in inches for each month. The total number of snowy days
            expected for each month, along with the annual total are displayed
            in the table. A snowy day is counted if there is more than 0.1
            inches of accumulation.
          </p>

          <div>
            <Table
              locations={locations}
              heading="Total Snowy Days"
              monthlyDataStr={"weighted_monthly_snow_days_avg"}
              annualDataStr={"weighted_annual_snow_days_avg"}
              decimalTrunc={0}
              units={" days"}
            ></Table>
          </div>

          <br />
          <hr />
          <br />
          <h3 style={{ textAlign: "center" }}>Yearly Sunshine</h3>
          <ClimateChart datasetProp={sunshineDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Percent possible sunshine for each month. The total number of sunny
            days expected for each month, along with the annual total are
            displayed in the table. A sunny day is counted if the sun is out
            more than 30% of each day.
          </p>

          <div>
            <Table
              locations={locations}
              heading="Total Sunny Days"
              monthlyDataStr={"weighted_monthly_sunshine_days_avg"}
              annualDataStr={"weighted_annual_sunshine_days_avg"}
              decimalTrunc={0}
              units={" days"}
            ></Table>
          </div>

          <br />
          <hr />
          <br />
          <h3 style={{ textAlign: "center" }}>Yearly Dewpoint and Humidity</h3>
          <ClimateChart datasetProp={humidityDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Average humidity percentage for each month. The table contains the
            average dewpoint for each month. The dewpoint is a measure of
            absolute humidity in the air, rather than the relative humidity
            percentage which changes with temperature. Dewpoint values bellow 50
            degrees are plesant, around 60 degrees begins to feel humid, 70
            degrees is very muggy, and above 75 is extremely humid.
          </p>

          <div>
            <Table
              locations={locations}
              heading="Average Dewpoint (°F)"
              monthlyDataStr={"weighted_monthly_dewpoint_avg"}
              annualDataStr={"weighted_annual_dewpoint_avg"}
              decimalTrunc={0}
              units={" °F"}
            ></Table>
          </div>

          <br />
          <hr />
          <br />
          <h3 style={{ textAlign: "center" }}>Yearly Wind Speed</h3>
          <ClimateChart datasetProp={windDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Average wind speed for each month. The table contains the highest
            average expected wind speed for a day for each month.
          </p>

          <div>
            <Table
              locations={locations}
              heading="Highest Expected Daily Wind Speed"
              monthlyDataStr={"weighted_monthly_wind_gust_peak"}
              annualDataStr={"weighted_annual_wind_gust_peak"}
              decimalTrunc={0}
              units={" mph"}
            ></Table>
          </div>

          <br />
          <hr />
          <br />
          <h3 style={{ textAlign: "center" }}>Yearly Growing Season</h3>
          <ClimateChart datasetProp={growingDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Average frost free growing season. The table contains the monthly
            Cooling Degree Days (CDD) and Heating Degree Days (HDD), which is a
            function of average temperatures for the day bellow and above 65
            degrees, respectively.
          </p>

          <div>
            <Table
              locations={locations}
              heading="Cooling Degree Days (CDD)"
              monthlyDataStr={"weighted_monthly_CDD_avg"}
              annualDataStr={"weighted_annual_CDD_avg"}
              decimalTrunc={0}
              units={""}
            ></Table>

            <Table
              locations={locations}
              heading="Heating Degree Days (HDD)"
              monthlyDataStr={"weighted_monthly_HDD_avg"}
              annualDataStr={"weighted_annual_HDD_avg"}
              decimalTrunc={0}
              units={""}
            ></Table>
          </div>
          <br />
          <br />
        </div>
      </div>
    </div>
  );
}
