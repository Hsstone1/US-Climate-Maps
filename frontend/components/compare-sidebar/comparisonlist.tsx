import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Card, CardContent, Typography, IconButton } from "@material-ui/core";
import { MarkerType, LocationColors } from "../export-props";
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
        {locations.map((card, index) => (
          <Card
            key={card.id}
            style={{
              marginBottom: 4,
              border: `3px solid ${LocationColors(1)[index]}`,
              padding: 0,
            }}
          >
            <CardContent>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    whiteSpace: "nowrap", // Prevent line breaks
                    textOverflow: "ellipsis",
                  }}
                >
                  <Typography
                    variant="body2"
                    style={{
                      overflow: "hidden",
                      whiteSpace: "nowrap", // Prevent line breaks
                      textOverflow: "ellipsis", // Display ellipsis (...) for overflow
                    }}
                  >
                    {card.data.location_data.location}
                  </Typography>
                  <Typography variant="body2">{`${truncDec(
                    card.data.location_data.elevation
                  )} ft`}</Typography>
                </div>
                <IconButton
                  aria-label="Remove"
                  size="small"
                  onClick={() => handleRemoveLocation(card)}
                  style={{ margin: "auto" }}
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
