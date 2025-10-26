import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSensorManager } from '../../hooks/useSensorManager';
import { useStepDetector } from '../../hooks/useStepDetector';
import { usePositionTracker } from '../../hooks/usePositionTracker';
import FloorPlanCanvasWithPath from './FloorPlanCanvasWithPath';
import './IndoorNav.css';

// TODO: Set DEV_MODE to false for production builds and before demoing
const DEV_MODE = true; // Set to false to disable dev features

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

// Parse CSV data
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const locations = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= 4) {
      const roomName = values[3].trim();
      const notes = values[4] ? values[4].trim() : '';
      
      // Skip calibration points and utility rooms
      if (roomName === 'ori' || roomName === 'ori-tr') continue;
      
      locations.push({
        id: roomName,
        name: notes || roomName
      });
    }
  }
  
  return locations;
};

const IndoorNavPage = ({ onNavigate }) => {
  const sensorManager = useSensorManager();
  const stepDetector = useStepDetector();
  const positionTracker = usePositionTracker();
  const stopSensors = sensorManager.stop;
  const floorPlanRef = useRef(null);

  const [isTracking, setIsTracking] = useState(false);
  const [showStepCalibration, setShowStepCalibration] = useState(false);
  const [statusText, setStatusText] = useState('Select floor, starting location, and destination');
  const [showLoading, setShowLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [displayHeading, setDisplayHeading] = useState(0);
  const [selectedFloor, setSelectedFloor] = useState('floor_1');
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [pathData, setPathData] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Load locations from CSV when floor changes
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const floorConfig = FLOOR_CONFIG[selectedFloor];
        const response = await fetch(floorConfig.csvPath);
        const csvText = await response.text();
        const locations = parseCSV(csvText);
        setAvailableLocations(locations);
        
        // Reset selections when floor changes
        setSelectedStart('');
        setSelectedDestination('');
        setPathData(null);
      } catch (error) {
        console.error('Error loading locations:', error);
        setErrorMessage('Failed to load floor locations');
      }
    };
    
    loadLocations();
  }, [selectedFloor]);

  const buildingRotationOffset = 91;
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
    if (isTracking) {
      positionTracker.onStep();
    }
  }, [isTracking, positionTracker]);

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
  const handleFindPath = useCallback(async (start, destination, floor) => {
    if (!start || !destination || !floor) {
      console.log('[DEBUG] Missing start, destination, or floor');
      return;
    }

    setShowLoading(true);
    setLoadingText(`Finding path from ${start} to ${destination}...`);

    try {
      // Convert IDs to uppercase and ensure proper format
      const startRoomId = start.toUpperCase().trim();
      const destRoomId = destination.toUpperCase().trim();
      const floorApiId = FLOOR_CONFIG[floor].apiId;
      
      console.log('[DEBUG] ============ PATH CALCULATION ============');
      console.log('[DEBUG] Floor:', floorApiId);
      console.log('[DEBUG] Start room:', startRoomId);
      console.log('[DEBUG] Destination room:', destRoomId);
      
      // Build query using the selected start and end rooms
      const queryParams = new URLSearchParams({
        floor: floorApiId,
        start: startRoomId,
        end: destRoomId
      });

      const apiUrl = `http://localhost:5000/api/pathfinding?${queryParams.toString()}`;
      console.log('[DEBUG] API request URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('[DEBUG] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Failed to find path';
        try {
          const errorData = await response.json();
          console.log('[DEBUG] Error response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const receivedPathData = await response.json();
      console.log('[DEBUG] ✅ Path found!');
      console.log('[DEBUG] - Start room:', receivedPathData.start_room);
      console.log('[DEBUG] - End room:', receivedPathData.end_room);
      console.log('[DEBUG] - Distance:', receivedPathData.distance, 'units');
      console.log('[DEBUG] - Waypoints:', receivedPathData.waypoints?.length || 0);
      console.log('[DEBUG] =========================================');
      
      // Store path data for rendering
      setPathData(receivedPathData);
      
      setShowLoading(false);
      setStatusText(`Path found: ${startRoomId} to ${destRoomId} (${Math.round(receivedPathData.distance || 0)} units)`);
      
    } catch (error) {
      setShowLoading(false);
      console.error('[DEBUG] ❌ Pathfinding error:', error);
      setErrorMessage(`Error finding path: ${error.message}`);
    }
  }, [setErrorMessage, setShowLoading, setLoadingText, setStatusText]);

  // Auto-trigger pathfinding when both start and destination are selected
  useEffect(() => {
    if (selectedStart && selectedDestination && selectedFloor) {
      console.log('[DEBUG] Start and destination selected, auto-triggering pathfinding');
      handleFindPath(selectedStart, selectedDestination, selectedFloor);
    }
  }, [selectedStart, selectedDestination, selectedFloor, handleFindPath]);

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

      {/* Floor Plan Canvas */}
      <div className="canvas-container">
        <FloorPlanCanvasWithPath
          ref={floorPlanRef}
          floorPlanPath={FLOOR_CONFIG[selectedFloor].imagePath}
          pathData={pathData}
          userPosition={positionTracker.isPositionSet ? positionTracker.position : null}
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
            {/* Floor Selector */}
            <div className="form-group">
              <label>Floor:</label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="location-select"
              >
                {Object.entries(FLOOR_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Starting Location Selector */}
            <div className="form-group">
              <label>Starting Location:</label>
              <select
                value={selectedStart}
                onChange={(e) => {
                  const newStart = e.target.value;
                  if (newStart === selectedDestination && newStart !== '') {
                    setErrorMessage('Start and destination cannot be the same location!');
                    return;
                  }
                  setSelectedStart(newStart);
                }}
                className="location-select"
              >
                <option value="">-- Select starting room --</option>
                {availableLocations.map(location => (
                  <option 
                    key={`start-${location.id}`} 
                    value={location.id}
                    disabled={location.id === selectedDestination}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Selector */}
            <div className="form-group">
              <label>Destination:</label>
              <select
                value={selectedDestination}
                onChange={(e) => {
                  const newDestination = e.target.value;
                  if (newDestination === selectedStart && newDestination !== '') {
                    setErrorMessage('Start and destination cannot be the same location!');
                    return;
                  }
                  setSelectedDestination(newDestination);
                }}
                className="location-select"
              >
                <option value="">-- Select destination room --</option>
                {availableLocations.map(location => (
                  <option 
                    key={`dest-${location.id}`} 
                    value={location.id}
                    disabled={location.id === selectedStart}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="auto-find-hint">💡 Path will calculate automatically when both locations are selected</p>
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
