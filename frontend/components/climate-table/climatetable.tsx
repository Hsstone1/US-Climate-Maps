import ClimateTableRow from "./climatetablerow";
type TableProps = {
  data: any;
};

export default function ClimateTable({ data }: TableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th colSpan={14}>{`${
            data.location_data.location
          } ${data.location_data.elevation.toFixed(0)} ft`}</th>
        </tr>
        <tr>
          <th>Value</th>
          <th>Jan</th>
          <th>Feb</th>
          <th>Mar</th>
          <th>Apr</th>
          <th>May</th>
          <th>Jun</th>
          <th>Jul</th>
          <th>Aug</th>
          <th>Sep</th>
          <th>Oct</th>
          <th>Nov</th>
          <th>Dec</th>
          <th>Year</th>
        </tr>
      </thead>
      <tbody>
        <ClimateTableRow
          monthly_data={data.monthly_data.weighted_monthly_record_high}
          annual_data={data.annual_data.weighted_annual_record_high}
          rowTitle="Record High"
        ></ClimateTableRow>
      </tbody>
    </table>
  );
}
