import React, { useState, useEffect, useCallback } from 'react';
import { useSensorManager } from '../../hooks/useSensorManager';
import { useStepDetector } from '../../hooks/useStepDetector';
import { usePositionTracker } from '../../hooks/usePositionTracker';
import FloorPlanCanvas from './FloorPlanCanvas';
import './IndoorNav.css';

const IndoorNavPage = ({ onNavigate }) => {
  const sensorManager = useSensorManager();
  const stepDetector = useStepDetector();
  const positionTracker = usePositionTracker();
  const stopSensors = sensorManager.stop;

  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrationMode, setIsCalibrationMode] = useState(true);
  const [showStepCalibration, setShowStepCalibration] = useState(false);
  const [statusText, setStatusText] = useState('Tap the map to set your starting position');
  const [showLoading, setShowLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [displayHeading, setDisplayHeading] = useState(0);

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
    if (!isCalibrationMode && isTracking) {
      positionTracker.onStep();
    }
  }, [isCalibrationMode, isTracking, positionTracker]);

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
    setIsCalibrationMode(true);
    setStatusText('Tap the map to set your starting position');
    setShowStepCalibration(false);
  };

  // Enter recalibration mode
  const enterRecalibrationMode = () => {
    setIsCalibrationMode(true);
    setStatusText('Tap the map to update your position');
  };

  // Exit calibration mode
  const exitCalibrationMode = () => {
    if (!positionTracker.isPositionSet) {
      setErrorMessage('Please tap the map to set your position first');
      return;
    }

    setIsCalibrationMode(false);
    setStatusText('Ready to track');
  };

  // Set position on canvas click
  const setPosition = (x, y) => {
    if (isCalibrationMode) {
      positionTracker.setInitialPosition(x, y);
      setStatusText('Position set! Click "Done" to continue');
    }
  };

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

  return (
    <div className="indoor-nav-container">
      {/* Sub-Header for Indoor Nav */}
      <div className="indoor-nav-subheader">
        <h2>Indoor Navigator</h2>
        <button
          className="debug-toggle"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide Debug' : 'Debug Info'}
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-text" aria-live="polite">
          {statusText}
        </div>
      </div>

      {/* Floor Plan Canvas */}
      <div className="canvas-container">
        <FloorPlanCanvas
          floorPlanPath="/scott-lab-basement.jpg"
          userPosition={positionTracker.isPositionSet ? positionTracker.position : null}
          heading={displayHeading}
          pathHistory={positionTracker.pathHistory}
          onCanvasClick={setPosition}
        />
      </div>

      {/* Calibration Panel */}
      {isCalibrationMode && (
        <div className="calibration-panel">
          <h3>Set Your Position</h3>
          <p>Tap on the floor plan where you are currently standing</p>
          <button
            className="btn btn-primary"
            onClick={exitCalibrationMode}
            disabled={!positionTracker.isPositionSet}
          >
            Done
          </button>
        </div>
      )}

      {/* Main Controls */}
      {!isCalibrationMode && (
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
              <button className="btn btn-secondary" onClick={enterRecalibrationMode}>
                Reset Position
              </button>
            </>
          )}
        </div>
      )}

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
      {showDebug && (
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
