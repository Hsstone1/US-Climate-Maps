import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow
} from "@react-google-maps/api";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  ChartOptions,
} from 'chart.js';
import { Chart } from "react-chartjs-2";




type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;

export default function Map() {


  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 38.000, lng: -98.00 }),[]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType[]>([]);


  type MarkerType = {
    key: String;
    lat: number;
    lng: number;
    data: any;
  }

  ChartJS.register(
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      
      legend: {
        position: 'top' as const,
        display:false
      },
      
      title: {
        display: true,
        text: 'Yearly Climate Averages',
      },
    },
    
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          font:8
        },
      },
      Temperature: {
        type: 'linear',
        position: 'left',
      },
      Precip: {
        type: 'linear',
        position: 'right',
        ticks: {
            beginAtZero: true,
        }, 
        grid: {
          display: false,
        },
      }
    },
  } as ChartOptions<'bar' | 'line'>;

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


  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const createChartData = (marker: MarkerType) => {
    return {
      labels,
      datasets: [
        {
          type: 'line' as const,
          label: 'Max Temperature',
          data: marker.data.monthly_data.weighted_monthly_high_avg,
          backgroundColor: 'rgba(243, 105, 75, 0.7)',
          borderColor: 'rgba(243, 105, 75, 0.7)',
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 3,
          yAxisID: 'Temperature',
        },
        {
          type: 'line' as const,
          label: '90th % Temperature',
          data: marker.data.monthly_data.weighted_monthly_percentile_90_max_avg,
          backgroundColor: 'rgba(237, 68, 62, 0.3)',
          borderColor: 'rgba(237, 68, 62, 0.3)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          yAxisID: 'Temperature',
        },
        {
          type: 'line' as const,
          label: 'Min Temperature',
          data: marker.data.monthly_data.weighted_monthly_low_avg,
          backgroundColor: 'rgba(97, 139, 201, 0.7)',
          borderColor: 'rgba(97, 139, 201, 0.7)',
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 3,
          yAxisID: 'Temperature',
        }, 
        {
          type: 'line' as const,
          label: '10th % Temperature',
          data: marker.data.monthly_data.weighted_monthly_percentile_10_min_avg,
          backgroundColor: 'rgba(137, 182, 249, 0.3)',
          borderColor: 'rgba(137, 182, 249, 0.3)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          yAxisID: 'Temperature',
        }, 
        {
          type: 'bar' as const,
          label: 'Precip Totals',
          data: marker.data.monthly_data.weighted_monthly_precip_avg,
          backgroundColor: 'rgba(137, 217, 249, 0.7)',
          //fill: true,
          borderColor: 'rgba(137, 217, 249, 0.7)',
          yAxisID: 'Precip',
        }
        // Add more datasets for other climate information (e.g., precipitation, humidity)
      ],
    };
  };

  

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
          options={mapOptions}
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
                options={{
                  disableAutoPan: true,
                }}
                >
                <div>
                  {/* Display the info from the marker */}
                  <div style={{ textAlign: 'center' }}>
                    {<p>{marker.data.location_data.location.toString()}</p>}

                  </div>
                  
                  <Chart 
                    key={marker.key.toString()}
                    width="250"
                    height="200"
                    options={chartOptions}
                    data={createChartData(marker)}
                    type={"bar"}
                  />
                </div>
              </InfoWindow>
            </Marker>
          ))}

        </GoogleMap>
      </div>
    </div>
  );
}
