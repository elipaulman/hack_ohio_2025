import React, { useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import localGarageData from "../data/garageData.json";

const center = { lat: 40.0067, lng: -83.0305 }; // OSU campus center
const DEFAULT_MAP_HEIGHT = "calc(100vh - 112px)";

// Garage locations with coordinates
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

// Helper: color and text based on % full
function getMarkerColor(percentage) {
  const p = Number(percentage);
  if (!Number.isFinite(p)) return "#9CA3AF"; // gray for unknown
  if (p <= 60) return "#10B981"; // green
  if (p <= 85) return "#F59E0B"; // amber
  return "#EF4444"; // red
}
function getStatusText(percentage) {
  if (percentage <= 60) return "Available";
  if (percentage <= 85) return "Moderate";
  return "Nearly Full";
}

export default function GaragesPage() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const [garagesData, setGaragesData] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
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
    () => ({ width: "100%", height: mapHeight }),
    [mapHeight]
  );

  // Fetch API data with static fallback
  useEffect(() => {
    const fetchGarageData = async () => {
      setLoading(true);
      try {
        const apiUrl =
          process.env.NODE_ENV === "development"
            ? "/v2/parking/garages/availability"
            : null; // in production, skip fetch entirely

        let data = null;

        if (apiUrl) {
          try {
            const response = await fetch(apiUrl, {
              headers: { Accept: "application/json" },
            });
            if (response.ok) {
              data = await response.json();
              console.log("[GaragesPage] Live API data loaded.");
            } else {
              throw new Error(`API responded with ${response.status}`);
            }
          } catch (err) {
            console.warn("[GaragesPage] Live fetch failed; using local data.", err);
            data = localGarageData; // fallback
          }
        } else {
          console.log("[GaragesPage] Using local data (production).");
          data = localGarageData;
        }

        if (data.status === "success" && data.data?.garages) {
          const combined = garageLocations.map((loc) => {
            const apiData = data.data.garages.find((g) =>
              g.name.toLowerCase().includes(loc.name.toLowerCase())
            );
            return {
              ...loc,
              capacity: apiData?.capacity ?? 0,
              count: apiData?.count ?? 0,
              percentage: apiData?.percentage ?? 0,
              available: apiData
                ? Math.max(apiData.capacity - apiData.count, 0)
                : 0,
              lastUpdated: apiData?.lastUpdated ?? null,
            };
          });

          setGaragesData(combined);
          setError(null);
        } else {
          throw new Error("Invalid garage data structure");
        }
      } catch (err) {
        console.error("Error loading garage data:", err);
        setError(err.message);
        setGaragesData(
          garageLocations.map((g) => ({
            ...g,
            capacity: 0,
            count: 0,
            percentage: 0,
            available: 0,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGarageData();
  }, []);

  // Responsive map height
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHeight = () => {
      const header = document.querySelector("header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const available = window.innerHeight - headerHeight;
      const normalized = `${Math.max(Math.round(available), 320)}px`;
      setMapHeight((prev) => (prev === normalized ? prev : normalized));
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  if (loadError)
    return <div className="p-4 text-red-600">Error loading Google Maps</div>;
  if (!isLoaded) return <div className="p-4">Loading Map …</div>;

  return (
    <div className="relative w-full" style={{ height: mapHeight, overflow: "hidden" }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={mapOptions}
      >
        {garagesData.map((garage, i) => (
          <Marker
            key={i}
            position={{ lat: garage.lat, lng: garage.lng }}
            onClick={() => setSelectedGarage(garage)}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
              scale: 12,
              fillColor: getMarkerColor(garage.percentage),
              fillOpacity: 0.9,
              strokeWeight: 2,
              strokeColor: "#ffffff",
            }}
          />
        ))}

        {selectedGarage && (
          <InfoWindow
            position={{ lat: selectedGarage.lat, lng: selectedGarage.lng }}
            onCloseClick={() => setSelectedGarage(null)}
          >
            <div className="p-2" style={{ minWidth: "200px" }}>
              <h3 className="font-bold text-lg mb-1" style={{ color: "#BB0000" }}>
                {selectedGarage.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{selectedGarage.address}</p>

              {selectedGarage.capacity > 0 ? (
                <>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Available:</span>
                    <strong>{selectedGarage.available}</strong>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Capacity:</span>
                    <span>{selectedGarage.capacity}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Status:</span>
                    <span
                      className="font-semibold"
                      style={{ color: getMarkerColor(selectedGarage.percentage) }}
                    >
                      {getStatusText(selectedGarage.percentage)} ({selectedGarage.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${selectedGarage.percentage}%`,
                        backgroundColor: getMarkerColor(selectedGarage.percentage),
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Capacity data unavailable</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-20 left-3 bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Garage Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: getMarkerColor(30) }} />
            <span>Available (0–60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: getMarkerColor(75) }} />
            <span>Moderate (61–85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: getMarkerColor(95) }} />
            <span>Nearly Full (86–100%)</span>
          </div>
        </div>
      </div>

      {/* Info overlay */}
      <div className="absolute top-3 left-3 bg-white p-4 rounded-xl shadow-lg max-w-xs">
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#BB0000" }}>
          OSU Parking Garages
        </h2>
        <p className="text-sm text-gray-600">
          {loading
            ? "Loading garage data…"
            : error
            ? `Error: ${error}`
            : `${garagesData.length} garages • Click markers for details`}
        </p>
      </div>
    </div>
  );
}
