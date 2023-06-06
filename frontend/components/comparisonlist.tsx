import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  ListItem,
} from "@material-ui/core";
import { MarkerType } from "./export-props";
import CloseIcon from "@material-ui/icons/Close";

type LocationListProps = {
  locations: MarkerType[];
  onRemoveLocation: (marker: MarkerType) => void;
};

const useStyles = makeStyles({
  root: {
    margin: "0 auto",
    //border: "1px solid #000000",
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "50px",
  },
  scrollableList: {
    height: "60vh",
    overflow: "auto",
  },
});

export default function CompareLocationsList({
  locations,
  onRemoveLocation,
}: LocationListProps) {
  const classes = useStyles();

  // Round to a specific number of decimal places
  const truncDec = (location: number, numDec: number = 0): string => {
    return location.toFixed(numDec);
  };

  const handleRemoveLocation = (marker: MarkerType) => {
    onRemoveLocation(marker);
  };

  return (
    <div className={classes.root}>
      <div className={classes.scrollableList}>
        {locations.map((card) => (
          <Card key={card.id} style={{ marginBottom: 8 }}>
            <CardContent>
              <Typography variant="body2">
                {card.data.location_data.location}
              </Typography>
              <Typography variant="body2">
                {`${truncDec(card.data.location_data.elevation)} ft`}
              </Typography>
            </CardContent>

            <IconButton
              aria-label="Remove"
              size="small"
              onClick={() => handleRemoveLocation(card)}
            >
              <CloseIcon />
            </IconButton>
          </Card>
        ))}
      </div>
    </div>
  );
}
