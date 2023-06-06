import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { FaCloudRain, FaSnowflake, FaSun } from "react-icons/fa";
import IndowWindowChart from "./infowindowchart";
import SearchBar from "./searchbar";
import CompareLocationsList from "./comparisonlist";
import ComparePage from "./comparepage";
import { MarkerType } from "./export-props";

type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;

export default function Map() {
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 38.0, lng: -98.0 }), []);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType[]>([]);
  const [locationsCompare, setLocationsCompare] = useState<MarkerType[]>([]);
  const [showComparePage, setShowComparePage] = useState(false); // New state variable

  const geolocate = async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: latitude, lng: longitude };

    try {
      const response = await geocoder.geocode({ location: latlng });
      if (response.results[0]) {
        const components = response.results[0].address_components;
        let locality, state, country;

        for (const component of components) {
          if (component.types.includes("locality")) {
            locality = component.long_name;
          } else if (component.types.includes("administrative_area_level_1")) {
            state = component.long_name;
          } else if (component.types.includes("country")) {
            country = component.short_name;
          }
        }

        const formattedAddress = [locality, state, country]
          .filter(Boolean)
          .join(", ");

        if (formattedAddress.length === 0) {
          return `${latitude}, ${longitude}`;
        }

        return formattedAddress;
      } else {
        return `${latitude}, ${longitude}`;
      }
    } catch (error) {
      console.log("Geocoder failed due to: " + error);
      throw error;
    }
  };

  const getElevation = async (
    latitude: number,
    longitude: number
  ): Promise<number> => {
    const elevationService = new google.maps.ElevationService();
    const latlng = new google.maps.LatLng(latitude, longitude);

    return new Promise<number>((resolve, reject) => {
      elevationService.getElevationForLocations(
        { locations: [latlng] },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const elevationInFeet = results[0].elevation * 3.28;
            resolve(elevationInFeet);
          } else {
            console.error("Elevation request failed:", status);
            resolve(0);
            reject(new Error("Elevation request failed"));
          }
        }
      );
    });
  };

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
    console.log("CLICKED MAP");

    if (latitude && longitude) {
      handleBackendMarkerData({ lat: latitude, lng: longitude });
    }
  }, []);

  const handleBackendMarkerData = useCallback(
    (position: LatLngLiteral): void => {
      const { lat: latitude, lng: longitude } = position;
      const startTime = performance.now();

      getElevation(latitude, longitude)
        .then((elevation) => {
          // Send latitude, longitude, and elevationData values to the backend API
          // Get response from the post request to the backend
          fetch("http://localhost:5000/climate_data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude,
              longitude,
              elevation, // Include elevationData in the request body
            }),
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

              console.log("MARKER CREATED");

              geolocate(latitude, longitude)
                .then((locationData) => {
                  newMarker.data.location_data.location = locationData;

                  setSelectedMarker((prevMarkers) => [
                    ...prevMarkers,
                    newMarker,
                  ]);
                  console.log(data);
                  console.log(
                    "Time difference:",
                    performance.now() - startTime,
                    "ms"
                  );

                  // TODO: when in comparison page, the search bar should just add a location to compare
                  // if (showComparePage) {
                  //   handleCompareMarker(newMarker);
                  // }
                })
                .catch((error) => {
                  console.log("Error Cannot Retrieve Address: " + error);
                });
            })
            .catch((error) => {
              // Handle any error that occurred during the request
              console.error("Error Cannot Retrieve Data: " + error);
            });
        })
        .catch((error) => {
          console.log("Error Cannot Retrieve Elevation: " + error);
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
        console.log("ADDED MARKER");
        return [...prevLocations, marker];
      }

      //Else do nothing, return the list as is
      console.log("DID NOT ADD MARKER");

      return prevLocations;
    });
  }, []);

  const handleCompareButtonClick = useCallback(() => {
    setShowComparePage((prevState) => !prevState);
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
            <h5>Compare Locations</h5>
            <CompareLocationsList
              locations={locationsCompare}
              onRemoveLocation={handleRemoveLocation}
            />
          </div>
        </div>

        {locationsCompare.length === 0 ? (
          <>
            <p>Click a location on the map, then add to compare</p>
          </>
        ) : (
          <button className="compare-button" onClick={handleCompareButtonClick}>
            {showComparePage ? "View Map" : "View Locations"}
          </button>
        )}
      </div>

      {showComparePage && locationsCompare.length > 0 ? ( // Render ComparePage if showComparePage is true, else render map
        <ComparePage locations={locationsCompare} />
      ) : (
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
                    <div style={{ textAlign: "center" }}>
                      <p>
                        {marker.data.location_data.location}
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
                          <FaSun
                            style={{ color: "#f7db25", fontSize: "12px" }}
                          />
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
              </Marker>
            ))}
          </GoogleMap>
        </div>
      )}
    </div>
  );
}
