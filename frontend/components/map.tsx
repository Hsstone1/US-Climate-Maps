import { useState, useMemo, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Circle,
  MarkerClusterer,
  InfoWindow
} from "@react-google-maps/api";


type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;

export default function Map() {


  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 38.000, lng: -98.00 }),[]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType[]>([]);
  //const [selectedMarker, setSelectedMarker] = useState<{key: String; lat: number; lng: number; data: any; }[]>([]);
  const [infoWindow, setInfoWindow] = useState([]);


  type MarkerType = {
    key: String;
    lat: number;
    lng: number;
    data: any;
  }

  const options = useMemo<MapOptions>(
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

  //const onLoad = useCallback((map) => (mapRef.current = map), []);
  const onLoad = useCallback((map) => {
    mapRef.current = map;
  
  }, []);
  

  const handleMapClick = useCallback((ev) => {
    const latitude = ev.latLng?.lat();
    const longitude = ev.latLng?.lng();

    // Send latitude and longitude values to the backend API
    // Get response from post request from backend
    fetch('http://localhost:5000/climate_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the response from the backend API
        const newMarker: MarkerType = {
          key: (latitude + ',' + longitude).toString(),
          lat: latitude,
          lng: longitude,
          data: data
        }
        setSelectedMarker((prevMarkers) => [...prevMarkers, newMarker]);

        console.log(data);
      })
      .catch((error) => {
        // Handle any error that occurred during the request
        console.error(error);
      });
  }, []);

  return (
    <div className="container">
      <div className="controls">
        <h1>Click Map For Climate</h1>
        
      </div>
      <div className="map">
        <GoogleMap
          zoom={5}
          center={center}
          mapContainerClassName="map-container"
          onLoad={onLoad}
          options={options}
          onClick={handleMapClick}
        >

          {selectedMarker.map((marker) => (
            <Marker
              key={marker.key.toString()}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelectedMarker((prevMarkers) => [...prevMarkers, marker ])}
              visible={true}
            >
              <InfoWindow
                key={marker.key.toString()}
                position={{ lat: marker.lat, lng: marker.lng }}
                >
                <div>
                  {/* Display the info from the marker */}
                  {<p>ANNUAL HIGH:</p> && marker.data.annual_data.weighted_annual_high_avg}
                </div>
              </InfoWindow>
            </Marker>
          ))}

        </GoogleMap>
      </div>
    </div>
  );
}
