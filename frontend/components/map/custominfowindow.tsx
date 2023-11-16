import React, { useState } from "react";
import { InfoWindow } from "@react-google-maps/api";
import { MarkerType } from "../location-props";
import ClimateTable from "../climate-table/climatetable";

type CustomInfoWindowProps = {
  marker: MarkerType;
  handleCloseInfoWindow: (marker: MarkerType) => void;
};

export default function CustomInfoWindow({
  marker,
  handleCloseInfoWindow,
}: CustomInfoWindowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <InfoWindow
      key={marker.id + "_infowindow"}
      position={{ lat: marker.lat, lng: marker.lng }}
      options={{
        disableAutoPan: true,
      }}
      onCloseClick={() => handleCloseInfoWindow(marker)}
    >
      <div>
        {!expanded && (
          <p style={{ margin: 0 }}>
            {marker.data.location_data.location}
            {` (${Math.round(
              marker.data.location_data.elevation
            ).toLocaleString()} ft)`}
          </p>
        )}

        {expanded && (
          <div className="compare_climate_table-div">
            <ClimateTable data={marker.data} />
          </div>
        )}

        {!expanded && (
          <div
            style={{ textAlign: "center", cursor: "pointer" }}
            onClick={() => setExpanded(true)}
          >
            <span>▲ Show more</span>
          </div>
        )}

        {expanded && (
          <div
            style={{ textAlign: "center", cursor: "pointer" }}
            onClick={() => setExpanded(false)}
          >
            <span>▼ Show less</span>
          </div>
        )}
      </div>
    </InfoWindow>
  );
}
