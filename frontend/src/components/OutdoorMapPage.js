import React, { useState, useCallback, useMemo } from "react";
import { GoogleMap, Marker, DirectionsService, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = { lat: 40.0027, lng: -83.0151 }; // Scott Lab central position

// Define building entrances
const entrances = [
  { name: "North Entrance", lat: 40.002720, lng: -83.014444 },
  { name: "South Entrance", lat: 40.001680, lng: -83.015160 },
  { name: "East Entrance", lat: 40.002200, lng: -83.013900 },
  { name: "West Entrance", lat: 40.002350, lng: -83.015950 },
];

function findClosestEntrance(lat, lng) {
  let minDist = Infinity;
  let closest = null;
  entrances.forEach((e) => {
    const dist = Math.sqrt((lat - e.lat) ** 2 + (lng - e.lng) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = e;
    }
  });
  return closest;
}

export default function ScottLabMap() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const [userLocation, setUserLocation] = useState(null);
  const [closestEntrance, setClosestEntrance] = useState(null);
  const [directions, setDirections] = useState(null);
  const [directionsRequest, setDirectionsRequest] = useState(null);

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const clickedPoint = { lat, lng };
    const closest = findClosestEntrance(lat, lng);
    if (!closest) return;

    setUserLocation(clickedPoint);
    setClosestEntrance(closest);
    setDirections(null);

    // Delay to ensure API is loaded before creating Directions request
    setTimeout(() => {
      const request = {
        origin: clickedPoint,
        destination: { lat: closest.lat, lng: closest.lng },
        travelMode: window.google.maps.TravelMode.WALKING,
      };
      setDirectionsRequest(request);
    }, 200);
  }, []);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      mapId: "DEMO_MAP_ID", // Optional: use your custom Map ID if you have one
    }),
    []
  );

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="relative w-full h-screen">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={18}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {/* Entrance markers */}
        {entrances.map((e, i) => (
          <Marker
            key={i}
            position={{ lat: e.lat, lng: e.lng }}
            label={{
              text: e.name,
              fontSize: "12px",
              color: "#000",
              fontWeight: "bold",
            }}
          />
        ))}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          />
        )}

        {/* Directions Service */}
        {directionsRequest && (
          <DirectionsService
            options={directionsRequest}
            callback={(result, status) => {
              console.log("Directions Status:", status);
              if (status === "OK" && result) {
                setDirections(result);
              } else {
                console.warn("Failed to fetch directions:", status, result);
              }
            }}
          />
        )}

        {/* Directions Renderer */}
        {directions && (
          <DirectionsRenderer
            options={{
              directions,
              suppressMarkers: false,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: "#4285F4",
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* Overlay Info Bar */}
      <div className="absolute top-2 left-2 bg-white p-3 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800">Scott Lab Navigator</h2>
        <p className="text-sm text-gray-600">
          Tap anywhere to route to the nearest entrance.
        </p>
        {closestEntrance && (
          <p className="text-sm mt-1 font-medium text-gray-700">
            → Routing to {closestEntrance.name}
          </p>
        )}
      </div>
    </div>
  );
}
