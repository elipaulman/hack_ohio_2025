import { useState, useEffect, useRef, useCallback } from 'react';

export const useSensorManager = () => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [rotationRate, setRotationRate] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [compassHeading, setCompassHeading] = useState(0);
  const [gyroHeading, setGyroHeading] = useState(0);
  const [fusedHeading, setFusedHeading] = useState(0);

  // Refs for data that doesn't need to trigger re-renders
  const accelFilterRef = useRef({ x: [], y: [], z: [] });
  const compassFilterRef = useRef([]);
  const filterSizeRef = useRef(5);
  const lastTimestampRef = useRef(null);
  const gyroWeightRef = useRef(0.98);
  const screenOrientationAngleRef = useRef(0);
  const onMotionCallbackRef = useRef(null);
  const onOrientationCallbackRef = useRef(null);

  // Update screen orientation
  const updateScreenOrientation = useCallback(() => {
    if (window.screen.orientation) {
      screenOrientationAngleRef.current = window.screen.orientation.angle || 0;
    } else if (window.orientation !== undefined) {
      screenOrientationAngleRef.current = window.orientation || 0;
    } else {
      screenOrientationAngleRef.current = 0;
    }
    console.log('Screen orientation angle:', screenOrientationAngleRef.current);
  }, []);

  // Apply low-pass filter
  const applyLowPassFilter = useCallback((rawData, filterArrays) => {
    const filtered = {};

    for (const axis in rawData) {
      if (!filterArrays[axis]) {
        filterArrays[axis] = [];
      }

      filterArrays[axis].push(rawData[axis]);

      if (filterArrays[axis].length > filterSizeRef.current) {
        filterArrays[axis].shift();
      }

      const sum = filterArrays[axis].reduce((a, b) => a + b, 0);
      filtered[axis] = sum / filterArrays[axis].length;
    }

    return filtered;
  }, []);

  // Apply circular filter for angles
  const applyCircularFilter = useCallback((newAngle, filterArray) => {
    filterArray.push(newAngle);

    if (filterArray.length > filterSizeRef.current) {
      filterArray.shift();
    }

    let sinSum = 0, cosSum = 0;
    filterArray.forEach(angle => {
      const rad = angle * Math.PI / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
    });

    const avgAngle = Math.atan2(sinSum, cosSum) * 180 / Math.PI;
    return (avgAngle + 360) % 360;
  }, []);

  // Fuse headings using complementary filter
  const fuseHeadings = useCallback((compass, gyro) => {
    const compassRad = compass * Math.PI / 180;
    const gyroRad = gyro * Math.PI / 180;

    const compassX = Math.cos(compassRad);
    const compassY = Math.sin(compassRad);
    const gyroX = Math.cos(gyroRad);
    const gyroY = Math.sin(gyroRad);

    const fusedX = gyroWeightRef.current * gyroX + (1 - gyroWeightRef.current) * compassX;
    const fusedY = gyroWeightRef.current * gyroY + (1 - gyroWeightRef.current) * compassY;

    const heading = Math.atan2(fusedY, fusedX) * 180 / Math.PI;
    return (heading + 360) % 360;
  }, []);

  // Integrate gyro heading
  const integrateGyroHeading = useCallback((currentGyroHeading, rotRate) => {
    const now = Date.now();
    if (lastTimestampRef.current) {
      const dt = (now - lastTimestampRef.current) / 1000;
      const dHeading = rotRate.alpha * dt;
      const newHeading = (currentGyroHeading + dHeading + 360) % 360;
      lastTimestampRef.current = now;
      return newHeading;
    }
    lastTimestampRef.current = now;
    return currentGyroHeading;
  }, []);

  // Handle device motion
  const handleMotion = useCallback((event) => {
    let rawAccel = { x: 0, y: 0, z: 0 };

    if (event.acceleration) {
      rawAccel = {
        x: event.acceleration.x || 0,
        y: event.acceleration.y || 0,
        z: event.acceleration.z || 0
      };
      const filtered = applyLowPassFilter(rawAccel, accelFilterRef.current);
      setAcceleration(filtered);
    } else if (event.accelerationIncludingGravity) {
      rawAccel = {
        x: event.accelerationIncludingGravity.x || 0,
        y: event.accelerationIncludingGravity.y || 0,
        z: event.accelerationIncludingGravity.z || 0
      };
      setAcceleration(rawAccel);
    }

    if (event.rotationRate) {
      const rotRate = {
        alpha: event.rotationRate.alpha || 0,
        beta: event.rotationRate.beta || 0,
        gamma: event.rotationRate.gamma || 0
      };
      setRotationRate(rotRate);

      setGyroHeading(prev => integrateGyroHeading(prev, rotRate));
    }

    if (onMotionCallbackRef.current) {
      onMotionCallbackRef.current({
        acceleration: rawAccel,
        rotationRate: event.rotationRate,
        timestamp: Date.now()
      });
    }
  }, [applyLowPassFilter, integrateGyroHeading]);

  // Handle device orientation
  const handleOrientation = useCallback((event) => {
    let rawHeading = null;
    let isAbsoluteOrientation = false;

    if (event.absolute === true || event.type === 'deviceorientationabsolute') {
      isAbsoluteOrientation = true;
    }

    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      rawHeading = event.webkitCompassHeading;
      isAbsoluteOrientation = true;
    } else if (event.alpha !== null) {
      rawHeading = event.alpha;
    }

    if (rawHeading !== null) {
      let adjustedHeading = rawHeading;

      if (isAbsoluteOrientation) {
        const angle = screenOrientationAngleRef.current;
        if (angle === -90 || angle === 270) {
          adjustedHeading = (rawHeading + 90) % 360;
        } else if (angle === 90) {
          adjustedHeading = (rawHeading - 90 + 360) % 360;
        } else if (angle === 180) {
          adjustedHeading = (rawHeading + 180) % 360;
        }
      }

      const filteredCompass = applyCircularFilter(adjustedHeading, compassFilterRef.current);
      setCompassHeading(filteredCompass);

      // Initialize gyro heading to match compass on first reading
      setGyroHeading(prev => {
        if (prev === 0 && compassFilterRef.current.length === 1) {
          return filteredCompass;
        }
        return prev;
      });
    }
  }, [applyCircularFilter]);

  // Handle screen orientation change
  const handleScreenOrientationChange = useCallback(() => {
    updateScreenOrientation();
    console.log('Screen orientation changed to:', screenOrientationAngleRef.current);
  }, [updateScreenOrientation]);

  // Update fused heading when compass or gyro changes
  useEffect(() => {
    const fused = fuseHeadings(compassHeading, gyroHeading);
    setFusedHeading(fused);

    if (onOrientationCallbackRef.current) {
      onOrientationCallbackRef.current({
        heading: fused,
        compassHeading,
        gyroHeading,
        timestamp: Date.now()
      });
    }
  }, [compassHeading, gyroHeading, fuseHeadings]);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const motionPermission = await DeviceMotionEvent.requestPermission();
        const orientationPermission = await DeviceOrientationEvent.requestPermission();

        if (motionPermission === 'granted' && orientationPermission === 'granted') {
          setHasPermission(true);
          return { success: true, hasPermission: true };
        } else {
          return {
            success: false,
            hasPermission: false,
            error: 'Permission denied. Please grant access to motion sensors in your browser settings.'
          };
        }
      } catch (error) {
        return {
          success: false,
          hasPermission: false,
          error: `Permission request failed: ${error.message}`
        };
      }
    } else {
      setHasPermission(true);
      return { success: true, hasPermission: true };
    }
  }, []);

  // Start sensors
  const start = useCallback((permissionGranted = null) => {
    const canStart = permissionGranted !== null ? permissionGranted : hasPermission;

    if (!canStart) {
      console.error('Cannot start sensors without permission');
      return false;
    }

    if (isActive) {
      console.warn('Sensors already active');
      return true;
    }

    window.addEventListener('devicemotion', handleMotion);
    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('deviceorientationabsolute', handleOrientation);

    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleScreenOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleScreenOrientationChange);
    }

    setIsActive(true);
    lastTimestampRef.current = Date.now();
    return true;
  }, [hasPermission, isActive, handleMotion, handleOrientation, handleScreenOrientationChange]);

  // Stop sensors
  const stop = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    window.removeEventListener('deviceorientation', handleOrientation);
    window.removeEventListener('deviceorientationabsolute', handleOrientation);

    if (window.screen.orientation) {
      window.screen.orientation.removeEventListener('change', handleScreenOrientationChange);
    } else {
      window.removeEventListener('orientationchange', handleScreenOrientationChange);
    }

    setIsActive(false);
  }, [handleMotion, handleOrientation, handleScreenOrientationChange]);

  // Reset sensors
  const reset = useCallback(() => {
    accelFilterRef.current = { x: [], y: [], z: [] };
    compassFilterRef.current = [];
    setGyroHeading(compassHeading);
    setFusedHeading(compassHeading);
    lastTimestampRef.current = Date.now();
  }, [compassHeading]);

  // Set callbacks
  const onMotion = useCallback((callback) => {
    onMotionCallbackRef.current = callback;
  }, []);

  const onOrientation = useCallback((callback) => {
    onOrientationCallbackRef.current = callback;
  }, []);

  // Initialize screen orientation
  useEffect(() => {
    updateScreenOrientation();
  }, [updateScreenOrientation]);

  return {
    isActive,
    hasPermission,
    acceleration,
    rotationRate,
    compassHeading,
    gyroHeading,
    fusedHeading,
    requestPermission,
    start,
    stop,
    reset,
    onMotion,
    onOrientation
  };
};
