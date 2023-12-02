import React from "react";
import {
  Button,
  Typography,
  Box,
  Slider,
  Tooltip,
  styled,
} from "@mui/material";

// Custom styling for the Slider component
const StyledSlider = styled(Slider)(({ theme }) => ({
  paddingTop: theme.spacing(0),
  paddingBottom: theme.spacing(0),

  // Adjust the style for the marks' labels
  "& .MuiSlider-markLabel": {
    marginTop: theme.spacing(-2), // Adjust the top margin to bring it closer
    fontSize: "0.7em", // You can also adjust the font size if needed
    // You can also use negative values if needed
  },

  // Adjust the style of the value label to bring it closer to the slider
  "& .MuiSlider-valueLabel": {
    top: 0, // Adjust the top position to bring it closer
  },

  // Adjust the style of the track and thumb for a more compact appearance
  "& .MuiSlider-track": {
    height: 3, // Adjust the track height
  },
  "& .MuiSlider-thumb": {
    height: 20, // Adjust the thumb size
    width: 20, // Adjust the thumb size
  },
}));

type CustomSliderProps = {
  value: number;
  marks: any;
  onChange: (
    event: Event | React.SyntheticEvent<Element, Event>,
    value: number | number[]
  ) => void;
  onChangeCommitted: (
    event: Event | React.SyntheticEvent<Element, Event>,
    value: number | number[]
  ) => void;
  valueLabelFormat: any;
  min: number;
  max: number;
};

const CustomSlider = ({
  value,
  marks,
  onChange,
  onChangeCommitted,
  valueLabelFormat = (value: number) => value.toString(),
  min,
  max,
}: CustomSliderProps) => (
  <StyledSlider
    value={value}
    marks={marks}
    valueLabelDisplay="auto"
    valueLabelFormat={valueLabelFormat}
    onChange={onChange}
    onChangeCommitted={onChangeCommitted}
    min={min}
    max={max}
  />
);

export default CustomSlider;
