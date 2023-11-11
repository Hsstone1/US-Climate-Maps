import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import SearchBar from "../app-bar/searchbar";
import CompareLocationsList from "../app-bar/comparisonlist";
import ComparePage from "../compare-page/comparepage";
import { MarkerType } from "../location-props";
import { getGeolocate, getElevation } from "./geolocate";
import CustomInfoWindow from "./custominfowindow";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";

type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;
//max number of locations that can be compared at once
const NUM_NUM_LOCATIONS = 5;

let apiUrl = "http://localhost:5000/climate_data";
//let apiUrl = "https://api.usclimatemaps.com/climate_data";

export default function Map() {
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 38.0, lng: -98.0 }), []);
  const [isFetching, setIsFetching] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<LatLngLiteral | null>(
    null
  );
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [selectedMarker, setSelectedMarker] = useState<MarkerType[]>([]);
  const [locationsCompare, setLocationsCompare] = useState<MarkerType[]>([]);
  const [locationName, setLocationName] = useState<string | null>("");
  const [activeComponent, setActiveComponent] = useState<
    "map" | "compare" | "climate change"
  >("map");

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

  useEffect(() => {
    // Only run geolocation if clickedLocation changes
    if (clickedLocation !== null) {
      setLocationName("");

      getGeolocate(clickedLocation.lat, clickedLocation.lng)
        .then((locationName) => {
          setLocationName(locationName); // Update location name upon successful geolocation
        })
        .catch((error) => {
          console.error("Error Cannot Retrieve Address: " + error);
          setLocationName(
            `Lat: ${clickedLocation.lat.toFixed(
              2
            )}, Lng: ${clickedLocation.lng.toFixed(2)}`
          ); // Fallback to coordinates
        });
    }
  }, [clickedLocation]); // Depend on clickedLocation

  //This is used to keep track of the number of markers on the map while avoiding async state updates
  const markerCountRef = useRef(0);
  useEffect(() => {
    markerCountRef.current = selectedMarker.length;
  }, [selectedMarker]);

  const handleCompareMarker = useCallback((marker: MarkerType) => {
    setLocationsCompare((prevLocations) => {
      // Check if the marker's id already exists in the list
      const isMarkerExists = prevLocations.some(
        (location) => location.id === marker.id
      );

      //If marker doesnt exist in location list, add it
      if (!isMarkerExists && prevLocations.length < NUM_NUM_LOCATIONS) {
        return [...prevLocations, marker];
      }

      //Else do nothing, return the list as is
      return prevLocations;
    });
  }, []);

  const handleBackendMarkerData = useCallback(
    (position: LatLngLiteral): void => {
      const { lat: latitude, lng: longitude } = position;
      const markerId = `${latitude}_${longitude}`;
      if (markerCountRef.current >= NUM_NUM_LOCATIONS) {
        setAlertMessage("Maximum number of locations reached!");
        setTimeout(() => setAlertMessage(null), 1000);
        return;
      }

      // Check if marker with the same ID already exists
      const markerExists = selectedMarker.some(
        (marker) => marker.id === markerId
      );

      if (markerExists) {
        setAlertMessage("Marker already exists!");
        setTimeout(() => setAlertMessage(null), 1000);
        return;
      }
      setIsFetching(true);
      setClickedLocation(position);

      getElevation(latitude, longitude)
        .then((elevation) => {
          // Send latitude, longitude, and elevationData values to the backend API
          fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              body: JSON.stringify({
                latitude,
                longitude,
                elevation,
              }),
            }),
          })
            .then((response) => {
              if (response.ok) {
                return response.json();
              } else {
                return Promise.reject(
                  new Error("Network response was not ok.")
                );
              }
            })
            .then((data) => {
              if (typeof data.body === "string") {
                // Parse the body to JSON if it's a string
                data = JSON.parse(data.body);
              }
              if (data && data.url) {
                return fetch(data.url)
                  .then((s3Response) => s3Response.json())
                  .then((s3Data) => {
                    return s3Data;
                  });
              } else {
                return data;
              }
            })
            .then((data) => {
              const newMarker: MarkerType = {
                id: markerId,
                lat: latitude,
                lng: longitude,
                data: data,
              };

              console.log(data);

              setSelectedMarker((prevMarkers) => [...prevMarkers, newMarker]);

              setIsFetching(false);

              handleCompareMarker(newMarker);
            })
            .catch((error) => {
              console.error("Error Cannot Retrieve Data: " + error);
              setIsFetching(false);
              setClickedLocation(null);
            });
        })
        .catch((error) => {
          console.error("Error Cannot Retrieve Elevation: " + error);
          setIsFetching(false);
          setClickedLocation(null);
        });
    },
    [selectedMarker, handleCompareMarker, locationName]
  );

  useEffect(() => {
    // This will run when both isFetching is false and locationName is set
    if (!isFetching && locationName && clickedLocation) {
      const markerId = `${clickedLocation.lat}_${clickedLocation.lng}`;
      const newMarker = selectedMarker.find((marker) => marker.id === markerId);

      if (newMarker) {
        newMarker.data.location_data.location = locationName;

        // Update the marker in the state
        setSelectedMarker((prevMarkers) => {
          return prevMarkers.map((marker) => {
            if (marker.id === markerId) {
              return newMarker; // This will update the marker with the location name
            }
            return marker;
          });
        });
      }

      // Reset the clickedLocation after setting the location name
      setClickedLocation(null);
    }
  }, [isFetching, locationName, clickedLocation, selectedMarker]);

  //This removes the card from comparison list
  const handleRemoveLocation = useCallback(
    (marker: MarkerType) => {
      setLocationsCompare((prevLocations) =>
        prevLocations.filter((location) => location.id !== marker.id)
      );

      //If there are no more locations in the list, hide the compare page
      if (locationsCompare.length === 1) {
        setActiveComponent("map");
      }
    },
    [locationsCompare.length]
  );

  //This removes the marker from the map, as well as from comparison list
  const handleRemoveMarker = useCallback(
    (marker: MarkerType) => {
      setSelectedMarker((prevMarkers) =>
        prevMarkers.filter((prevMarker) => prevMarker.id !== marker.id)
      );

      handleRemoveLocation(marker);
    },
    [handleRemoveLocation]
  );

  const handleMapClick = useCallback(
    (ev: google.maps.MapMouseEvent): void => {
      if (isFetching) return; // Block map clicks if fetching

      const latitude = ev.latLng?.lat();
      const longitude = ev.latLng?.lng();

      if (latitude && longitude) {
        handleBackendMarkerData({ lat: latitude, lng: longitude });
      }
    },
    [isFetching, handleBackendMarkerData]
  );

  return (
    <div className="app-container">
      <nav className="nav">
        <div>
          <h2>US Climate Maps</h2>
        </div>

        <ul>
          <li>
            <a
              href="#"
              onClick={() => {
                setActiveComponent("map");
              }}
            >
              Map
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={() => {
                if (locationsCompare.length > 0) {
                  setActiveComponent("compare");
                }
              }}
            >
              Compare
            </a>
          </li>

          {/* <li>
            <a
              href="#"
              onClick={() => {
                setActiveComponent("climate change");
              }}
            >
              Climate Change
            </a>
          </li> */}
        </ul>
      </nav>

      <nav>
        <div className="nav_locations">
          <ul className="nav_locations-items">
            <li>
              <div style={{ minWidth: "200px" }}>
                {" "}
                {/* This ensures that SearchBar has a minimum width */}
                <SearchBar
                  setMarker={(position) => {
                    handleBackendMarkerData(position);
                    mapRef.current?.panTo(position);
                  }}
                />
              </div>
            </li>
          </ul>

          <ul
            className={
              locationsCompare.length === 0
                ? "nav_locations-list centered-content"
                : "nav_locations-list"
            }
          >
            <li>
              {locationsCompare.length === 0 ? (
                <>
                  <p className="compare-locations-list-text">
                    Click a location on the map, then navigate to the compare
                    tab. Up to {NUM_NUM_LOCATIONS} locations can be compared at
                    once.
                  </p>
                </>
              ) : (
                <CompareLocationsList
                  locations={locationsCompare}
                  onRemoveLocation={handleRemoveMarker}
                />
              )}
            </li>
          </ul>
        </div>
      </nav>

      <div className="container">
        {activeComponent === "compare" && (
          <ComparePage locations={locationsCompare} />
        )}

        {activeComponent === "map" && (
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
                >
                  <CustomInfoWindow
                    marker={marker}
                    handleCloseInfoWindow={handleRemoveMarker}
                  />
                </Marker>
              ))}
            </GoogleMap>
          </div>
        )}
      </div>
      <Snackbar
        open={isFetching}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <div
          style={{
            backgroundColor: "#5496ff",
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            borderRadius: "4px",
          }}
        >
          <div style={{ flex: 1, color: "white" }}>
            {`Fetching Data for: ${isFetching && locationName}`}
          </div>
          <CircularProgress
            size={24}
            color="inherit"
            style={{ marginLeft: "10px" }}
          />
        </div>
      </Snackbar>

      <Snackbar
        open={Boolean(alertMessage)}
        autoHideDuration={1000}
        onClose={() => setAlertMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={alertMessage}
        ContentProps={{ style: { backgroundColor: "#ff3333", color: "white" } }}
      />
    </div>
  );
}
