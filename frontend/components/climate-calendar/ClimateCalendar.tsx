import React, { useEffect, useState } from "react";
import { Box, Typography, Card, Select, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  dayOfYearToDate,
  getFirstDayOfMonth,
  isDayInMonth,
  MonthLabels,
  DaysOfWeekLabels,
  getLastDayOfMonth,
} from "../compare-page/climate-chart-helpers";

import CustomSlider from "../CustomSlider";
import { getTemperatureColor } from "../data-value-colors";

// Styled components
const StyledCalendarBox = styled(Box)(() => ({
  border: "1px solid black",
  margin: "0px",
}));
const StyledWeekContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
}));

const StyledDayCard = styled(Card)(() => ({
  flex: "1 0 calc(100% / 7)", // Flex grow, flex shrink, flex basis
  border: "1px solid black",
  padding: "0px",
  margin: "0px",
  height: "100px", // Adjust the height as needed
  width: "100px",
  textAlign: "center",
  cursor: "pointer",

  paddingLeft: "0.5rem",
  paddingRight: "0.5rem",

  "&:hover": {
    backgroundColor: "#F0F0F0",
  },
}));

const StyledWeekdayHeading = styled(Typography)(() => ({
  flex: "1 0 calc(100% / 7)", // Flex grow, flex shrink, flex basis

  border: "1px solid black",
  backgroundColor: "#303030",
  padding: "0px",
  margin: "0px",
  textAlign: "center",
  color: "#FFFFFF",
  height: "20px", // Adjust the height as needed
}));

const StyledDetailCard = styled(Card)(() => ({
  flex: "1 0 calc(100% / 4)", // Adjust for 4 cards per row
  // ... Other styles similar to StyledDayCard
}));

type CalendarProps = {
  climateData: any;
  selectedYear: string;
  record_high_data: any;
  record_low_data: any;
};

export default function ClimateCalendar({
  climateData,
  selectedYear,
  record_high_data,
  record_low_data,
}: CalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const daysInSet = climateData["high_temperature"]["daily"].length;
  const recordHighBooleans = climateData["high_temperature"]["daily"].map(
    (temp: any, index: string | number) => temp === record_high_data[index]
  );
  const recordLowBooleans = climateData["low_temperature"]["daily"].map(
    (temp: any, index: string | number) => temp === record_low_data[index]
  );
  const handleDayClick = (dayOfYear: number) => {
    setSelectedDay(dayOfYear);
  };

  // Reset selectedDay when selectedMonth or selectedYear changes
  useEffect(() => {
    setSelectedDay(null);
  }, [selectedMonth, selectedYear]);

  const getDayData = (dayOfYear: number) => {
    return {
      high: climateData["high_temperature"]["daily"][dayOfYear],
      low: climateData["low_temperature"]["daily"][dayOfYear],
      //This will be changed to an actual condition predicted in the backend
      weatherCondition: climateData["precipitation"]["daily"][dayOfYear],
      precip: climateData["precipitation"]["daily"][dayOfYear],
      snow: climateData["snow"]["daily"][dayOfYear],
      sun: climateData["sun"]["daily"][dayOfYear],
    };
  };

  const renderWeekdayHeadings = () => {
    return (
      <StyledWeekContainer>
        {DaysOfWeekLabels.map((day) => (
          <StyledWeekdayHeading key={day}>
            <Typography variant="body2">{day}</Typography>
          </StyledWeekdayHeading>
        ))}
      </StyledWeekContainer>
    );
  };

  const renderDay = (dayOfYear: number) => {
    const dateStr = dayOfYearToDate(dayOfYear, parseInt(selectedYear));
    const [month, day] = dateStr.split("/").map(Number);
    if (!isDayInMonth(dayOfYear, parseInt(selectedYear), selectedMonth))
      return null;

    const dayData = getDayData(dayOfYear);
    const isSelected = selectedDay === dayOfYear;
    const isHighestTemp = recordHighBooleans[dayOfYear];
    const isLowestTemp = recordLowBooleans[dayOfYear];
    let weatherIcon = " ";
    if (dayData.sun > 70) {
      weatherIcon += "☀️"; // Sun icon
    } else if (dayData.sun > 40) {
      weatherIcon += "🌤️"; // Partly cloudy icon
    } else {
      weatherIcon += "☁️"; // Cloudy icon
    }

    return (
      <StyledDayCard key={dayOfYear} onClick={() => handleDayClick(dayOfYear)}>
        <Typography
          variant="h6"
          align="left"
          color={isSelected ? "#FFD700" : "#000000"}
        >
          {day}
          <span>{weatherIcon}</span>

          {isHighestTemp && <span style={{ color: "red" }}> ▲</span>}
          {isLowestTemp && <span style={{ color: "blue" }}> ▼</span>}
        </Typography>
        <Typography variant="body1">
          <span
            style={{
              color: getTemperatureColor(dayData.high),
            }}
          >
            {dayData.high.toFixed(0)}°
          </span>
          |
          <span
            style={{
              color: getTemperatureColor(dayData.low),
            }}
          >
            {dayData.low.toFixed(0)}°
          </span>
        </Typography>
        {dayData.precip > 0.01 && (
          <Typography variant="body2">
            <span>💧 </span>
            {dayData.precip.toFixed(2)} in
          </Typography>
        )}

        {dayData.snow > 0.1 && (
          <Typography variant="body2">
            <span>❄️ </span>
            {dayData.snow.toFixed(1)} in
          </Typography>
        )}
      </StyledDayCard>
    );
  };

  const renderCalendarDays = () => {
    const startDay = getFirstDayOfMonth(parseInt(selectedYear), selectedMonth);
    const days = Array.from({ length: daysInSet })
      .map((_, index) => renderDay(index))
      .filter(Boolean);

    // Start days from the first day of the month
    const emptyStartDays = Array.from({ length: startDay }).map((_, index) => (
      <StyledDayCard key={`empty-start-${index}`} />
    ));

    const lastDayOfMonth = getLastDayOfMonth(
      parseInt(selectedYear),
      selectedMonth
    );
    const endDay = new Date(
      parseInt(selectedYear),
      selectedMonth + 1,
      0
    ).getDay();
    const emptyEndDays = Array.from({ length: (6 - endDay) % 7 }).map(
      (_, index) => <StyledDayCard key={`empty-end-${index}`} />
    );

    const calendarDays = [...emptyStartDays, ...days, ...emptyEndDays];

    // Group the days into weeks
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(
        <StyledWeekContainer key={`week-${i}`}>
          {calendarDays.slice(i, i + 7)}
        </StyledWeekContainer>
      );
    }

    return weeks;
  };

  return (
    <StyledCalendarBox>
      <div style={{ width: "100%", paddingLeft: "1rem", paddingRight: "1rem" }}>
        <CustomSlider
          value={selectedMonth}
          marks={MonthLabels.map((month, index) => ({
            value: index,
            label: month,
          }))}
          onChange={(e, value) => setSelectedMonth(value as number)}
          onChangeCommitted={(e, value) => setSelectedMonth(value as number)}
          valueLabelFormat={(value: any) => MonthLabels[value]}
          min={0}
          max={11}
        />
      </div>
      {renderWeekdayHeadings()}
      {renderCalendarDays()}
      {selectedDay !== null && (
        <Box marginTop={2}>
          <Typography variant="h5" style={{ textAlign: "center" }}>
            Details for {dayOfYearToDate(selectedDay, parseInt(selectedYear))}/
            {selectedYear}
          </Typography>
          <Box display="flex" flexDirection="row">
            <StyledDetailCard>
              <span style={{ color: "red" }}> ▲</span>
              {`Record High: ${record_high_data[selectedDay].toFixed(0)}°`}
            </StyledDetailCard>
            <StyledDetailCard>
              <span> ☀️</span>

              {`Sunlight: ${climateData["sun"]["daily"][selectedDay].toFixed(
                0
              )}%`}
            </StyledDetailCard>

            <StyledDetailCard>
              <span>💨</span>
              {`Wind: ${climateData["wind"]["daily"][selectedDay].toFixed(
                0
              )}mph`}
            </StyledDetailCard>
            <StyledDetailCard>
              <span> 🌫️</span>

              {`Humidity: ${climateData["mean_humidity"]["daily"][
                selectedDay
              ].toFixed(0)}%`}
            </StyledDetailCard>
          </Box>
          <Box display="flex" flexDirection="row">
            <StyledDetailCard>
              <span style={{ color: "blue" }}> ▼</span>
              {`Record Low: ${record_low_data[selectedDay].toFixed(0)}°`}
            </StyledDetailCard>
            <StyledDetailCard>
              <span> ☀️</span>

              {`UV Index: ${climateData["uv_index"]["daily"][
                selectedDay
              ].toFixed(0)}`}
            </StyledDetailCard>
            <StyledDetailCard>
              <span>💨</span>

              {`Wind Gust: ${climateData["wind_gust"]["daily"][
                selectedDay
              ].toFixed(0)}mph`}
            </StyledDetailCard>
            <StyledDetailCard>
              <span> 💦</span>
              {`Dewpoint: ${climateData["dewpoint"]["daily"][
                selectedDay
              ].toFixed(0)}°`}
            </StyledDetailCard>
          </Box>
        </Box>
      )}
    </StyledCalendarBox>
  );
}
