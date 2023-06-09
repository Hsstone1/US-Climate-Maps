import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import SearchBar from "../compare-sidebar/searchbar";
import CompareLocationsList from "../compare-sidebar/comparisonlist";
import ComparePage from "../compare-page/comparepage";
import { MarkerType } from "../export-props";
import { getGeolocate, getElevation } from "./geolocate";
import CustomInfoWindow from "./custominfowindow";

type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;

export default function Map() {
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 38.0, lng: -98.0 }), []);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType[]>([]);
  const [locationsCompare, setLocationsCompare] = useState<MarkerType[]>([]);
  const [activeComponent, setActiveComponent] = useState<
    "map" | "compare" | "historical_weather" | "route_planning" | "about"
  >("map");

  const NUM_LOCATIONS = 8;

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
      const markerId = `${latitude}_${longitude}`;

      // Check if marker with the same ID already exists
      const markerExists = selectedMarker.some(
        (marker) => marker.id === markerId
      );

      if (markerExists) {
        console.log("Marker already exists");
        return;
      }

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
              elevation,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              // Handle the response from the backend API
              const newMarker: MarkerType = {
                id: markerId,
                lat: latitude,
                lng: longitude,
                data: data,
              };

              console.log("MARKER CREATED");

              getGeolocate(latitude, longitude)
                .then((locationData) => {
                  newMarker.data.location_data.location = locationData;

                  setSelectedMarker((prevMarkers) => [
                    ...prevMarkers,
                    newMarker,
                  ]);

                  handleCompareMarker(newMarker);

                  console.log(data);
                  console.log(
                    "Time difference:",
                    performance.now() - startTime,
                    "ms"
                  );
                })
                .catch((error) => {
                  console.log("Error Cannot Retrieve Address: " + error);
                });
            })
            .catch((error) => {
              console.error("Error Cannot Retrieve Data: " + error);
            });
        })
        .catch((error) => {
          console.log("Error Cannot Retrieve Elevation: " + error);
        });
    },
    [selectedMarker]
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

    //If there are no more locations in the list, hide the compare page
    //console.log("locations in list", locationsCompare.length);
    if (locationsCompare.length === 1) {
      setActiveComponent("map");
    }
  }, []);

  const handleCompareMarker = useCallback((marker: MarkerType) => {
    setLocationsCompare((prevLocations) => {
      // Check if the marker's id already exists in the list
      const isMarkerExists = prevLocations.some(
        (location) => location.id === marker.id
      );

      //If marker doesnt exist in location list, add it
      if (!isMarkerExists && prevLocations.length < NUM_LOCATIONS) {
        return [...prevLocations, marker];
      }

      //Else do nothing, return the list as is
      return prevLocations;
    });
  }, []);

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
          <li>
            <a
              href="#"
              onClick={() => {
                setActiveComponent("historical_weather");
              }}
            >
              Historical Weather
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={() => {
                setActiveComponent("route_planning");
              }}
            >
              Route Planning
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={() => {
                setActiveComponent("about");
              }}
            >
              About
            </a>
          </li>
        </ul>
      </nav>

      <div className="container">
        <div className="side-pannel">
          <SearchBar
            setMarker={(position) => {
              handleBackendMarkerData(position);
              mapRef.current?.panTo(position);
            }}
          />
          <hr style={{ marginTop: "1rem" }} />
          <div className="side-pannel-list">
            <div>
              <h5>Location List</h5>
              <CompareLocationsList
                locations={locationsCompare}
                onRemoveLocation={handleRemoveMarker}
              />
            </div>
          </div>

          <div>
            {locationsCompare.length === 0 ? (
              <>
                <p>
                  Click a location on the map, then navigate to the comparison
                  tab. Up to {NUM_LOCATIONS} locations can be compared at once.
                </p>
              </>
            ) : (
              <button
                className="clear-locations-button"
                onClick={() => {
                  setLocationsCompare([]);
                  setSelectedMarker([]);
                  setActiveComponent("map");
                }}
              >
                Clear Locations
              </button>
            )}
          </div>
        </div>

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
    </div>
  );
}
