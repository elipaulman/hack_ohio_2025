import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSensorManager } from '../../hooks/useSensorManager';
import { useStepDetector } from '../../hooks/useStepDetector';
import { usePositionTracker } from '../../hooks/usePositionTracker';
import { usePathFollowing } from '../../hooks/usePathFollowing';
import FloorPlanCanvasWithPath from './FloorPlanCanvasWithPath';
import './IndoorNav.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// TODO: Set DEV_MODE to false for production builds and before demoing
const DEV_MODE = false; // Set to false to disable dev features

// Floor configuration
const FLOOR_CONFIG = {
  basement: {
    name: 'Basement',
    csvPath: '/data/basement_labels.csv',
    imagePath: '/scott-lab-basement.jpg',
    apiId: 'basement'
  },
  floor_1: {
    name: '1st Floor',
    csvPath: '/data/floor_1_labels.csv',
    imagePath: '/scott-lab-1st-floor.jpg',
    apiId: 'floor_1'
  },
  floor_2: {
    name: '2nd Floor',
    csvPath: '/data/floor_2_labels.csv',
    imagePath: '/scott-lab-2nd-floor.jpg',
    apiId: 'floor_2'
  }
};

// Parse CSV data and group rooms with multiple doors
const parseCSV = (csvText, floor = '') => {
  const lines = csvText.trim().split('\n');
  // Skip header line
  const locationMap = new Map(); // Use Map to avoid duplicates
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= 4) {
      const roomName = values[3].trim();
      const notes = values[4] ? values[4].trim() : '';
      
      // Skip calibration points
      if (roomName === 'ori' || roomName === 'ori-tr') continue;
      
      // Extract base room name (remove _1, _2 suffixes for rooms with multiple doors)
      const baseRoomName = roomName.split('_')[0];
      
      // Only add if not already in map (avoids duplicate entries for multi-door rooms)
      if (!locationMap.has(baseRoomName)) {
        // Clean up the notes to remove door numbers
        let cleanNotes = notes.replace(/ Door \d+$/, '');
        
        // On first floor, rooms ending with 'E' are exits
        if (floor === 'floor_1' && baseRoomName.endsWith('E') && !baseRoomName.endsWith('SE') && !baseRoomName.endsWith('NE')) {
          cleanNotes = cleanNotes ? `${cleanNotes} (Exit)` : `${baseRoomName} (Exit)`;
        }
        
        locationMap.set(baseRoomName, {
          id: baseRoomName,
          name: cleanNotes || baseRoomName
        });
      }
    }
  }
  
  // Convert Map to array and sort by room name
  return Array.from(locationMap.values()).sort((a, b) => a.id.localeCompare(b.id));
};

const IndoorNavPage = ({ onNavigate }) => {
  const sensorManager = useSensorManager();
  const stepDetector = useStepDetector();
  const positionTracker = usePositionTracker();
  const stopSensors = sensorManager.stop;
  const floorPlanRef = useRef(null);

  const [isTracking, setIsTracking] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showStepCalibration, setShowStepCalibration] = useState(false);
  const [statusText, setStatusText] = useState('Select floor, starting location, and destination');
  const [showLoading, setShowLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [displayHeading, setDisplayHeading] = useState(0);
  const [selectedFloor, setSelectedFloor] = useState('floor_1');
  const [selectedStartFloor, setSelectedStartFloor] = useState('floor_1');
  const [selectedEndFloor, setSelectedEndFloor] = useState('floor_1');
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [startLocations, setStartLocations] = useState([]);
  const [endLocations, setEndLocations] = useState([]);
  const [pathData, setPathData] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [viewFloor, setViewFloor] = useState('floor_1'); // Which floor map to display

  // Path following hook for navigation
  const pathFollowing = usePathFollowing(pathData);

  // Debug: Log path following state
  useEffect(() => {
    console.log('[IndoorNavPage] pathFollowing.currentPosition:', pathFollowing.currentPosition);
    console.log('[IndoorNavPage] pathData:', pathData);
  }, [pathFollowing.currentPosition, pathData]);

  // Load start locations when start floor changes
  useEffect(() => {
    const loadStartLocations = async () => {
      try {
        const floorConfig = FLOOR_CONFIG[selectedStartFloor];
        if (!floorConfig) {
          console.error('Invalid floor configuration for:', selectedStartFloor);
          return;
        }
        
        const response = await fetch(floorConfig.csvPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch floor data: ${response.status}`);
        }
        
        const csvText = await response.text();
        const locations = parseCSV(csvText, selectedStartFloor);
        setStartLocations(locations);
        
        // Clear the selected start room when floor changes
        // This prevents selecting a room that doesn't exist on the new floor
        setSelectedStart('');
        
        // Clear path data since the start point is no longer valid
        setPathData(null);
      } catch (error) {
        console.error('Error loading start locations:', error);
        setErrorMessage(`Failed to load ${FLOOR_CONFIG[selectedStartFloor]?.name || 'floor'} locations`);
        setStartLocations([]);
      }
    };
    
    loadStartLocations();
  }, [selectedStartFloor]);

  // Load end locations when end floor changes
  useEffect(() => {
    const loadEndLocations = async () => {
      try {
        const floorConfig = FLOOR_CONFIG[selectedEndFloor];
        if (!floorConfig) {
          console.error('Invalid floor configuration for:', selectedEndFloor);
          return;
        }
        
        const response = await fetch(floorConfig.csvPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch floor data: ${response.status}`);
        }
        
        const csvText = await response.text();
        const locations = parseCSV(csvText, selectedEndFloor);
        setEndLocations(locations);
        
        // Clear the selected destination room when floor changes
        // This prevents selecting a room that doesn't exist on the new floor
        setSelectedDestination('');
        
        // Clear path data since the destination is no longer valid
        setPathData(null);
      } catch (error) {
        console.error('Error loading end locations:', error);
        setErrorMessage(`Failed to load ${FLOOR_CONFIG[selectedEndFloor]?.name || 'floor'} locations`);
        setEndLocations([]);
      }
    };
    
    loadEndLocations();
  }, [selectedEndFloor]);

  // Update map floor when start floor changes (show starting floor by default)
  useEffect(() => {
    setSelectedFloor(selectedStartFloor);
    setViewFloor(selectedStartFloor);
  }, [selectedStartFloor]);
  
  // Validate viewFloor to prevent rendering errors
  useEffect(() => {
    if (!FLOOR_CONFIG[viewFloor]) {
      console.error('[IndoorNavPage] Invalid viewFloor:', viewFloor, 'resetting to default');
      setViewFloor('floor_1');
    }
  }, [viewFloor]);

  // Get available floors that have path segments
  const getFloorsWithPaths = () => {
    if (!pathData) return [];
    
    try {
      if (pathData.segments && Array.isArray(pathData.segments)) {
        // Multi-floor path - return all floors with segments
        return pathData.segments
          .filter(seg => seg && seg.floor) // Filter out invalid segments
          .map(seg => seg.floor);
      } else if (pathData.waypoints && Array.isArray(pathData.waypoints)) {
        // Single-floor path
        const floor = pathData.start_floor || selectedStartFloor || selectedFloor;
        return floor ? [floor] : [];
      }
    } catch (error) {
      console.error('[IndoorNavPage] Error getting floors with paths:', error);
    }
    return [];
  };

  const floorsWithPaths = getFloorsWithPaths();

  const buildingRotationOffset = 70;
  const applyBuildingOffset = useCallback((headingValue) => {
    if (headingValue === null || headingValue === undefined || Number.isNaN(headingValue)) {
      return 0;
    }
    const normalized = (headingValue - buildingRotationOffset) % 360;
    return (normalized + 360) % 360;
  }, [buildingRotationOffset]);

  // Handle motion data
  const handleMotionData = useCallback((data) => {
    stepDetector.processAcceleration(data.acceleration);
  }, [stepDetector]);

  // Handle orientation data
  const handleOrientationData = useCallback((data) => {
    const compassAdjustedHeading = applyBuildingOffset(
      data.compassHeading !== undefined ? data.compassHeading : data.heading
    );

    positionTracker.updateHeading(compassAdjustedHeading);
    setDisplayHeading(compassAdjustedHeading);
  }, [applyBuildingOffset, positionTracker]);

  // Handle step detection
  const handleStep = useCallback(() => {
    if (isNavigating) {
      pathFollowing.onStep();
    }
  }, [isNavigating, pathFollowing]);

  // Set up sensor callbacks
  useEffect(() => {
    sensorManager.onMotion(handleMotionData);
    sensorManager.onOrientation(handleOrientationData);
  }, [sensorManager, handleMotionData, handleOrientationData]);

  // Set up step detector callback
  useEffect(() => {
    stepDetector.onStep(handleStep);
  }, [stepDetector, handleStep]);

  useEffect(() => {
    return () => {
      stopSensors();
    };
  }, [stopSensors]);

  // Start tracking
  const startTracking = async () => {
    setShowLoading(true);
    setLoadingText('Requesting sensor permissions...');

    const permissionResult = await sensorManager.requestPermission();

    if (!permissionResult.success) {
      setShowLoading(false);
      setErrorMessage(permissionResult.error);
      return;
    }

    setLoadingText('Starting sensors...');

    const started = sensorManager.start(permissionResult.hasPermission ?? true);

    if (!started) {
      setShowLoading(false);
      setErrorMessage('Failed to start sensors');
      return;
    }

    setShowLoading(false);
    setIsTracking(true);
    setStatusText('Tracking...');
    setShowStepCalibration(true);
  };

  // Stop tracking
  const stopTracking = () => {
    sensorManager.stop();
    setIsTracking(false);
    positionTracker.resetTracking();
    positionTracker.clearPosition();
    setStatusText('Tracking stopped');
    setShowStepCalibration(false);
  };

  // Start navigation (starts sensors and path following)
  const handleStartNavigation = async () => {
    if (!pathData) {
      setErrorMessage('Please select a starting location and destination first');
      return;
    }

    setShowLoading(true);
    setLoadingText('Requesting sensor permissions...');

    const permissionResult = await sensorManager.requestPermission();

    if (!permissionResult.success) {
      setShowLoading(false);
      setErrorMessage(permissionResult.error);
      return;
    }

    setLoadingText('Starting sensors...');

    const started = sensorManager.start(permissionResult.hasPermission ?? true);

    if (!started) {
      setShowLoading(false);
      setErrorMessage('Failed to start sensors');
      return;
    }

    // Start path following
    const navigationStarted = pathFollowing.startNavigation();

    if (!navigationStarted) {
      setShowLoading(false);
      setErrorMessage('Failed to start navigation - no path available');
      return;
    }

    setShowLoading(false);
    setIsTracking(true);
    setIsNavigating(true);
    setStatusText('Navigating...');
    setIsPanelCollapsed(true); // Auto-collapse panel when navigation starts
  };

  // Stop navigation
  const handleStopNavigation = () => {
    sensorManager.stop();
    pathFollowing.stopNavigation();
    setIsTracking(false);
    setIsNavigating(false);
    setStatusText(`Navigation stopped - Path: ${selectedStart} to ${selectedDestination}`);
  };

  // Set position (for step tracking, not for pathfinding start point)
  const setPosition = (x, y) => {
    positionTracker.setInitialPosition(x, y);
  };

  const handleRecenterView = useCallback(() => {
    if (floorPlanRef.current && typeof floorPlanRef.current.resetView === 'function') {
      floorPlanRef.current.resetView();
    }
  }, [floorPlanRef]);

  // Start step calibration
  const startStepCalibration = () => {
    stepDetector.startCalibration();
    setStatusText('Walk 10 steps normally...');
  };

  // Finish step calibration
  const finishStepCalibration = () => {
    const result = stepDetector.finishCalibration();
    setShowStepCalibration(false);
    setStatusText(`Calibration complete! ${result.steps} steps detected`);
  };

  // Find path to destination
  const handleFindPath = useCallback(async (start, destination, startFloor, endFloor) => {
    // Validate all required parameters
    if (!start || !destination || !startFloor || !endFloor) {
      console.log('[DEBUG] Missing start, destination, or floors');
      return;
    }
    
    // Validate that floors exist in configuration
    if (!FLOOR_CONFIG[startFloor] || !FLOOR_CONFIG[endFloor]) {
      console.error('[DEBUG] Invalid floor configuration');
      setErrorMessage('Invalid floor selection');
      return;
    }
    
    // Prevent same room on same floor
    if (start === destination && startFloor === endFloor) {
      setErrorMessage('Start and destination cannot be the same room on the same floor!');
      return;
    }
    
    const isMultiFloor = startFloor !== endFloor;

    setShowLoading(true);
    const floorText = isMultiFloor ? `${FLOOR_CONFIG[startFloor].name} to ${FLOOR_CONFIG[endFloor].name}` : FLOOR_CONFIG[startFloor].name;
    setLoadingText(`Finding path from ${start} to ${destination} (${floorText})...`);

    try {
      // Convert IDs to uppercase and ensure proper format
      const startRoomId = start.toUpperCase().trim();
      const destRoomId = destination.toUpperCase().trim();
      const startFloorApiId = FLOOR_CONFIG[startFloor].apiId;
      const endFloorApiId = FLOOR_CONFIG[endFloor].apiId;
      
      // Get ADA compliance setting from localStorage
      const adaCompliance = localStorage.getItem('adaCompliance') === 'true';
      
      console.log('[DEBUG] ============ PATH CALCULATION ============');
      console.log('[DEBUG] Start:', `${startFloorApiId}/${startRoomId}`);
      console.log('[DEBUG] End:', `${endFloorApiId}/${destRoomId}`);
      console.log('[DEBUG] Multi-floor:', isMultiFloor);
      console.log('[DEBUG] ADA Compliance:', adaCompliance ? 'ELEVATOR' : 'STAIRS');
      
      // Build query using the selected start and end rooms with floor info
      const queryParams = new URLSearchParams({
        start_floor: startFloorApiId,
        end_floor: endFloorApiId,
        start: startRoomId,
        end: destRoomId,
        ada_compliance: adaCompliance.toString()
      });

      const apiUrl = `${API_BASE_URL}/api/pathfinding?${queryParams.toString()}`;
      console.log('[DEBUG] API request URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('[DEBUG] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMsg = 'Failed to find path';
        try {
          const errorData = await response.json();
          console.log('[DEBUG] Error response:', errorData);
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const receivedPathData = await response.json();
      
      // Validate received path data
      if (!receivedPathData) {
        throw new Error('No path data received from server');
      }
      
      // Check if path has required data structure
      const hasWaypoints = receivedPathData.waypoints && receivedPathData.waypoints.length > 0;
      const hasSegments = receivedPathData.segments && Array.isArray(receivedPathData.segments) && receivedPathData.segments.length > 0;
      
      if (!hasWaypoints && !hasSegments) {
        throw new Error('Invalid path data: no waypoints or segments found');
      }
      console.log('[DEBUG] ✅ Path found!');
      console.log('[DEBUG] - Start:', `${receivedPathData.start_floor || startFloorApiId}/${receivedPathData.start_room}`);
      console.log('[DEBUG] - End:', `${receivedPathData.end_floor || endFloorApiId}/${receivedPathData.end_room}`);
      console.log('[DEBUG] - Distance:', receivedPathData.distance || receivedPathData.total_distance, 'units');
      console.log('[DEBUG] - Waypoints:', receivedPathData.waypoints?.length || 0);
      if (receivedPathData.transition) {
        console.log('[DEBUG] - Transition:', `${receivedPathData.transition.exit_stair} -> ${receivedPathData.transition.arrive_stair}`);
      }
      console.log('[DEBUG] =========================================');
      
      // Store path data for rendering
      setPathData(receivedPathData);
      
      setShowLoading(false);
      const distance = Math.round(receivedPathData.distance || receivedPathData.total_distance || 0);
      const floorInfo = isMultiFloor ? ` (${FLOOR_CONFIG[startFloor].name} → ${FLOOR_CONFIG[endFloor].name})` : '';
      setStatusText(`Path found: ${startRoomId} to ${destRoomId}${floorInfo} (${distance} units)`);
      
    } catch (error) {
      setShowLoading(false);
      console.error('[DEBUG] ❌ Pathfinding error:', error);
      
      // Provide user-friendly error messages
      let userErrorMessage = 'Error finding path';
      if (error.message) {
        userErrorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userErrorMessage = 'Network error: Cannot connect to pathfinding server';
      }
      
      setErrorMessage(userErrorMessage);
      setPathData(null); // Clear any stale path data
    }
  }, [setErrorMessage, setShowLoading, setLoadingText, setStatusText]);

  // Auto-trigger pathfinding when both start and destination are selected
  useEffect(() => {
    // Validate all selections before triggering pathfinding
    if (!selectedStart || !selectedDestination || !selectedStartFloor || !selectedEndFloor) {
      return; // Missing required selections
    }
    
    // Validate that selected rooms exist in their respective floor locations
    const startExists = startLocations.find(loc => loc.id === selectedStart);
    const destExists = endLocations.find(loc => loc.id === selectedDestination);
    
    if (!startExists || !destExists) {
      console.log('[DEBUG] Selected rooms not found in floor locations, skipping pathfinding');
      return;
    }
    
    // Prevent same room on same floor
    if (selectedStart === selectedDestination && selectedStartFloor === selectedEndFloor) {
      console.log('[DEBUG] Start and destination are the same room on same floor, skipping pathfinding');
      return;
    }
    
    console.log('[DEBUG] Start and destination selected, auto-triggering pathfinding');
    handleFindPath(selectedStart, selectedDestination, selectedStartFloor, selectedEndFloor);
  }, [selectedStart, selectedDestination, selectedStartFloor, selectedEndFloor, startLocations, endLocations, handleFindPath]);

  // Update status text when destination is reached
  useEffect(() => {
    if (isNavigating && pathFollowing.isDestinationReached()) {
      setStatusText('Destination reached! 🎉');
    } else if (isNavigating) {
      const percent = pathFollowing.getProgressPercent().toFixed(0);
      setStatusText(`Navigating... ${percent}% complete`);
    }
  }, [isNavigating, pathFollowing]);

  return (
    <div className="indoor-nav-container">
      {/* Sub-Header for Indoor Nav */}
      {DEV_MODE && (
        <div className="indoor-nav-subheader">
          <h2>Indoor Navigator</h2>
          <button
            className="debug-toggle"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Debug' : 'Debug Info'}
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-text" aria-live="polite">
          {statusText}
        </div>
        <button
          type="button"
          className="recenter-btn recenter-btn--inline"
          onClick={handleRecenterView}
          title="Recenter map"
          aria-label="Recenter map"
        >
          ⌖
        </button>
      </div>

      {/* Floor View Switcher - Show when multi-floor path exists */}
      {floorsWithPaths.length > 1 && (
        <div className="floor-switcher">
          <div className="floor-switcher-label">View Floor:</div>
          {floorsWithPaths.map(floor => (
            <button
              key={`floor-view-${floor}`}
              className={`floor-btn ${viewFloor === floor ? 'active' : ''}`}
              onClick={() => setViewFloor(floor)}
            >
              {FLOOR_CONFIG[floor].name}
            </button>
          ))}
        </div>
      )}

      {/* Floor Plan Canvas */}
      <div className="canvas-container">
        <FloorPlanCanvasWithPath
          ref={floorPlanRef}
          floorPlanPath={FLOOR_CONFIG[viewFloor].imagePath}
          pathData={pathData}
          currentFloor={viewFloor}
          userPosition={pathFollowing.currentPosition}
          heading={displayHeading}
          onCanvasClick={setPosition}
        />
        
        <button
          type="button"
          className="recenter-btn recenter-btn--floating"
          onClick={handleRecenterView}
          title="Recenter map"
          aria-label="Recenter map"
        >
          ⌖
        </button>
      </div>

      {/* Main Controls - Hidden for now, using dropdowns instead */}
      {false && (
        <div className="main-controls">
          {!isTracking ? (
            <button className="btn btn-start" onClick={startTracking}>
              Start Tracking
            </button>
          ) : (
            <>
              <button className="btn btn-stop" onClick={stopTracking}>
                Stop Tracking
              </button>
              <button className="btn btn-secondary">
                Reset
              </button>
            </>
          )}
        </div>
      )}

      {/* Navigation Selection Panel */}
      <div className={`navigation-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          <h3>Plan Your Route</h3>
          <button
            type="button"
            className="panel-toggle"
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            aria-label={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isPanelCollapsed ? '▲' : '▼'}
          </button>
        </div>
        
        {!isPanelCollapsed && (
          <>
            {/* Starting Location Section */}
            <div className="location-section">
              <h4 className="section-title">Starting Point</h4>
              
              <div className="form-group">
                <label>Floor:</label>
                <select
                  value={selectedStartFloor}
                  onChange={(e) => setSelectedStartFloor(e.target.value)}
                  className="location-select"
                >
                  {Object.entries(FLOOR_CONFIG).map(([key, config]) => (
                    <option key={`start-floor-${key}`} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Room:</label>
                <select
                  value={selectedStart}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    
                    // Validate that the room exists in the current floor
                    if (newStart && !startLocations.find(loc => loc.id === newStart)) {
                      console.error('Selected start room not found in current floor locations');
                      setErrorMessage('Selected room is not available on this floor');
                      return;
                    }
                    
                    // Validate that start and destination are not the same on the same floor
                    if (newStart === selectedDestination && newStart !== '' && selectedStartFloor === selectedEndFloor) {
                      setErrorMessage('Start and destination cannot be the same room on the same floor!');
                      return;
                    }
                    
                    setSelectedStart(newStart);
                    
                    // Clear any existing error when successfully selecting a room
                    if (newStart && errorMessage) {
                      setErrorMessage('');
                    }
                  }}
                  className="location-select"
                  disabled={startLocations.length === 0}
                >
                  <option value="">-- Select starting room --</option>
                  {startLocations.map(location => (
                    <option 
                      key={`start-${location.id}`} 
                      value={location.id}
                      disabled={location.id === selectedDestination && selectedStartFloor === selectedEndFloor}
                    >
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination Section */}
            <div className="location-section">
              <h4 className="section-title">Destination</h4>
              
              <div className="form-group">
                <label>Floor:</label>
                <select
                  value={selectedEndFloor}
                  onChange={(e) => setSelectedEndFloor(e.target.value)}
                  className="location-select"
                >
                  {Object.entries(FLOOR_CONFIG).map(([key, config]) => (
                    <option key={`end-floor-${key}`} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Room:</label>
                <select
                  value={selectedDestination}
                  onChange={(e) => {
                    const newDestination = e.target.value;
                    
                    // Validate that the room exists in the current floor
                    if (newDestination && !endLocations.find(loc => loc.id === newDestination)) {
                      console.error('Selected destination room not found in current floor locations');
                      setErrorMessage('Selected room is not available on this floor');
                      return;
                    }
                    
                    // Validate that start and destination are not the same on the same floor
                    if (newDestination === selectedStart && newDestination !== '' && selectedStartFloor === selectedEndFloor) {
                      setErrorMessage('Start and destination cannot be the same room on the same floor!');
                      return;
                    }
                    
                    setSelectedDestination(newDestination);
                    
                    // Clear any existing error when successfully selecting a room
                    if (newDestination && errorMessage) {
                      setErrorMessage('');
                    }
                  }}
                  className="location-select"
                  disabled={endLocations.length === 0}
                >
                  <option value="">-- Select destination room --</option>
                  {endLocations.map(location => (
                    <option 
                      key={`dest-${location.id}`} 
                      value={location.id}
                      disabled={location.id === selectedStart && selectedStartFloor === selectedEndFloor}
                    >
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="auto-find-hint">💡 Path will calculate automatically. Multi-floor routes use stairs.</p>

            {/* Start Navigation Button */}
            {pathData && !isNavigating && (
              <div className="form-group">
                <button
                  className="btn btn-primary btn-start-navigation"
                  onClick={handleStartNavigation}
                >
                  Start Navigation
                </button>
              </div>
            )}

            {/* Stop Navigation Button */}
            {isNavigating && (
              <div className="form-group">
                <button
                  className="btn btn-stop"
                  onClick={handleStopNavigation}
                >
                  Stop Navigation
                </button>
                <div className="navigation-progress">
                  Progress: {pathFollowing.getProgressPercent().toFixed(0)}%
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Step Calibration Panel */}
      {showStepCalibration && !stepDetector.isCalibrating && (
        <div className="step-calibration-panel">
          <h3>Calibrate Steps</h3>
          <p>Walk 10 normal steps to calibrate step detection</p>
          <button className="btn btn-secondary" onClick={startStepCalibration}>
            Start Calibration
          </button>
        </div>
      )}

      {stepDetector.isCalibrating && (
        <div className="step-calibration-panel active">
          <h3>Walk normally...</h3>
          <p>Steps: {stepDetector.calibrationSteps}</p>
          <button className="btn btn-primary" onClick={finishStepCalibration}>
            Done Calibrating
          </button>
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && DEV_MODE && (
        <div className="debug-panel">
          <div className="debug-panel-header">
            <h3>Debug Info</h3>
            <button
              type="button"
              className="debug-close"
              onClick={() => setShowDebug(false)}
              aria-label="Close debug panel"
            >
              ×
            </button>
          </div>
          <div className="debug-grid">
            <div>
              <strong>Acceleration:</strong>
              <div>X: {sensorManager.acceleration.x.toFixed(2)}</div>
              <div>Y: {sensorManager.acceleration.y.toFixed(2)}</div>
              <div>Z: {sensorManager.acceleration.z.toFixed(2)}</div>
            </div>
            <div>
              <strong>Gyro Alpha:</strong>
              <div>{sensorManager.rotationRate.alpha.toFixed(2)}°/s</div>
            </div>
            <div>
              <strong>Compass:</strong>
              <div>{Math.round(displayHeading)}°</div>
            </div>
            <div>
              <strong>Position:</strong>
              <div>X: {Math.round(positionTracker.position.x)}</div>
              <div>Y: {Math.round(positionTracker.position.y)}</div>
            </div>
            <div>
              <strong>Drift Estimate:</strong>
              <div>{positionTracker.driftEstimate.toFixed(2)}m</div>
            </div>
            <div>
              <strong>Stationary:</strong>
              <div>{stepDetector.isStationary ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <strong>Steps:</strong>
              <div>{stepDetector.stepCount}</div>
            </div>
            <div>
              <strong>Heading:</strong>
              <div>{Math.round(displayHeading)}°</div>
            </div>
            <div>
              <strong>Confidence:</strong>
              <div>{positionTracker.confidenceLevel.toUpperCase()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {showLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">{loadingText}</div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="error-modal">
          <div className="error-content">
            <h3>Error</h3>
            <p>{errorMessage}</p>
            <button className="btn btn-primary" onClick={() => setErrorMessage('')}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndoorNavPage;
