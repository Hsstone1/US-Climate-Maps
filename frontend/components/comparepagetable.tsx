import {
  MarkerType,
  ClimateChartDataset,
  Colors,
  MonthLabels,
  MonthlyDataStr,
  AnnualDataStr,
} from "./export-props";

type ComparisonPageProps = {
  locations: MarkerType[];
  heading: string; //'Mean Maximum'
  monthlyDataStr: string; //'weighted_monthly_mean_maximum'
  annualDataStr: string; //'weighted_annual_record_high'
  decimalTrunc: number;
  units?: string;
};

const TemperatureTable = ({
  locations,
  heading,
  monthlyDataStr,
  annualDataStr,
  decimalTrunc,
  units = "",
}: ComparisonPageProps) => {
  const monthlyDataArr = locations.map(
    (location) => location.data.monthly_data
  );
  const filteredMonthlyDataArr = monthlyDataArr.map(
    (data) => data[monthlyDataStr]
  );

  const annualDataArr = locations.map((location) => location.data.annual_data);
  const filteredAnnualDataArr = annualDataArr.map(
    (data) => data[annualDataStr]
  );

  return (
    <div>
      <h4 style={{ textAlign: "center" }}>{heading}</h4>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid black" }}>Location</th>
            {MonthLabels.map((month) => (
              <th
                key={month}
                style={{ border: "1px solid black", textAlign: "center" }}
              >
                {month}
              </th>
            ))}
            <th style={{ border: "1px solid black", textAlign: "center" }}>
              Annual
            </th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location, index) => (
            <tr key={location.data.location_data.location}>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {location.data.location_data.location}
              </td>

              {filteredMonthlyDataArr[index].map((value: number, i: number) => (
                <td
                  key={i}
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                  }}
                >
                  {value.toFixed(decimalTrunc)}
                </td>
              ))}
              <td style={{ border: "1px solid black", textAlign: "center" }}>
                {filteredAnnualDataArr[index].toFixed(decimalTrunc) + units}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TemperatureTable;
