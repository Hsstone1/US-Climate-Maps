import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Card, CardContent, Typography, IconButton } from "@material-ui/core";
import { MarkerType, LocationColors } from "../export-props";
import CloseIcon from "@material-ui/icons/Close";

type LocationListProps = {
  locations: MarkerType[];
  onRemoveLocation: (marker: MarkerType) => void;
};

const useStyles = makeStyles({
  card: {
    display: "inline-block", // Display cards inline
    marginRight: "10px", // Add some spacing between cards
    borderBottom: "4px solid", // Add border to the card
    width: "230px", // Set the max-width of the card
    height: "40px", // Set the max-height of the card
    padding: 0, // Remove internal padding
    borderRadius: 0, // Remove border radius
  },
  cardContent: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px", // Adjust padding as needed
  },
  typography: {
    margin: 0, // Remove margin from Typography
    flexGrow: 1, // Allow text to take available space
  },
  iconButton: {
    padding: "4px", // Adjust padding as needed
  },
});

export default function CompareLocationsList({
  locations,
  onRemoveLocation,
}: LocationListProps) {
  const classes = useStyles();

  const handleRemoveLocation = (marker: MarkerType) => {
    onRemoveLocation(marker);
  };

  return (
    <div>
      {locations.map((card, index) => (
        <Card
          key={card.id}
          className={classes.card}
          style={{ borderColor: LocationColors(1)[index] }}
        >
          <CardContent className={classes.cardContent}>
            <Typography variant="body2" noWrap className={classes.typography}>
              {card.data.location_data.location}
            </Typography>

            <IconButton
              aria-label="Remove"
              size="small"
              onClick={() => handleRemoveLocation(card)}
              className={classes.iconButton}
            >
              <CloseIcon />
            </IconButton>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
