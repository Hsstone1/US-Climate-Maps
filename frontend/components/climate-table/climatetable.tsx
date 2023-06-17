import ClimateTableRow from "./climatetablerow";
type TableProps = {
  data: any;
};

export default function ClimateTable({ data }: TableProps) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Year",
  ];
  return (
    <table style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th colSpan={14}>{`${
            data.location_data.location
          } (${data.location_data.elevation.toFixed(0)} ft)`}</th>
        </tr>
        <tr>
          <th style={{ border: "1px solid black" }}>Value</th>
          {monthNames.map((monthName, index) => (
            <th key={index} style={{ border: "1px solid black" }}>
              {monthName}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_record_high}
          annual_data={data.annual_data.annual_record_high}
          rowTitle="Record High (°F)"
          dataType="Temperature"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_mean_maximum}
          annual_data={data.annual_data.annual_mean_maximum}
          rowTitle="Mean Maximum (°F)"
          dataType="Temperature"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_high_avg}
          annual_data={data.annual_data.annual_high_avg}
          rowTitle="Average High (°F)"
          dataType="Temperature"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_mean_avg}
          annual_data={data.annual_data.annual_mean_avg}
          rowTitle="Daily Average (°F)"
          dataType="Temperature"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_low_avg}
          annual_data={data.annual_data.annual_low_avg}
          rowTitle="Average Low (°F)"
          dataType="Temperature"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_mean_minimum}
          annual_data={data.annual_data.annual_mean_minimum}
          rowTitle="Mean Minimum (°F)"
          dataType="Temperature"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_record_low}
          annual_data={data.annual_data.annual_record_low}
          rowTitle="Record Low (°F)"
          dataType="Temperature"
        ></ClimateTableRow>

        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_precip_avg}
          annual_data={data.annual_data.annual_precip_avg}
          rowTitle="Rainfall (in)"
          dataType="Precip"
          numDec={1}
          divideAnnualBackground={12}
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_precip_days_avg}
          annual_data={data.annual_data.annual_precip_days_avg}
          rowTitle="Rainy Days"
          dataType="Precip"
          divideAnnualBackground={12}
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_snow_avg}
          annual_data={data.annual_data.annual_snow_avg}
          rowTitle="Snowfall (in)"
          dataType="Precip"
          divideAnnualBackground={12}
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_snow_days_avg}
          annual_data={data.annual_data.annual_snow_days_avg}
          rowTitle="Snowy Days"
          dataType="Precip"
          divideAnnualBackground={12}
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_humidity_avg}
          annual_data={data.annual_data.annual_humidity_avg}
          rowTitle="Humidity (%)"
          dataType="Humidity"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_dewpoint_avg}
          annual_data={data.annual_data.annual_dewpoint_avg}
          rowTitle="Dewpoint (°F)"
          dataType="Temperature"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_sunshine_hours_avg}
          annual_data={data.annual_data.annual_sunshine_hours_avg}
          rowTitle="Sunshine Hours"
          dataType="SunHours"
          divideAnnualBackground={12}
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={data.monthly_data.monthly_sunshine_avg.map(
            (value: number) => value * 100
          )}
          annual_data={data.annual_data.annual_sunshine_avg * 100}
          rowTitle="Percent Sunshine"
          dataType="SunPercent"
        ></ClimateTableRow>
      </tbody>
    </table>
  );
}
