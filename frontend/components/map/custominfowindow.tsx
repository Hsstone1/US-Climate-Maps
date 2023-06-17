import { FaCloudRain, FaSnowflake, FaSun } from "react-icons/fa";
import { InfoWindow } from "@react-google-maps/api";
import { MarkerType } from "../export-props";
import IndowWindowChart from "./infowindowchart";

type CustomInfoWindowProps = {
  marker: MarkerType;
  handleCompareMarker: (marker: MarkerType) => void;
  handleRemoveMarker: (marker: MarkerType) => void;
};

export default function CustomInfoWindow({
  marker,
  handleCompareMarker,
  handleRemoveMarker,
}: CustomInfoWindowProps) {
  return (
    <InfoWindow
      key={marker.id + "_infowindow"}
      position={{ lat: marker.lat, lng: marker.lng }}
      options={{
        disableAutoPan: true,
        minWidth: 300,
      }}
    >
      <div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0 }}>
            {marker.data.location_data.location}
            {marker.data.location_data.elevation > 1000
              ? ` (${Math.round(
                  marker.data.location_data.elevation
                ).toLocaleString()} ft)`
              : ""}
          </p>
          <p style={{ margin: 5, fontSize: "10px" }}>
            {`${marker.data.location_data.koppen}, ${marker.data.location_data.plant_hardiness}`}
          </p>
        </div>

        <div style={{ fontSize: "10px", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <FaCloudRain style={{ color: "#7e878c", fontSize: "12px" }} />
              <span>
                {`${marker.data.annual_data.annual_precip_days_avg.toFixed(
                  0
                )} days `}
                ({`${marker.data.annual_data.annual_precip_avg.toFixed(0)} in`})
              </span>
            </div>
            <div
              style={{
                borderLeft: "1px solid #808080",
                height: "20px",
                margin: "0 5px",
              }}
            ></div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <FaSnowflake style={{ color: "#b0b0b0", fontSize: "12px" }} />
              <span>
                {`${marker.data.annual_data.annual_snow_days_avg.toFixed(
                  0
                )} days `}
                ({`${marker.data.annual_data.annual_snow_avg.toFixed(0)} in`})
              </span>
            </div>
            <div
              style={{
                borderLeft: "1px solid #808080",
                height: "20px",
                margin: "0 5px",
              }}
            ></div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <FaSun style={{ color: "#f7db25", fontSize: "12px" }} />
              <span>
                {`${marker.data.annual_data.annual_sunshine_days_avg.toFixed(
                  0
                )} days `}
                (
                {`${(marker.data.annual_data.annual_sunshine_avg * 100).toFixed(
                  0
                )}%`}
                )
              </span>
            </div>
          </div>
        </div>

        <IndowWindowChart marker={marker} />

        <div className="iw-marker-buttons">
          <button
            className="iw-marker-button-remove"
            onClick={() => handleRemoveMarker(marker)}
          >
            Remove Location
          </button>

          <button
            className="iw-marker-button-compare"
            onClick={() => handleCompareMarker(marker)}
          >
            Compare Location
          </button>
        </div>
      </div>
    </InfoWindow>
  );
}
