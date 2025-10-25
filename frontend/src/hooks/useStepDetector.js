import { useState, useRef, useCallback } from 'react';

export const useStepDetector = () => {
  const [stepCount, setStepCount] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationSteps, setCalibrationSteps] = useState(0);
  const [threshold, setThreshold] = useState(1.5);
  const [isStationary, setIsStationary] = useState(false);

  // Refs for values that don't need to trigger re-renders
  const minStepIntervalRef = useRef(250);
  const lastStepTimeRef = useRef(0);
  const lastMagnitudeRef = useRef(0);
  const peakDetectedRef = useRef(false);
  const stepCallbackRef = useRef(null);
  const adaptiveThresholdRef = useRef(true);
  const calibrationMagnitudesRef = useRef([]);
  const magnitudeHistoryRef = useRef([]);
  const maxHistorySizeRef = useRef(100);
  const zeroVelocityThresholdRef = useRef(0.3);
  const zeroVelocityCountRef = useRef(0);
  const recentAccelerationsRef = useRef([]);
  const varianceWindowSizeRef = useRef(10);

  // Check if there's enough variance in motion
  const hasEnoughVariance = useCallback(() => {
    if (recentAccelerationsRef.current.length < varianceWindowSizeRef.current) {
      return true;
    }

    const mean = recentAccelerationsRef.current.reduce((a, b) => a + b, 0) /
                  recentAccelerationsRef.current.length;
    const variance = recentAccelerationsRef.current.reduce((sum, val) => {
      return sum + Math.pow(val - mean, 2);
    }, 0) / recentAccelerationsRef.current.length;

    const stdDev = Math.sqrt(variance);
    return stdDev > 0.2;
  }, []);

  // Update stationary status
  const updateStationaryStatus = useCallback((magnitude) => {
    if (magnitude < zeroVelocityThresholdRef.current) {
      zeroVelocityCountRef.current++;
      if (zeroVelocityCountRef.current > 5) {
        setIsStationary(true);
      }
    } else {
      zeroVelocityCountRef.current = 0;
      setIsStationary(false);
    }
  }, []);

  // Update adaptive threshold
  const updateAdaptiveThreshold = useCallback((magnitude) => {
    magnitudeHistoryRef.current.push(magnitude);

    if (magnitudeHistoryRef.current.length > maxHistorySizeRef.current) {
      magnitudeHistoryRef.current.shift();
    }

    if (magnitudeHistoryRef.current.length > 10) {
      const avgMagnitude = magnitudeHistoryRef.current.reduce((a, b) => a + b, 0) /
                           magnitudeHistoryRef.current.length;
      const newThreshold = Math.max(0.8, Math.min(avgMagnitude * 0.7, 3.0));
      setThreshold(newThreshold);
    }
  }, []);

  // Handle step detection
  const onStepDetected = useCallback(() => {
    setStepCount(prev => prev + 1);
    setCalibrationSteps(prev => isCalibrating ? prev + 1 : prev);

    if (stepCallbackRef.current) {
      stepCallbackRef.current({
        stepCount: stepCount + 1,
        timestamp: Date.now(),
        isCalibrating
      });
    }
  }, [stepCount, isCalibrating]);

  // Process acceleration data
  const processAcceleration = useCallback((acceleration) => {
    const magnitude = Math.sqrt(
      acceleration.x * acceleration.x +
      acceleration.y * acceleration.y +
      acceleration.z * acceleration.z
    );

    recentAccelerationsRef.current.push(magnitude);
    if (recentAccelerationsRef.current.length > varianceWindowSizeRef.current) {
      recentAccelerationsRef.current.shift();
    }

    updateStationaryStatus(magnitude);

    if (isStationary) {
      lastMagnitudeRef.current = magnitude;
      return;
    }

    const now = Date.now();
    const timeSinceLastStep = now - lastStepTimeRef.current;

    // Look for peak
    if (magnitude > threshold &&
        magnitude > lastMagnitudeRef.current &&
        !peakDetectedRef.current &&
        timeSinceLastStep > minStepIntervalRef.current) {
      if (hasEnoughVariance()) {
        peakDetectedRef.current = true;
      }
    }

    // Look for valley
    if (peakDetectedRef.current &&
        magnitude < lastMagnitudeRef.current &&
        timeSinceLastStep > minStepIntervalRef.current) {
      onStepDetected();
      lastStepTimeRef.current = now;
      peakDetectedRef.current = false;

      if (adaptiveThresholdRef.current) {
        updateAdaptiveThreshold(magnitude);
      }

      if (isCalibrating) {
        calibrationMagnitudesRef.current.push(magnitude);
      }
    }

    lastMagnitudeRef.current = magnitude;
  }, [threshold, isStationary, hasEnoughVariance, onStepDetected, updateStationaryStatus, updateAdaptiveThreshold, isCalibrating]);

  // Set step callback
  const onStep = useCallback((callback) => {
    stepCallbackRef.current = callback;
  }, []);

  // Reset step count
  const reset = useCallback(() => {
    setStepCount(0);
    lastStepTimeRef.current = 0;
    peakDetectedRef.current = false;
  }, []);

  // Start calibration
  const startCalibration = useCallback(() => {
    setIsCalibrating(true);
    setCalibrationSteps(0);
    calibrationMagnitudesRef.current = [];
  }, []);

  // Finish calibration
  const finishCalibration = useCallback(() => {
    setIsCalibrating(false);

    if (calibrationMagnitudesRef.current.length > 0) {
      const avgMagnitude = calibrationMagnitudesRef.current.reduce((a, b) => a + b, 0) /
                           calibrationMagnitudesRef.current.length;
      const newThreshold = Math.max(0.8, Math.min(avgMagnitude * 0.75, 3.0));
      setThreshold(newThreshold);

      return {
        steps: calibrationSteps,
        avgMagnitude,
        threshold: newThreshold
      };
    }

    return {
      steps: calibrationSteps,
      avgMagnitude: 0,
      threshold
    };
  }, [calibrationSteps, threshold]);

  return {
    stepCount,
    isCalibrating,
    calibrationSteps,
    threshold,
    isStationary,
    processAcceleration,
    onStep,
    reset,
    startCalibration,
    finishCalibration,
    setThreshold
  };
};
