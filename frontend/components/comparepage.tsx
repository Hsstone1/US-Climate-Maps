import { MarkerType, ClimateChartDataset } from "./export-props";
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
  const tmaxDataset = (locations: MarkerType[]): ClimateChartDataset[] => {
    const datasets: ClimateChartDataset[] = [];

    locations.forEach((location: MarkerType) => {
      const color = getRandomColor();
      const high_dataset: ClimateChartDataset = {
        type: "line",
        label: location.data.location_data.location,
        data: location.data.monthly_data.weighted_monthly_high_avg,

        //TODO: Assign colors to each location in the list
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
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

        //TODO: Assign colors to each location in the list
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        lineTension: 0.5,
        fill: false,
        yAxisID: "Temperature",
      };

      datasets.push(high_dataset);
      datasets.push(low_dataset);
    });
    //console.log(datasets);
    return datasets;
  };

  return (
    <div className="compare-page">
      <div className="compare-page-scroll">
        <div className="compare_chart-div">
          <p style={{ textAlign: "center" }}>
            Yearly High and Low Temperatures
          </p>
          <ClimateChart datasetProp={tmaxDataset(locations)}></ClimateChart>
          <p>Location 1</p>
        </div>
      </div>
    </div>
  );
}
