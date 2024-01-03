import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import SearchBar from "../app-bar/SearchBar";
import CompareLocationsList from "../app-bar/ComparisonList";
import ComparePage from "../compare-page/ComparePage";
import { API_URL, MarkerType } from "../global-utils";
import { getGeolocate, getElevation } from "./map-geolocate";
import CustomInfoWindow from "./CustomInfoWindow";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";
import ClimateTrends from "../climate-trends/ClimateTrends";
import Sidebar from "../app-bar/SideBar/SideBar";

type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;
//max number of locations that can be compared at once
const NUM_NUM_LOCATIONS = 5;

type YearlyData = {
  [locationId: string]: {
    [year: string]: any;
  };
};

export default function Map() {
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 38.0, lng: -98.0 }), []);
  const [isFetching, setIsFetching] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<LatLngLiteral | null>(
    null
  );
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [selectedMarker, setSelectedMarker] = useState<MarkerType[]>([]);
  const [locations, setLocations] = useState<MarkerType[]>([]);
  const [locationName, setLocationName] = useState<string | null>("");

  const [yearlyData, setYearlyData] = useState<YearlyData>({});
  const [isLoadingYearlyData, setIsLoadingYearlyData] = useState(false);
  const [climateData, setClimateData] = useState<any>({});
  const [isLoadingClimateData, setIsLoadingClimateData] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [activeComponent, setActiveComponent] = useState<
    "Map" | "Compare" | "ClimateTrends"
  >("Map");

  const mapOptions = useMemo<MapOptions>(
    () => ({
      clickableIcons: false,
      disableDoubleClickZoom: true,
      maxZoom: 13,
      minZoom: 3,
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
          north: 85,
          south: -85,
          west: -180,
          east: 180,
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
    setLocations((prevLocations) => {
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
          fetch(API_URL + "/climate_data_db", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              latitude,
              longitude,
              elevation,
            }),
          })
            .then((response) => {
              if (response.ok) {
                return response.json(); // Parse JSON body
              } else {
                return Promise.reject(
                  new Error("Network response was not ok.")
                );
              }
            })

            .then((data) => {
              const newMarker: MarkerType = {
                id: markerId,
                lat: latitude,
                lng: longitude,
                data: data,
              };

              //Only prints if in testing
              if (API_URL === "http://localhost:5000") {
                console.log("LOCATION ", newMarker);
              }

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
    [selectedMarker, handleCompareMarker]
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
      setLocations((prevLocations) =>
        prevLocations.filter((location) => location.id !== marker.id)
      );

      //If there are no more locations in the list, hide the compare page
      if (locations.length === 1) {
        setActiveComponent("Map");
      }
    },
    [locations.length]
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
                setActiveComponent("Map");
              }}
            >
              Map
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={() => {
                if (locations.length > 0) {
                  setActiveComponent("Compare");
                }
              }}
            >
              Compare
            </a>
          </li>

          {
            <li>
              <a
                href="#"
                onClick={() => {
                  if (locations.length > 0) {
                    setActiveComponent("ClimateTrends");
                  }
                }}
              >
                Climate Trends
              </a>
            </li>
          }
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

          {/* <ul
            className={
              locations.length === 0
                ? "nav_locations-list centered-content"
                : "nav_locations-list"
            }
          >
            <li>
              {locations.length === 0 ? (
                <>
                  <p className="compare-locations-list-text">
                    Click a location on the map, then navigate to the compare
                    tab.
                  </p>
                </>
              ) : (
                <CompareLocationsList
                  locations={locations}
                  onRemoveLocation={handleRemoveMarker}
                />
              )}
            </li>
          </ul> */}

          <p className="compare-locations-list-text">
            {locations.length == 0
              ? `Click a location on the map, then navigate to the compare tab.`
              : `Locations: ${locations.length}`}
          </p>

          <button className="menu-icon" onClick={toggleSidebar}>
            &#9776; {/* Hamburger icon */}
          </button>
          <Sidebar
            locations={locations}
            isOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            onRemoveLocation={handleRemoveMarker}
          />
        </div>
      </nav>

      <div className="container">
        {activeComponent === "Map" && (
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
                    location={marker}
                    handleCloseInfoWindow={handleRemoveMarker}
                  />
                </Marker>
              ))}
            </GoogleMap>
          </div>
        )}

        {activeComponent === "Compare" && (
          <ComparePage
            locations={locations}
            yearlyData={yearlyData}
            setYearlyData={setYearlyData}
            isLoadingYearlyData={isLoadingYearlyData}
            setIsLoadingYearlyData={setIsLoadingYearlyData}
          />
        )}

        {activeComponent === "ClimateTrends" && (
          <ClimateTrends
            locations={locations}
            climateData={climateData}
            setClimateData={setClimateData}
            isLoadingClimateData={isLoadingClimateData}
            setIsLoadingClimateData={setIsLoadingClimateData}
          />
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
