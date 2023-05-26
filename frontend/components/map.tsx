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
  const [selectedMarker, setSelectedMarker] = useState(null);


  


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
          onClick={ev => {
            //Chaining opperator. Only will check if not null
            const latitude = ev.latLng?.lat();
            const longitude = ev.latLng?.lng();

            
            // Send latitude and longitude values to the backend API
            fetch('http://localhost:5000/climate_data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ latitude, longitude }),
            })
              .then(response => response.json())
              .then(data => {
                // Handle the response from the backend API
                console.log(data);
              })
              .catch(error => {
                // Handle any error that occurred during the request
                console.error(error);
              });
            
          }}
        >

        </GoogleMap>
      </div>
    </div>
  );
}
