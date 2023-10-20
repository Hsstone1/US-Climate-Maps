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

  const mapClimateData = (key: string) =>
    data.climate_data.avg_monthly.map(
      (month: { [key: string]: any }) => month[key]
    );

  const climateData = data.climate_data.avg_annual;

  return (
    <table style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th colSpan={20}>
            <div>
              <p
                style={{ margin: 1, fontSize: "20px", fontWeight: "bold" }}
              >{`${
                data.location_data.location
              } (${data.location_data.elevation.toFixed(0)} ft)`}</p>
              <p
                style={{ margin: 1, fontSize: "16px", fontWeight: "lighter" }}
              >{`${data.location_data.koppen}, ${data.location_data.plant_hardiness}`}</p>
            </div>
          </th>
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
          monthly_data={mapClimateData("record_high_temp")}
          annual_data={climateData.record_high_temp}
          rowTitle="Record High (°F)"
          dataType="Temperature"
          annual_units="°F"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("mean_max_temp")}
          annual_data={climateData.mean_max_temp}
          rowTitle="Expected Max (°F)"
          dataType="Temperature"
          annual_units="°F"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("high_temp")}
          annual_data={climateData.high_temp}
          rowTitle="Average High (°F)"
          dataType="Temperature"
          annual_units="°F"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("mean_temp")}
          annual_data={climateData.mean_temp}
          rowTitle="Daily Average (°F)"
          dataType="Temperature"
          annual_units="°F"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("low_temp")}
          annual_data={climateData.low_temp}
          rowTitle="Average Low (°F)"
          dataType="Temperature"
          annual_units="°F"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("mean_min_temp")}
          annual_data={climateData.mean_min_temp}
          rowTitle="Expected Min (°F)"
          dataType="Temperature"
          annual_units="°F"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("record_low_temp")}
          annual_data={climateData.record_low_temp}
          rowTitle="Record Low (°F)"
          dataType="Temperature"
          annual_units="°F"
        ></ClimateTableRow>

        <ClimateTableRow
          monthly_data={mapClimateData("precip_in")}
          annual_data={climateData.precip_in}
          rowTitle="Rainfall (in)"
          dataType="Precip"
          numDec={1}
          divideAnnualBackground={12}
          annual_units=" in"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("precip_days")}
          annual_data={climateData.precip_days}
          rowTitle="Rainy Days"
          dataType="Precip"
          divideAnnualBackground={12}
          annual_units=" days"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("snow_in")}
          annual_data={climateData.snow_in}
          rowTitle="Snowfall (in)"
          dataType="Precip"
          numDec={1}
          divideAnnualBackground={12}
          annual_units=" in"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("snow_days")}
          annual_data={climateData.snow_days}
          rowTitle="Snowy Days"
          dataType="Precip"
          divideAnnualBackground={12}
          annual_units=" days"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("wind_spd")}
          annual_data={climateData.wind_spd}
          rowTitle="Wind (mph)"
          dataType="Precip"
          annual_units=" mph"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("humidity_percent")}
          annual_data={climateData.humidity_percent}
          rowTitle="Humidity (%)"
          dataType="Humidity"
          annual_units="%"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("dewpoint_temp")}
          annual_data={climateData.dewpoint_temp}
          rowTitle="Dewpoint (°F)"
          dataType="Temperature"
          annual_units="°F"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("uv_index")}
          annual_data={climateData.uv_index}
          rowTitle="UV Index"
          dataType="UV Index"
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("sunshine_hours")}
          annual_data={climateData.sunshine_hours}
          rowTitle="Sunshine Hours"
          dataType="SunHours"
          divideAnnualBackground={12}
        ></ClimateTableRow>
        <ClimateTableRow
          monthly_data={mapClimateData("sunshine_percent")}
          annual_data={climateData.sunshine_percent}
          rowTitle="Percent Sunshine"
          dataType="SunPercent"
          annual_units="%"
        ></ClimateTableRow>
      </tbody>
    </table>
  );
}
