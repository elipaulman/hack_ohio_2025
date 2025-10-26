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

// Building data with coordinates and entrances
const BUILDINGS = {
  scottLab: {
    id: 'scottLab',
    name: 'Scott Laboratory',
    center: { lat: 40.002450315530794, lng: -83.01425605739048 },
    entrances: [
      { name: "North Entrance 1", lat: 40.0027022, lng: -83.0138185 },
      { name: "North Entrance 2", lat: 40.0025985, lng: -83.0143150 },
      { name: "East Entrance", lat: 40.0021426, lng: -83.0136230 },
      { name: "West Entrance", lat: 40.0022140, lng: -83.0146362 },
    ],
    available: true
  },
  thompsonLibrary: {
    id: 'thompsonLibrary',
    name: 'Thompson Library',
    center: { lat: 40.0007, lng: -83.0132 },
    entrances: [],
    available: false
  },
  ohioUnion: {
    id: 'ohioUnion',
    name: 'Ohio Union',
    center: { lat: 39.9983, lng: -83.0095 },
    entrances: [],
    available: false
  },
  dreeseLabs: {
    id: 'dreeseLabs',
    name: 'Dreese Labs',
    center: { lat: 40.0020, lng: -83.0153 },
    entrances: [],
    available: false
  },
  hitchcockHall: {
    id: 'hitchcockHall',
    name: 'Hitchcock Hall',
    center: { lat: 40.0020, lng: -83.0162 },
    entrances: [],
    available: false
  },
  caldwellLab: {
    id: 'caldwellLab',
    name: 'Caldwell Laboratory',
    center: { lat: 40.0012, lng: -83.0146 },
    entrances: [],
    available: false
  }
};

// Helper to find nearest entrance
function findClosestEntrance(lat, lng, entrances) {
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

  const [selectedBuilding, setSelectedBuilding] = useState('scottLab');
  const [userLocation, setUserLocation] = useState(null);
  const [closestEntrance, setClosestEntrance] = useState(null);
  const [directions, setDirections] = useState(null);
  const [directionsRequest, setDirectionsRequest] = useState(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const geofenceTriggeredRef = useRef(false);

  const currentBuilding = BUILDINGS[selectedBuilding];
  const currentCenter = currentBuilding.center;
  const currentEntrances = currentBuilding.entrances;

  // Handle building selection
  const handleBuildingChange = (e) => {
    const newBuildingId = e.target.value;
    const building = BUILDINGS[newBuildingId];

    if (building.available) {
      setSelectedBuilding(newBuildingId);
    } else {
      setShowComingSoonModal(true);
    }
  };

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
    if (navigator.geolocation && currentEntrances.length > 0) {
      let lastPosition = null;
      let lastEntrance = null;
      let watchId = null;
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const current = { lat: latitude, lng: longitude };

          setUserLocation(current);

          const closest = findClosestEntrance(latitude, longitude, currentEntrances);

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

          // Geofence detection: if within ~50 meters of building center, show modal
          if (currentBuilding.available) {
            try {
              const dLat = (latitude - currentCenter.lat) * 111320;
              const dLon = (longitude - currentCenter.lng) * (111320 * Math.cos((latitude * Math.PI) / 180));
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
  }, [currentCenter, currentEntrances, currentBuilding.available]);

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="relative w-full h-screen">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentCenter}
        zoom={18}
        options={mapOptions}
      >
        {/* Entrance markers */}
        {currentEntrances.map((e, i) => (
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
            <h3 style={{margin: 0, marginBottom: 8}}>{currentBuilding.name} Nearby</h3>
            <p style={{marginTop: 0, marginBottom: 16}}>We detected you're near {currentBuilding.name}. Would you like to open the indoor map to start indoor navigation?</p>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8}}>
              <button onClick={() => setShowGeofenceModal(false)} style={{padding: '8px 12px', background: '#eee', borderRadius: 8, border: 'none', cursor: 'pointer'}}>Dismiss</button>
              <button onClick={() => { setShowGeofenceModal(false); if (onNavigate) onNavigate('indoor-nav'); }} style={{padding: '8px 12px', background: '#1a73e8', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer'}}>Open Indoor Map</button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon modal */}
      {showComingSoonModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{background: '#fff', padding: 20, borderRadius: 12, maxWidth: 420, width: '90%', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'}}>
            <h3 style={{margin: 0, marginBottom: 8}}>Coming Soon!</h3>
            <p style={{marginTop: 0, marginBottom: 16}}>Indoor navigation for this building is not yet available. We're currently supporting Scott Laboratory only.</p>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8}}>
              <button onClick={() => setShowComingSoonModal(false)} style={{padding: '8px 12px', background: '#1a73e8', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer'}}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay UI with building selector */}
      <div className="absolute top-3 left-3 bg-white p-3 rounded-xl shadow-lg" style={{minWidth: '280px'}}>
        <label htmlFor="building-select" className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          Select Building
        </label>
        <select
          id="building-select"
          value={selectedBuilding}
          onChange={handleBuildingChange}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          style={{cursor: 'pointer'}}
        >
          {Object.values(BUILDINGS).map(building => (
            <option key={building.id} value={building.id}>
              {building.name} {!building.available && '(Coming Soon)'}
            </option>
          ))}
        </select>

        {currentBuilding.available ? (
          <>
            <p className="text-sm text-gray-600">
              Automatically routing to the nearest entrance.
            </p>
            {closestEntrance && (
              <p className="text-sm mt-1 font-medium text-gray-700">
                → Closest: {closestEntrance.name}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-600 italic">
            Indoor navigation coming soon for this building.
          </p>
        )}
      </div>
    </div>
  );
}
