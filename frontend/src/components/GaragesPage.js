import React, { useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";

const center = { lat: 40.0067, lng: -83.0305 }; // OSU Campus center
const DEFAULT_MAP_HEIGHT = "100vh";

// Garage locations with addresses and coordinates
const garageLocations = [
  { name: "12th Avenue", address: "340 West 12th Avenue", lat: 39.99891, lng: -83.01598 },
  { name: "9th Avenue East", address: "345 West 9th Avenue", lat: 40.00247, lng: -83.01624 },
  { name: "9th Avenue West", address: "355 West 9th Avenue", lat: 40.00247, lng: -83.01674 },
  { name: "SAFEAUTO", address: "1585 Westpark Street", lat: 39.99564, lng: -83.02156 },
  { name: "Medical Center", address: "Wexner Medical Center Garage", lat: 40.00058, lng: -83.02968 },
  { name: "Old Cannon", address: "1640 Cannon Drive", lat: 40.00397, lng: -83.03091 },
  { name: "Neil Avenue", address: "1801 Neil Avenue", lat: 40.00512, lng: -83.01361 },
  { name: "11th Avenue", address: "229 West 11th Avenue", lat: 39.99989, lng: -83.01443 },
  { name: "Ohio Union North", address: "1780 College Road", lat: 40.00162, lng: -83.01319 },
  { name: "Ohio Union South", address: "1759 North High Street", lat: 40.00069, lng: -83.01308 },
  { name: "Gateway", address: "75 East 11th Avenue", lat: 39.99999, lng: -83.00919 },
  { name: "Tuttle", address: "2050 Tuttle Park Place", lat: 40.00964, lng: -83.01896 },
  { name: "Northwest", address: "271 Ives Drive", lat: 40.01289, lng: -83.03378 },
  { name: "Arps", address: "1990 College Road", lat: 40.00441, lng: -83.01394 },
  { name: "Lane Avenue", address: "2105 Neil Avenue", lat: 40.00787, lng: -83.01521 },
  { name: "West Lane Avenue", address: "328 West Lane Avenue", lat: 40.00754, lng: -83.01856 },
  { name: "James Outpatient Care", address: "2061 Kenny Rd, Columbus, OH 43210", lat: 40.01214, lng: -83.03648 },
];

// Helper function to get marker color based on percentage full
function getMarkerColor(percentage) {
  if (percentage <= 60) return "#10B981"; // Green
  if (percentage <= 85) return "#F59E0B"; // Yellow/Amber
  return "#EF4444"; // Red
}

// Helper function to get status text
function getStatusText(percentage) {
  if (percentage <= 60) return "Available";
  if (percentage <= 85) return "Moderate";
  return "Nearly Full";
}

export default function GaragesPage({ onNavigate }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const [garagesData, setGaragesData] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [routingGarage, setRoutingGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapHeight, setMapHeight] = useState(DEFAULT_MAP_HEIGHT);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      gestureHandling: "greedy",
    }),
    []
  );

  const mapContainerStyle = useMemo(
    () => ({
      width: "100%",
      height: mapHeight,
    }),
    [mapHeight]
  );

  // Fetch garage availability data on mount
  useEffect(() => {
    const fetchGarageData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://content.osu.edu/v2/parking/garages/availability",
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch garage data");
        }

        const data = await response.json();

        console.log("API Response:", data);
        console.log("API Garages:", data.data?.garages);

        if (data.status === "success" && data.data?.garages) {
          // Combine API data with our location data
          const combined = garageLocations.map((location) => {
            const apiData = data.data.garages.find(
              (g) => g.name === location.name
            );

            console.log(`Matching ${location.name}:`, apiData);

            return {
              ...location,
              capacity: apiData?.capacity || 0,
              count: apiData?.count || 0,
              percentage: apiData?.percentage || 0,
              available: apiData ? apiData.capacity - apiData.count : 0,
              lastUpdated: apiData?.lastUpdated || null,
            };
          });

          console.log("Combined garage data:", combined);
          setGaragesData(combined);
          setError(null);
        } else {
          throw new Error("Invalid data format from API");
        }
      } catch (err) {
        console.error("Error fetching garage data:", err);
        setError(err.message);
        // Set garages with empty data if API fails
        setGaragesData(garageLocations.map(loc => ({
          ...loc,
          capacity: 0,
          count: 0,
          percentage: 0,
          available: 0,
          lastUpdated: null,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchGarageData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateHeight = () => {
      // Use full viewport height
      setMapHeight("100vh");
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  const handleGetDirections = (garage) => {
    setRoutingGarage(garage);
    setShowRoutingModal(true);
    setSelectedGarage(null); // Close info window
  };

  const openInMapApp = (app, garage) => {
    const { lat, lng } = garage;
    let url;

    switch (app) {
      case "google":
        // Google Maps works on all platforms
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        break;
      case "apple":
        // Apple Maps (works on iOS and macOS)
        url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
        break;
      case "waze":
        // Waze
        url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        break;
      default:
        return;
    }

    window.open(url, "_blank");
    setShowRoutingModal(false);
  };

  if (loadError) return <div className="p-4 text-red-600">Error loading Google Maps</div>;
  if (!isLoaded) return <div className="p-4">Loading Map...</div>;

  return (
    <div className="relative w-full" style={{ height: mapHeight, overflow: "hidden" }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={mapOptions}
      >
        {/* Garage markers */}
        {garagesData.map((garage, index) => {
          const color = getMarkerColor(garage.percentage);

          return (
            <Marker
              key={index}
              position={{ lat: garage.lat, lng: garage.lng }}
              onClick={() => setSelectedGarage(garage)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: color,
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: "#ffffff",
              }}
            />
          );
        })}

        {/* Info Window for selected garage */}
        {selectedGarage && (
          <InfoWindow
            position={{ lat: selectedGarage.lat, lng: selectedGarage.lng }}
            onCloseClick={() => setSelectedGarage(null)}
          >
            <div className="p-2" style={{ minWidth: "200px" }}>
              <h3 className="font-bold text-lg mb-2" style={{ color: "#BB0000" }}>
                {selectedGarage.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedGarage.address}
              </p>

              {selectedGarage.capacity > 0 ? (
                <>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Available:</span>
                      <span className="font-bold">{selectedGarage.available} spots</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Capacity:</span>
                      <span>{selectedGarage.capacity}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Status:</span>
                      <span
                        className="font-semibold"
                        style={{ color: getMarkerColor(selectedGarage.percentage) }}
                      >
                        {getStatusText(selectedGarage.percentage)} ({selectedGarage.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${selectedGarage.percentage}%`,
                        backgroundColor: getMarkerColor(selectedGarage.percentage),
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 mb-3">
                  Capacity data unavailable
                </p>
              )}

              <button
                onClick={() => handleGetDirections(selectedGarage)}
                className="w-full py-2 px-4 rounded font-semibold text-white transition-colors"
                style={{
                  backgroundColor: "#BB0000",
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#990000"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#BB0000"}
              >
                Get Directions
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend */}
      <div
        className="absolute left-3 bg-white p-4 rounded-xl shadow-lg"
        style={{
          bottom: `calc(80px + env(safe-area-inset-bottom, 0px))`
        }}
      >
        <h3 className="font-semibold text-gray-800 mb-2">Garage Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#10B981" }} />
            <span>Available (0-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
            <span>Moderate (61-85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#EF4444" }} />
            <span>Nearly Full (86-100%)</span>
          </div>
        </div>
      </div>

      {/* Info overlay */}
      <div
        className="absolute left-3 bg-white p-4 rounded-xl shadow-lg max-w-xs"
        style={{
          top: `calc(12px + env(safe-area-inset-top, 0px))`
        }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#BB0000" }}>
          OSU Parking Garages
        </h2>
        <p className="text-sm text-gray-600">
          {loading ? "Loading garage data..." : error ? `Error: ${error}` : `${garagesData.length} garages • Click markers for details`}
        </p>
      </div>

      {/* Routing modal */}
      {showRoutingModal && routingGarage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRoutingModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: "#BB0000" }}>
              Get Directions
            </h3>
            <p className="text-gray-600 mb-4">
              Choose your preferred map app to navigate to {routingGarage.name}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => openInMapApp("google", routingGarage)}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Google Maps</span>
              </button>

              <button
                onClick={() => openInMapApp("apple", routingGarage)}
                className="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                <span>Apple Maps</span>
              </button>

              <button
                onClick={() => openInMapApp("waze", routingGarage)}
                className="w-full py-3 px-4 text-white rounded-lg font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "#33CCFF" }}
              >
                <span>Waze</span>
              </button>
            </div>

            <button
              onClick={() => setShowRoutingModal(false)}
              className="w-full mt-4 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
