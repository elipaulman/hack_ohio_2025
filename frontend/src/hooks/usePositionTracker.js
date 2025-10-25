import { useState, useRef, useCallback } from 'react';

export const usePositionTracker = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [heading, setHeading] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [confidenceLevel, setConfidenceLevel] = useState('high');
  const [driftEstimate, setDriftEstimate] = useState(0);
  const [pathHistory, setPathHistory] = useState([]);
  const [isPositionSet, setIsPositionSet] = useState(false);

  // Refs for configuration values
  const stepLengthMetersRef = useRef(0.425);
  const pixelsPerMeterRef = useRef(20);
  const stepsSinceCalibrationRef = useRef(0);
  const recalibrationThresholdRef = useRef(50);
  const maxPathLengthRef = useRef(100);

  // Update confidence based on steps since calibration
  const updateConfidence = useCallback((stepsSince) => {
    if (stepsSince < 20) {
      setConfidenceLevel('high');
      setDriftEstimate(stepsSince * 0.05);
    } else if (stepsSince < 50) {
      setConfidenceLevel('medium');
      setDriftEstimate(stepsSince * 0.1);
    } else {
      setConfidenceLevel('low');
      setDriftEstimate(stepsSince * 0.15);
    }
  }, []);

  // Add to path history
  const addToPathHistory = useCallback((x, y) => {
    setPathHistory(prev => {
      const newHistory = [
        ...prev,
        {
          x,
          y,
          timestamp: Date.now()
        }
      ];
      if (newHistory.length > maxPathLengthRef.current) {
        newHistory.shift();
      }
      return newHistory;
    });
  }, []);

  // Set initial position
  const setInitialPosition = useCallback((x, y) => {
    setPosition({ x, y });
    setIsPositionSet(true);
    setTotalSteps(0);
    stepsSinceCalibrationRef.current = 0;
    setDriftEstimate(0);
    setConfidenceLevel('high');
    setPathHistory([{
      x,
      y,
      timestamp: Date.now()
    }]);
  }, []);

  // Update heading
  const updateHeading = useCallback((newHeading) => {
    setHeading((newHeading + 360) % 360);
  }, []);

  // Handle a step
  const onStep = useCallback(() => {
    if (!isPositionSet) {
      console.warn('Position not set yet');
      return position;
    }

    setPosition(prev => {
      const headingRad = (heading * Math.PI) / 180;

      const dxMeters = stepLengthMetersRef.current * Math.sin(headingRad);
      const dyMeters = stepLengthMetersRef.current * Math.cos(headingRad);

      const dxPixels = dxMeters * pixelsPerMeterRef.current;
      const dyPixels = dyMeters * pixelsPerMeterRef.current;

      const newX = prev.x + dxPixels;
      const newY = prev.y - dyPixels;

      addToPathHistory(newX, newY);

      return { x: newX, y: newY };
    });

    setTotalSteps(prev => prev + 1);
    stepsSinceCalibrationRef.current++;
    updateConfidence(stepsSinceCalibrationRef.current);

    return {
      x: position.x,
      y: position.y,
      heading,
      confidence: confidenceLevel
    };
  }, [isPositionSet, position, heading, confidenceLevel, addToPathHistory, updateConfidence]);

  // Recalibrate position
  const recalibrate = useCallback((newX, newY) => {
    setPosition({ x: newX, y: newY });
    stepsSinceCalibrationRef.current = 0;
    updateConfidence(0);
    addToPathHistory(newX, newY);
  }, [updateConfidence, addToPathHistory]);

  // Reset tracking
  const resetTracking = useCallback(() => {
    setTotalSteps(0);
    stepsSinceCalibrationRef.current = 0;
    setDriftEstimate(0);
    setConfidenceLevel('high');
    setPathHistory([]);
  }, []);

  const clearPosition = useCallback(() => {
    setIsPositionSet(false);
    setPosition({ x: 0, y: 0 });
    setPathHistory([]);
  }, []);

  // Set step length
  const setStepLength = useCallback((lengthInMeters) => {
    stepLengthMetersRef.current = lengthInMeters;
  }, []);

  // Set pixels per meter
  const setPixelsPerMeter = useCallback((pixels) => {
    pixelsPerMeterRef.current = pixels;
  }, []);

  // Calibrate step length
  const calibrateStepLength = useCallback((knownDistanceMeters, stepsTaken) => {
    if (stepsTaken > 0) {
      stepLengthMetersRef.current = knownDistanceMeters / stepsTaken;
    }
  }, []);

  // Set user height
  const setUserHeight = useCallback((heightInCm) => {
    stepLengthMetersRef.current = (heightInCm * 0.43) / 100;
  }, []);

  // Check if should recalibrate
  const shouldRecalibrate = useCallback(() => {
    return stepsSinceCalibrationRef.current >= recalibrationThresholdRef.current;
  }, []);

  // Get steps since calibration
  const getStepsSinceCalibration = useCallback(() => {
    return stepsSinceCalibrationRef.current;
  }, []);

  return {
    position,
    heading,
    totalSteps,
    confidenceLevel,
    driftEstimate,
    pathHistory,
    isPositionSet,
    setInitialPosition,
    updateHeading,
    onStep,
    recalibrate,
    resetTracking,
    setStepLength,
    setPixelsPerMeter,
    calibrateStepLength,
    setUserHeight,
    shouldRecalibrate,
    getStepsSinceCalibration,
    clearPosition
  };
};
