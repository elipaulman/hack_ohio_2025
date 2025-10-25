import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = { lat: 40.002450315530794, lng: -83.01425605739048 }; // Scott Lab center

// Define building entrances
const entrances = [
  { name: "North Entrance 1", lat: 40.0027022, lng: -83.0138185 },
  { name: "North Entrance 2", lat: 40.0025985, lng: -83.0143150 },
  { name: "East Entrance", lat: 40.0021426, lng: -83.0136230 },
  { name: "West Entrance", lat: 40.0022140, lng: -83.0146362 },
];

// Helper to find nearest entrance
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

export default function ScottLabMap({ onNavigate }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const [userLocation, setUserLocation] = useState(null);
  const [closestEntrance, setClosestEntrance] = useState(null);
  const [directions, setDirections] = useState(null);
  const [directionsRequest, setDirectionsRequest] = useState(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const geofenceTriggeredRef = useRef(false);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      mapId: "DEMO_MAP_ID", // optional custom Map ID
    }),
    []
  );

  // Track current user location and dynamically route to nearest entrance
  useEffect(() => {
    if (navigator.geolocation) {
      let lastPosition = null;
      let lastEntrance = null;
      let watchId = null;
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const current = { lat: latitude, lng: longitude };

          setUserLocation(current);

          const closest = findClosestEntrance(latitude, longitude);

          // Calculate movement distance
          const movedFarEnough =
            !lastPosition ||
            Math.sqrt(
              (latitude - lastPosition.lat) ** 2 +
                (longitude - lastPosition.lng) ** 2
            ) > 0.0001; // ~10 meters

          // Recalculate route only if moved significantly or closest entrance changed
          if (
            movedFarEnough ||
            !lastEntrance ||
            closest.name !== lastEntrance.name
          ) {
            setClosestEntrance(closest);
            lastPosition = current;
            lastEntrance = closest;

            if (window.google) {
              const request = {
                origin: current,
                destination: { lat: closest.lat, lng: closest.lng },
                travelMode: "WALKING",
              };
              setDirectionsRequest(request);
            }
          }

          // Geofence detection: if within ~50 meters of Scott Lab center, show modal
          try {
            const dLat = (latitude - center.lat) * 111320;
            const dLon = (longitude - center.lng) * (111320 * Math.cos((latitude * Math.PI) / 180));
            const distanceMeters = Math.sqrt(dLat * dLat + dLon * dLon);

            const GEOFENCE_RADIUS_METERS = 50; // threshold
            if (distanceMeters <= GEOFENCE_RADIUS_METERS) {
              // only trigger once per session (use ref to avoid effect deps)
              if (!geofenceTriggeredRef.current) {
                setShowGeofenceModal(true);
                geofenceTriggeredRef.current = true;
              }
            }
          } catch (e) {
            console.warn('Geofence check failed', e);
          }
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );

      return () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.warn("Geolocation not supported in this browser.");
    }
  }, []);

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="relative w-full h-screen">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={18}
        options={mapOptions}
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
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        ))}

        {/* Custom user location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            label={{
              text: "You",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "12px",
            }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: "#1a73e8",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#ffffff",
            }}
          />
        )}

        {/* Directions Service */}
        {directionsRequest && (
          <DirectionsService
            options={directionsRequest}
            callback={(result, status) => {
              if (status === "OK" && result) {
                setDirections(result);
              } else {
                console.warn("Failed to fetch directions:", status, result);
              }
            }}
          />
        )}

        {/* Render the path, suppress A/B markers */}
        {directions && (
          <DirectionsRenderer
            options={{
              directions,
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: "#1a73e8",
                strokeOpacity: 0.9,
                strokeWeight: 6,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* Geofence modal */}
      {showGeofenceModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{background: '#fff', padding: 20, borderRadius: 12, maxWidth: 420, width: '90%', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'}}>
            <h3 style={{margin: 0, marginBottom: 8}}>Scott Lab Nearby</h3>
            <p style={{marginTop: 0, marginBottom: 16}}>We detected you're near Scott Lab. Would you like to open the indoor map to start indoor navigation?</p>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8}}>
              <button onClick={() => setShowGeofenceModal(false)} style={{padding: '8px 12px', background: '#eee', borderRadius: 8, border: 'none'}}>Dismiss</button>
              <button onClick={() => { setShowGeofenceModal(false); if (onNavigate) onNavigate('indoor-nav'); }} style={{padding: '8px 12px', background: '#1a73e8', color: '#fff', borderRadius: 8, border: 'none'}}>Open Indoor Map</button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay UI */}
      <div className="absolute top-3 left-3 bg-white p-3 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800">
          Scott Lab Navigator
        </h2>
        <p className="text-sm text-gray-600">
          Automatically routing to the nearest entrance.
        </p>
        {closestEntrance && (
          <p className="text-sm mt-1 font-medium text-gray-700">
            → Closest: {closestEntrance.name}
          </p>
        )}
      </div>
    </div>
  );
}
