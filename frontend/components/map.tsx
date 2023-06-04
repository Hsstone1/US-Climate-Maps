import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { FaCloudRain, FaSnowflake, FaSun } from "react-icons/fa";
import ClimateChart from "./climatechart";
import SearchBar from "./searchbar";
import CompareLocationsList from "./comparisonlist";
import { MarkerType } from "./marker-type-props";

type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;

export default function Map() {
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 38.0, lng: -98.0 }), []);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType[]>([]);
  const [locationsCompare, setLocationsCompare] = useState<MarkerType[]>([]);

  const mapOptions = useMemo<MapOptions>(
    () => ({
      clickableIcons: false,
      disableDoubleClickZoom: true,
      maxZoom: 13,
      minZoom: 4,
      mapTypeId: "terrain",
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT,
      },
      mapTypeControl: false,
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

      const startTime = performance.now();

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
            id: `${latitude}_${longitude}`, // Generate unique key based on lat and lng
            lat: latitude,
            lng: longitude,
            data: data,
          };

          setSelectedMarker((prevMarkers) => [...prevMarkers, newMarker]);
          console.log(data);

          console.log("Time difference:", performance.now() - startTime, "ms");
        })
        .catch((error) => {
          // Handle any error that occurred during the request
          console.error(error);
        });
    },
    []
  );

  //This removes the marker from the map, as well as from comparison list
  const handleRemoveMarker = useCallback((marker: MarkerType) => {
    setSelectedMarker((prevMarkers) =>
      prevMarkers.filter((prevMarker) => prevMarker.id !== marker.id)
    );

    handleRemoveLocation(marker);
  }, []);

  //This removes the card from comparison list
  const handleRemoveLocation = useCallback((marker: MarkerType) => {
    setLocationsCompare((prevLocations) =>
      prevLocations.filter((location) => location.id !== marker.id)
    );
  }, []);

  const handleCompareMarker = useCallback((marker: MarkerType) => {
    setLocationsCompare((prevLocations) => {
      // Check if the marker's id already exists in the list
      const isMarkerExists = prevLocations.some(
        (location) => location.id === marker.id
      );

      //If marker doesnt exist in location list, add it
      if (!isMarkerExists) {
        return [...prevLocations, marker];
      }

      //Else do nothing, return the list as is
      return prevLocations;
    });
  }, []);

  return (
    <div className="container">
      <div className="side-pannel" style={{ textAlign: "center" }}>
        <h3>US Climate Maps</h3>
        <SearchBar
          setMarker={(position) => {
            handleBackendMarkerData(position);
            mapRef.current?.panTo(position);
          }}
        />
        <hr style={{ marginTop: "1rem" }} />
        <div className="side-pannel-list">
          <div>
            <h5>
              Compare Locations
              {locationsCompare.length === 0 ? (
                <>
                  <br />
                  <br />
                  Click a location on the map, then add to compare
                </>
              ) : null}
            </h5>
            <CompareLocationsList
              locations={locationsCompare}
              onRemoveLocation={handleRemoveLocation}
            />
          </div>
        </div>

        <button className="compare-button">Compare</button>
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
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() =>
                //TODO this is likely why console complains about two exact same keys
                setSelectedMarker((prevMarkers) => [...prevMarkers, marker])
              }
              visible={true}
            >
              <InfoWindow
                key={marker.id + "_infowindow"}
                position={{ lat: marker.lat, lng: marker.lng }}
                options={{
                  disableAutoPan: true,
                  minWidth: 300,
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
                        <FaCloudRain
                          style={{ color: "#7e878c", fontSize: "12px" }}
                        />
                        <span>
                          {`${marker.data.annual_data.weighted_annual_precip_days_avg.toFixed(
                            0
                          )} days `}
                          (
                          {`${marker.data.annual_data.weighted_annual_precip_avg.toFixed(
                            0
                          )} in`}
                          )
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
                        <FaSnowflake
                          style={{ color: "#b0b0b0", fontSize: "12px" }}
                        />
                        <span>
                          {`${marker.data.annual_data.weighted_annual_snow_days_avg.toFixed(
                            0
                          )} days `}
                          (
                          {`${marker.data.annual_data.weighted_annual_snow_avg.toFixed(
                            0
                          )} in`}
                          )
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
                          {`${(
                            marker.data.annual_data
                              .weighted_annual_sunshine_avg * 365.25
                          ).toFixed(0)} days `}
                          (
                          {`${(
                            marker.data.annual_data
                              .weighted_annual_sunshine_avg * 100
                          ).toFixed(0)}%`}
                          )
                        </span>
                      </div>
                    </div>
                  </div>

                  <ClimateChart marker={marker} />

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
            </Marker>
          ))}
        </GoogleMap>
      </div>
    </div>
  );
}
