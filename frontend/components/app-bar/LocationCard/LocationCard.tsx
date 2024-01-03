import React from "react";
import {
  MarkerType,
  S3_IMAGE_BUCKET_URL,
  get_image_from_koppen,
} from "../../global-utils";

export type LocationCardProps = {
  location: MarkerType;
  onAddRemove: (location: MarkerType) => void;
  onDelete: (location: MarkerType) => void;
};

const LocationCard = ({
  location,
  onAddRemove,
  onDelete,
}: LocationCardProps) => {
  const image = get_image_from_koppen(location);
  const elevation = location.data.location_data.elevation;
  const climate_grade = location.data.climate_data["comfort_index"]["annual"];
  const location_name = location.data.location_data.location;

  return (
    <div className="location-card">
      <img src={image} alt={location_name} className="card-background-image" />

      <button className="add-remove-btn" onClick={() => onAddRemove(location)}>
        +
      </button>
      <button className="delete-btn" onClick={() => onDelete(location)}>
        x
      </button>

      <div className="info-box">
        <div className="location">{location_name}</div>
        <div className="elevation">{`${elevation.toFixed(0)} ft`}</div>
      </div>

      <div className="grade-box">{climate_grade.toFixed(0)}</div>
    </div>
  );
};

export default LocationCard;
