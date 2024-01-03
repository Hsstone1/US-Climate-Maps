import React, { useState } from "react";
import { InfoWindow } from "@react-google-maps/api";
import { MarkerType, get_image_from_koppen } from "../global-utils";
import ClimateTable from "../climate-table/ClimateTable";

type CustomInfoWindowProps = {
  location: MarkerType;
  handleCloseInfoWindow: (location: MarkerType) => void;
};

export default function CustomInfoWindow({
  location,
  handleCloseInfoWindow,
}: CustomInfoWindowProps) {
  const [expanded, setExpanded] = useState(false);

  const location_name = location.data.location_data.location;
  const elevation = location.data.location_data.elevation;
  const climate_grade = location.data.climate_data["comfort_index"]["annual"];

  return (
    <InfoWindow
      key={location.id + "_infowindow"}
      position={{ lat: location.lat, lng: location.lng }}
      options={{
        disableAutoPan: true,
      }}
      onCloseClick={() => handleCloseInfoWindow(location)}
    >
      <div className="infowindow-container">
        {!expanded && (
          <>
            <div className="infowindow_collapsed"></div>
            <img
              src={get_image_from_koppen(location)}
              alt={location.data.location_data.location}
              className="infowindow-background-image"
            />
            <div className="info-box">
              <div className="location">{location_name}</div>
              <div className="elevation">{`${elevation.toFixed(0)} ft`}</div>
            </div>
            <div className="grade-box">{climate_grade.toFixed(0)}</div>
            <button
              className="infowindow-expand-button"
              onClick={() => setExpanded(true)}
            >
              ▲ Show more
            </button>
          </>
        )}

        {expanded && (
          <>
            <p className="infowindow-title">{`${location_name} (${elevation.toFixed(
              0
            )} ft)`}</p>

            <div className="infowindow-climate_table">
              <ClimateTable data={location.data} />
            </div>
            <button
              className="infowindow-expand-button"
              onClick={() => setExpanded(false)}
            >
              ▼ Show less
            </button>
          </>
        )}
      </div>
    </InfoWindow>
  );
}
