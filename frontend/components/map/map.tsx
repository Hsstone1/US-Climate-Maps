import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
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
  const [showComparePage, setShowComparePage] = useState(false); // New state variable
  const [isSearched, setIsSearched] = useState(false);

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

      // Generate unique key based on lat and lng
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
              elevation, // Include elevationData in the request body
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

                  //TODO fix the boolean state variable

                  setIsSearched((prevIsSearched) => {
                    if (prevIsSearched) {
                      handleCompareMarker(newMarker);
                      setIsSearched(false);
                    }
                    return prevIsSearched;
                  });
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
              // Handle any error that occurred during the request
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
  }, []);

  const handleCompareMarker = useCallback((marker: MarkerType) => {
    setLocationsCompare((prevLocations) => {
      // Check if the marker's id already exists in the list
      const isMarkerExists = prevLocations.some(
        (location) => location.id === marker.id
      );

      //If marker doesnt exist in location list, add it
      if (!isMarkerExists && prevLocations.length < 10) {
        return [...prevLocations, marker];
      }

      //Else do nothing, return the list as is
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
            setIsSearched(true);
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
            <p>Click a location on the map, then add to compare (up to 10)</p>
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
                <CustomInfoWindow
                  marker={marker}
                  handleCompareMarker={handleCompareMarker}
                  handleRemoveMarker={handleRemoveMarker}
                />
              </Marker>
            ))}
          </GoogleMap>
        </div>
      )}
    </div>
  );
}
