import { TemperatureColors } from "./colors";

type ClimateTableRowProps = {
  monthly_data: any;
  annual_data: any;
  rowTitle: string;
};

export default function ClimateTableRow({
  monthly_data,
  annual_data,
  rowTitle,
}: ClimateTableRowProps) {
  const getTemperatureColor = (value: number) => {
    // Clamp the value between -30 and 148
    const clampedValue = Math.max(-30, Math.min(148, value));

    // Calculate the index based on the clamped value
    const index = Math.floor((clampedValue + 30) / 2);

    return TemperatureColors[index];
  };

  return (
    <tr>
      <td>{rowTitle}</td>
      {monthly_data.map((value: any, index: any) => (
        <td key={index} style={{ backgroundColor: getTemperatureColor(value) }}>
          {value.toFixed(0)}
        </td>
      ))}

      <td style={{ backgroundColor: getTemperatureColor(annual_data) }}>
        {annual_data.toFixed(0)}
      </td>
    </tr>
  );
}
