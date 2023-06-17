import { TemperatureColors, PrecipColors, SunColors } from "./colors";

type ClimateTableRowProps = {
  monthly_data: any;
  annual_data: any;
  rowTitle: string;
  dataType:
    | "Temperature"
    | "Precip"
    | "Snow"
    | "Humidity"
    | "SunHours"
    | "SunPercent";
  numDec?: number;
  divideAnnualBackground?: 1 | 12;
};

export default function ClimateTableRow({
  monthly_data,
  annual_data,
  rowTitle,
  dataType,
  numDec = 0,
  divideAnnualBackground = 1,
}: ClimateTableRowProps) {
  const getBackgroundColor = (value: number, dataType: string) => {
    if (dataType === "Temperature") {
      //Degrees F, -20 is dark blue, 130 is dark red
      const lowerValue = -20;
      const upperValue = 130;
      if (value > upperValue) {
        return TemperatureColors[TemperatureColors.length - 1];
      }
      if (value < lowerValue) {
        return TemperatureColors[0];
      }
      return TemperatureColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (TemperatureColors.length - 1)
        )
      ];
    } else if (dataType === "Precip") {
      //Inches of rain per month 0 is light blue, 12 is dark blue

      const lowerValue = 0;
      const upperValue = 12;
      if (value > upperValue) {
        return PrecipColors[PrecipColors.length - 1];
      }
      if (value < lowerValue) {
        return PrecipColors[0];
      }
      return PrecipColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (PrecipColors.length - 1)
        )
      ];
    } else if (dataType === "Humidity") {
      //Inches of rain per month 0 is light blue, 12 is dark blue

      const lowerValue = 20;
      const upperValue = 90;
      if (value > upperValue) {
        return PrecipColors[PrecipColors.length - 1];
      }
      if (value < lowerValue) {
        return PrecipColors[0];
      }
      return PrecipColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (PrecipColors.length - 1)
        )
      ];
    } else if (dataType === "SunHours") {
      //Inches of rain per month 0 is light blue, 12 is dark blue

      const lowerValue = 0;
      const upperValue = 400;
      if (value > upperValue) {
        return SunColors[SunColors.length - 1];
      }
      if (value < lowerValue) {
        return SunColors[0];
      }
      return SunColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (SunColors.length - 1)
        )
      ];
    } else if (dataType === "SunPercent") {
      //Inches of rain per month 0 is light blue, 12 is dark blue

      const lowerValue = 0;
      const upperValue = 100;
      if (value > upperValue) {
        return SunColors[SunColors.length - 1];
      }
      if (value < lowerValue) {
        return SunColors[0];
      }
      return SunColors[
        Math.round(
          ((value + Math.abs(lowerValue)) /
            (upperValue + Math.abs(lowerValue))) *
            (SunColors.length - 1)
        )
      ];
    }
  };

  const getTextColor = (value: number, dataType: string) => {
    if (dataType === "Temperature") {
      return value >= 89.5 || value <= 0 ? "#FFFFFF" : "#000000";
    } else if (dataType === "Precip") {
      return value >= 4 ? "#FFFFFF" : "#000000";
    } else if (dataType === "Humidity") {
      return value >= 30 ? "#FFFFFF" : "#000000";
    }
  };

  return (
    <tr>
      <td
        style={{
          border: "1px solid black",
          padding: 8,
        }}
      >
        {rowTitle}
      </td>
      {monthly_data.map((value: any, index: any) => (
        <td
          key={index}
          style={{
            backgroundColor: getBackgroundColor(value, dataType),
            color: getTextColor(value, dataType),
            textAlign: "center",
            border: "1px solid black",
            padding: 8,
          }}
        >
          {value.toFixed(numDec)}
        </td>
      ))}

      <td
        style={{
          //sometimes the annual value and monthly value represent two different colors,
          //so the annual value is divided by 12 to match the monthly value background.
          //Precipitation values are a good example of this
          backgroundColor: getBackgroundColor(
            annual_data / divideAnnualBackground,
            dataType
          ),
          color: getTextColor(annual_data / divideAnnualBackground, dataType),
          textAlign: "center",
          border: "1px solid black",
          padding: 8,
        }}
      >
        {annual_data.toFixed(numDec)}
      </td>
    </tr>
  );
}
