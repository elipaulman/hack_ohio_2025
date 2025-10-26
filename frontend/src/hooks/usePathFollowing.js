import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for following a calculated path step-by-step
 * - Initializes user position to path start when path loads
 * - Advances position along path as steps are taken
 * - Provides progress tracking
 */
export const usePathFollowing = (pathData) => {
  const [pathProgress, setPathProgress] = useState(0); // Distance in pixels along path
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const pathSegmentsRef = useRef([]);
  const totalPathLengthRef = useRef(0);
  const PIXELS_PER_STEP = useRef(8.5); // ~0.425m * 20px/m from position tracker

  // Calculate path segments when path data loads
  useEffect(() => {
    if (!pathData?.waypoints || pathData.waypoints.length < 2) {
      pathSegmentsRef.current = [];
      totalPathLengthRef.current = 0;
      setCurrentPosition(null);
      setIsNavigating(false);
      setPathProgress(0);
      return;
    }

    const waypoints = pathData.waypoints;
    const segments = [];
    let cumulativeDistance = 0;

    // Build segments from waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i].pixel_coords;
      const end = waypoints[i + 1].pixel_coords;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      segments.push({
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        length,
        startDistance: cumulativeDistance,
        endDistance: cumulativeDistance + length
      });

      cumulativeDistance += length;
    }

    pathSegmentsRef.current = segments;
    totalPathLengthRef.current = cumulativeDistance;

    // Initialize at start of path (static position until navigation starts)
    const startPosition = {
      x: waypoints[0].pixel_coords.x,
      y: waypoints[0].pixel_coords.y
    };

    console.log('[PathFollowing] Setting initial position to:', startPosition);
    setCurrentPosition(startPosition);
    setPathProgress(0);

    console.log('[PathFollowing] Path initialized:', {
      segments: segments.length,
      totalLength: cumulativeDistance.toFixed(1) + 'px',
      waypoints: waypoints.length,
      startPosition
    });
  }, [pathData]);

  // Calculate position from progress distance along path
  const calculatePosition = useCallback((progressDistance) => {
    if (pathSegmentsRef.current.length === 0) return null;

    // Clamp to path bounds
    const clampedDistance = Math.max(0, Math.min(progressDistance, totalPathLengthRef.current));

    // Find which segment we're on
    const segment = pathSegmentsRef.current.find(seg =>
      clampedDistance >= seg.startDistance && clampedDistance <= seg.endDistance
    );

    if (!segment) {
      // Fallback to last point if somehow out of bounds
      const lastSeg = pathSegmentsRef.current[pathSegmentsRef.current.length - 1];
      return { x: lastSeg.endX, y: lastSeg.endY };
    }

    // Interpolate position within segment
    const distanceIntoSegment = clampedDistance - segment.startDistance;
    const t = segment.length > 0 ? distanceIntoSegment / segment.length : 0;

    const x = segment.startX + t * (segment.endX - segment.startX);
    const y = segment.startY + t * (segment.endY - segment.startY);

    return { x, y };
  }, []);

  // Start navigation (enables movement)
  const startNavigation = useCallback(() => {
    if (pathSegmentsRef.current.length === 0) {
      console.warn('[PathFollowing] Cannot start navigation - no path available');
      return false;
    }

    console.log('[PathFollowing] Navigation started');
    setIsNavigating(true);
    setPathProgress(0);

    // Ensure position is at start
    const startPos = calculatePosition(0);
    setCurrentPosition(startPos);

    return true;
  }, [calculatePosition]);

  // Stop navigation (keeps position, just stops advancing)
  const stopNavigation = useCallback(() => {
    console.log('[PathFollowing] Navigation stopped');
    setIsNavigating(false);
  }, []);

  // Handle each step taken (only advances if navigating)
  const onStep = useCallback(() => {
    if (!isNavigating) {
      return;
    }

    setPathProgress(prev => {
      const newProgress = Math.min(prev + PIXELS_PER_STEP.current, totalPathLengthRef.current);
      const position = calculatePosition(newProgress);
      setCurrentPosition(position);

      const percentComplete = (newProgress / totalPathLengthRef.current * 100).toFixed(1);

      console.log(`[PathFollowing] Step! Progress: ${percentComplete}% (${newProgress.toFixed(0)}/${totalPathLengthRef.current.toFixed(0)}px)`);

      // Check if reached destination
      if (newProgress >= totalPathLengthRef.current) {
        console.log('[PathFollowing] Destination reached!');
      }

      return newProgress;
    });
  }, [isNavigating, calculatePosition]);

  // Reset to start of path
  const resetToStart = useCallback(() => {
    console.log('[PathFollowing] Reset to start');
    setPathProgress(0);
    const startPos = calculatePosition(0);
    setCurrentPosition(startPos);
  }, [calculatePosition]);

  // Get progress percentage
  const getProgressPercent = useCallback(() => {
    if (totalPathLengthRef.current === 0) return 0;
    return Math.min(100, (pathProgress / totalPathLengthRef.current) * 100);
  }, [pathProgress]);

  // Get remaining distance
  const getRemainingDistance = useCallback(() => {
    return Math.max(0, totalPathLengthRef.current - pathProgress);
  }, [pathProgress]);

  // Check if destination reached
  const isDestinationReached = useCallback(() => {
    return pathProgress >= totalPathLengthRef.current && totalPathLengthRef.current > 0;
  }, [pathProgress]);

  return {
    currentPosition,
    isNavigating,
    pathProgress,
    totalPathLength: totalPathLengthRef.current,
    startNavigation,
    stopNavigation,
    onStep,
    resetToStart,
    getProgressPercent,
    getRemainingDistance,
    isDestinationReached
  };
};
