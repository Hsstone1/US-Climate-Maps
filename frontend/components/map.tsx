import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { FaCloudRain, FaSnowflake, FaSun } from "react-icons/fa";
import ClimateChart from "./climatechart";
import Places from "./places";

type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;

export default function Map() {
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 38.0, lng: -98.0 }), []);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType[]>([]);

  type MarkerType = {
    key: String;
    lat: number;
    lng: number;
    data: any;
  };

  const mapOptions = useMemo<MapOptions>(
    () => ({
      clickableIcons: false,
      disableDoubleClickZoom: true,
      mapTypeID: google.maps.MapTypeId.TERRAIN,
      maxZoom: 13,
      minZoom: 4,
      mapTypeControl: true,
      fullscreenControl: false,
      streetViewControl: false,
      restriction: {
        latLngBounds: {
          north: 72,
          south: 15,
          west: -170,
          east: -50,
        },
        strictBounds: false,
      },
    }),
    []
  );

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = useCallback((ev: google.maps.MapMouseEvent): void => {
    const latitude = ev.latLng?.lat();
    const longitude = ev.latLng?.lng();

    if (latitude && longitude) {
      handleBackendMarkerData({ lat: latitude, lng: longitude });
    }
  }, []);

  const handleBackendMarkerData = useCallback(
    (position: LatLngLiteral): void => {
      const { lat: latitude, lng: longitude } = position;

      // Send latitude and longitude values to the backend API
      // Get response from post request from backend
      fetch("http://localhost:5000/climate_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Handle the response from the backend API
          const newMarker: MarkerType = {
            key: (latitude + "," + longitude).toString(),
            lat: latitude,
            lng: longitude,
            data: data,
          };
          setSelectedMarker((prevMarkers) => [...prevMarkers, newMarker]);

          console.log(data);
        })
        .catch((error) => {
          // Handle any error that occurred during the request
          console.error(error);
        });
    },
    []
  );

  return (
    <div className="container">
      <div className="side-pannel" style={{ textAlign: "center" }}>
        <h4>US Climate Maps</h4>
        <Places
          setMarker={(position) => {
            handleBackendMarkerData(position);

            mapRef.current?.panTo(position);
          }}
        />
      </div>
      <div className="map">
        <GoogleMap
          zoom={5}
          center={center}
          mapContainerClassName="map-container"
          onLoad={onLoad}
          options={mapOptions}
          onClick={handleMapClick}
        >
          {selectedMarker.map((marker) => (
            <Marker
              key={marker.key.toString()}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() =>
                setSelectedMarker((prevMarkers) => [...prevMarkers, marker])
              }
              visible={true}
            >
              <InfoWindow
                key={marker.key.toString()}
                position={{ lat: marker.lat, lng: marker.lng }}
                options={{
                  disableAutoPan: true,
                }}
              >
                <div>
                  {/* Display the info from the marker. If elevation is above 1000ft, display it */}
                  <div style={{ textAlign: "center" }}>
                    <p>
                      {marker.data.location_data.location.toString()}
                      {marker.data.location_data.elevation > 1000
                        ? ` (${Math.round(
                            marker.data.location_data.elevation
                          ).toLocaleString()} ft)`
                        : ""}
                    </p>
                  </div>

                  <div style={{ fontSize: "10px", textAlign: "center" }}>
                    <div>
                      <FaCloudRain style={{ color: "#7e878c" }} />{" "}
                      {`${marker.data.annual_data.weighted_annual_precip_days_avg.toFixed(
                        0
                      )} days (${marker.data.annual_data.weighted_annual_precip_avg.toFixed(
                        0
                      )} in)`}{" "}
                      &emsp;
                      <FaSnowflake style={{ color: "#b0b0b0" }} />{" "}
                      {`${marker.data.annual_data.weighted_annual_snow_days_avg.toFixed(
                        0
                      )} days (${marker.data.annual_data.weighted_annual_snow_avg.toFixed(
                        0
                      )} in)`}{" "}
                      &emsp;
                      <FaSun style={{ color: "#f7db25" }} />{" "}
                      {`${(
                        marker.data.annual_data.weighted_annual_sunshine_avg *
                        365.25
                      ).toFixed(0)} days (${(
                        marker.data.annual_data.weighted_annual_sunshine_avg *
                        100
                      ).toFixed(0)}%)`}
                    </div>
                  </div>

                  <ClimateChart marker={marker} />
                </div>
              </InfoWindow>
            </Marker>
          ))}
        </GoogleMap>
      </div>
    </div>
  );
}
