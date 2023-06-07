import { MarkerType, ClimateChartDataset, Colors } from "./export-props";
import ClimateChart from "./climatechart";

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
      const color = Colors(0.7)[index];
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
      const color = Colors(0.7)[index];
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
      const color = Colors(0.7)[index];
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
      const color = Colors(0.7)[index];
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
      const color = Colors(0.7)[index];
      const dewpoint_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_dewpoint_avg,

        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
        fill: false,
        yAxisID: "Temperature",
      };

      datasets.push(dewpoint_dataset);
    });
    return datasets;
  };

  const windDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];
    locations.forEach((location: MarkerType, index) => {
      const color = Colors(0.7)[index];
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
      const color = Colors(0.7)[index];
      const frostfree_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_frost_free_days_avg,

        backgroundColor: color,
        borderColor: color,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
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
          <p style={{ textAlign: "center" }}>
            Yearly High and Low Temperatures
          </p>
          <ClimateChart datasetProp={highlowDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>High and Low Temperatures</p>
          <br />
          <hr />
          <br />
          <p style={{ textAlign: "center" }}>Yearly Rainfall</p>
          <ClimateChart datasetProp={precipDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>Rainfall in inches</p>

          <br />
          <hr />
          <br />
          <p style={{ textAlign: "center" }}>Yearly Snowfall</p>
          <ClimateChart datasetProp={snowDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>Snow in inches</p>

          <br />
          <hr />
          <br />
          <p style={{ textAlign: "center" }}>Yearly Sunshine</p>
          <ClimateChart datasetProp={sunshineDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>Percent Possible Sunshine</p>

          <br />
          <hr />
          <br />
          <p style={{ textAlign: "center" }}>Yearly Dewpoint and Humidity</p>
          <ClimateChart datasetProp={humidityDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Measure of absolute and relative humidity
          </p>

          <br />
          <hr />
          <br />
          <p style={{ textAlign: "center" }}>Yearly Wind Speed</p>
          <ClimateChart datasetProp={windDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>Average Wind Gust Speed</p>

          <br />
          <hr />
          <br />
          <p style={{ textAlign: "center" }}>Yearly Growing Season</p>
          <ClimateChart datasetProp={growingDataset(locations)}></ClimateChart>
          <p style={{ textAlign: "center" }}>
            Percentage of time each month above freezing
          </p>
        </div>
      </div>
    </div>
  );
}
