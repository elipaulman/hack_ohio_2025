import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';

const FloorPlanCanvas = forwardRef(({ floorPlanPath, userPosition, heading, pathHistory, onCanvasClick }, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(new Image());
  const [imageLoaded, setImageLoaded] = useState(false);
  const [transform, setTransform] = useState({ scale: 1.0, offsetX: 0, offsetY: 0 });

  // Pan and zoom state
  const stateRef = useRef({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    minScale: 0.5,
    maxScale: 3.0,
    isPanning: false,
    lastTouchX: 0,
    lastTouchY: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartDistance: 0,
    touchStartScale: 1.0,
    touchMidpoint: { x: 0, y: 0 },
    hasMoved: false,
    moveThreshold: 5,
    velocityX: 0,
    velocityY: 0,
    lastMoveTime: 0,
    animationFrame: null,
    dpr: window.devicePixelRatio || 1,
    fitScale: 1.0
  });

  // Resize canvas to fit container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const state = stateRef.current;

    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    canvas.width = rect.width * state.dpr;
    canvas.height = rect.height * state.dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(state.dpr, state.dpr);

    // Force re-render after resize
    requestAnimationFrame(() => {
      if (imageLoaded) {
        const ctx = canvas.getContext('2d');
        const image = imageRef.current;
        const canvasWidth = canvas.width / state.dpr;
        const canvasHeight = canvas.height / state.dpr;

        // Recalculate minScale based on new canvas size
        const scaleX = canvasWidth / image.width;
        const scaleY = canvasHeight / image.height;
        const fitScale = Math.min(scaleX, scaleY) * 0.95;
        state.minScale = fitScale * 0.8; // Allow zooming out slightly beyond fit
        state.fitScale = fitScale;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();
        ctx.translate(state.offsetX, state.offsetY);
        ctx.scale(state.scale, state.scale);
        ctx.drawImage(image, 0, 0);
        ctx.restore();

        setTransform({ scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY });
      }
    });
  }, [imageLoaded]);


  // Draw path history
  const drawPathHistory = useCallback((ctx, path) => {
    if (!path || path.length < 2) return;

    const state = stateRef.current;
    const now = Date.now();
    const maxAgeMs = 1000 * 60 * 3; // fade older than ~3 minutes
    const baseWidth = 4.5 / state.scale;

    for (let i = 1; i < path.length; i++) {
      const start = path[i - 1];
      const end = path[i];
      const segmentAge = now - (end.timestamp ?? start.timestamp ?? now);
      const ageRatio = Math.min(Math.max(segmentAge / maxAgeMs, 0), 1);
      const opacity = 0.15 + (1 - ageRatio) * 0.7;
      const width = baseWidth * (0.75 + (1 - ageRatio) * 0.5);

      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = `rgba(33, 150, 243, ${opacity})`;
      ctx.lineWidth = width;
      ctx.shadowColor = 'rgba(33, 150, 243, 0.35)';
      ctx.shadowBlur = 8 / state.scale;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }, []);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    const state = stateRef.current;
    const canvasWidth = canvas.width / state.dpr;
    const canvasHeight = canvas.height / state.dpr;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();

    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);

    ctx.drawImage(image, 0, 0);

    if (pathHistory && pathHistory.length > 1) {
      drawPathHistory(ctx, pathHistory);
    }

    ctx.restore();
  }, [imageLoaded, pathHistory, drawPathHistory]);

  // Reset view to re-center and re-fit the floor plan
  const resetView = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !imageLoaded || !image.width || !image.height) {
      return;
    }

    const state = stateRef.current;
    const canvasWidth = canvas.width / state.dpr;
    const canvasHeight = canvas.height / state.dpr;
    const scaleX = canvasWidth / image.width;
    const scaleY = canvasHeight / image.height;
    const fitScale = Math.min(scaleX, scaleY) * 0.95;

    state.scale = fitScale;
    state.fitScale = fitScale;
    state.minScale = fitScale * 0.8;
    state.offsetX = (canvasWidth - image.width * state.scale) / 2;
    state.offsetY = (canvasHeight - image.height * state.scale) / 2;
    state.velocityX = 0;
    state.velocityY = 0;

    setTransform({ scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY });
    render();
  }, [imageLoaded, render]);

  useImperativeHandle(
    ref,
    () => ({
      resetView
    }),
    [resetView]
  );

  // Momentum animation
  const animateMomentum = useCallback(() => {
    const state = stateRef.current;
    const friction = 0.92;
    const threshold = 0.1;

    if (Math.abs(state.velocityX) > threshold || Math.abs(state.velocityY) > threshold) {
      state.offsetX += state.velocityX;
      state.offsetY += state.velocityY;
      state.velocityX *= friction;
      state.velocityY *= friction;

      setTransform({ scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY });
      render();
      state.animationFrame = requestAnimationFrame(animateMomentum);
    } else {
      state.velocityX = 0;
      state.velocityY = 0;
      state.animationFrame = null;
    }
  }, [render]);

  // Convert screen to canvas coordinates
  const screenToCanvas = useCallback((screenX, screenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const state = stateRef.current;
    const x = screenX - rect.left;
    const y = screenY - rect.top;

    const canvasX = (x - state.offsetX) / state.scale;
    const canvasY = (y - state.offsetY) / state.scale;

    return { x: canvasX, y: canvasY };
  }, []);

  // Convert canvas to screen coordinates
  const canvasToScreen = useCallback((canvasX, canvasY) => {
    const screenX = canvasX * transform.scale + transform.offsetX;
    const screenY = canvasY * transform.scale + transform.offsetY;

    return { x: screenX, y: screenY };
  }, [transform]);

  // Touch handlers
  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchMidpoint = (touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = useCallback((e) => {
    if (e.target !== canvasRef.current) return;

    const state = stateRef.current;

    // Cancel any ongoing momentum animation
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }

    if (e.touches.length === 1) {
      state.isPanning = true;
      state.lastTouchX = e.touches[0].clientX;
      state.lastTouchY = e.touches[0].clientY;
      state.touchStartX = e.touches[0].clientX;
      state.touchStartY = e.touches[0].clientY;
      state.hasMoved = false;
      state.velocityX = 0;
      state.velocityY = 0;
      state.lastMoveTime = Date.now();
    } else if (e.touches.length === 2) {
      e.preventDefault();
      state.isPanning = false;
      state.touchStartDistance = getTouchDistance(e.touches);
      state.touchStartScale = state.scale;
      state.touchMidpoint = getTouchMidpoint(e.touches);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    const state = stateRef.current;

    if (e.touches.length === 1 && state.isPanning) {
      e.preventDefault();
      const currentTime = Date.now();
      const dx = e.touches[0].clientX - state.lastTouchX;
      const dy = e.touches[0].clientY - state.lastTouchY;

      // Check if moved beyond threshold
      const totalDx = e.touches[0].clientX - state.touchStartX;
      const totalDy = e.touches[0].clientY - state.touchStartY;
      const distance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
      if (distance > state.moveThreshold) {
        state.hasMoved = true;
      }

      state.offsetX += dx;
      state.offsetY += dy;

      // Calculate velocity for momentum
      const timeDelta = currentTime - state.lastMoveTime;
      if (timeDelta > 0) {
        state.velocityX = dx / timeDelta * 16; // Normalize to ~60fps
        state.velocityY = dy / timeDelta * 16;
      }

      state.lastTouchX = e.touches[0].clientX;
      state.lastTouchY = e.touches[0].clientY;
      state.lastMoveTime = currentTime;

      setTransform({ scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY });
      render();
    } else if (e.touches.length === 2 && state.touchStartDistance > 0) {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Convert the midpoint to canvas coordinates before zoom
      const canvasX = (state.touchMidpoint.x - rect.left - state.offsetX) / state.scale;
      const canvasY = (state.touchMidpoint.y - rect.top - state.offsetY) / state.scale;

      // Calculate new scale
      const distance = getTouchDistance(e.touches);
      const scaleChange = distance / state.touchStartDistance;
      const newScale = Math.max(state.minScale, Math.min(state.maxScale, state.touchStartScale * scaleChange));

      // Adjust offset to zoom toward the midpoint
      state.offsetX = state.touchMidpoint.x - rect.left - canvasX * newScale;
      state.offsetY = state.touchMidpoint.y - rect.top - canvasY * newScale;
      state.scale = newScale;

      setTransform({ scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY });
      render();
    }
  }, [render]);

  const handleTouchEnd = useCallback((e) => {
    const state = stateRef.current;

    if (e.touches.length === 0) {
      // Start momentum animation if there's velocity
      if (state.isPanning && (Math.abs(state.velocityX) > 1 || Math.abs(state.velocityY) > 1)) {
        animateMomentum();
      }

      state.isPanning = false;
      state.touchStartDistance = 0;
    } else if (e.touches.length === 1) {
      state.touchStartDistance = 0;
      // Reset panning for remaining touch
      state.lastTouchX = e.touches[0].clientX;
      state.lastTouchY = e.touches[0].clientY;
      state.touchStartX = e.touches[0].clientX;
      state.touchStartY = e.touches[0].clientY;
      state.hasMoved = false;
      state.isPanning = true;
    }
  }, [animateMomentum]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target !== canvasRef.current) return;

    const state = stateRef.current;
    state.isPanning = true;
    state.lastTouchX = e.clientX;
    state.lastTouchY = e.clientY;
    state.touchStartX = e.clientX;
    state.touchStartY = e.clientY;
    state.hasMoved = false;
  }, []);

  const handleMouseMove = useCallback((e) => {
    const state = stateRef.current;

    if (state.isPanning) {
      const dx = e.clientX - state.lastTouchX;
      const dy = e.clientY - state.lastTouchY;

      // Check if moved beyond threshold
      const totalDx = e.clientX - state.touchStartX;
      const totalDy = e.clientY - state.touchStartY;
      const distance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
      if (distance > state.moveThreshold) {
        state.hasMoved = true;
      }

      state.offsetX += dx;
      state.offsetY += dy;

      state.lastTouchX = e.clientX;
      state.lastTouchY = e.clientY;

      setTransform({ scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY });
      render();
    }
  }, [render]);

  const handleMouseUp = useCallback(() => {
    stateRef.current.isPanning = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const state = stateRef.current;

    // Get mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to canvas coordinates before zoom
    const canvasX = (mouseX - state.offsetX) / state.scale;
    const canvasY = (mouseY - state.offsetY) / state.scale;

    // Calculate new scale
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(state.minScale, Math.min(state.maxScale, state.scale * zoomFactor));

    // Adjust offset to zoom toward mouse position
    state.offsetX = mouseX - canvasX * newScale;
    state.offsetY = mouseY - canvasY * newScale;
    state.scale = newScale;

    setTransform({ scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY });
    render();
  }, [render]);

  const handleClick = useCallback((e) => {
    if (e.target !== canvasRef.current) return;
    const state = stateRef.current;

    // Don't trigger click if user has panned
    if (state.hasMoved) {
      state.hasMoved = false;
      return;
    }

    const coords = screenToCanvas(e.clientX, e.clientY);
    if (onCanvasClick) {
      onCanvasClick(coords.x, coords.y);
    }
  }, [screenToCanvas, onCanvasClick]);

  // Load floor plan image
  useEffect(() => {
    const image = imageRef.current;
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const state = stateRef.current;
      const canvasWidth = canvas.width / state.dpr;
      const canvasHeight = canvas.height / state.dpr;
      const imageWidth = image.width;
      const imageHeight = image.height;

      // Fit floor plan
      const scaleX = canvasWidth / imageWidth;
      const scaleY = canvasHeight / imageHeight;
      const fitScale = Math.min(scaleX, scaleY) * 0.95;

      state.scale = fitScale;
      state.minScale = fitScale * 0.8; // Allow zooming out slightly beyond fit
      state.fitScale = fitScale;
      state.offsetX = (canvasWidth - imageWidth * state.scale) / 2;
      state.offsetY = (canvasHeight - imageHeight * state.scale) / 2;

      setImageLoaded(true);
      setTransform({ scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY });

      // Initial render
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.save();
      ctx.translate(state.offsetX, state.offsetY);
      ctx.scale(state.scale, state.scale);
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    };
    image.onerror = () => {
      console.error('Failed to load floor plan image');
    };
    image.src = floorPlanPath;
  }, [floorPlanPath]);

  // Setup canvas and event listeners
  useEffect(() => {
    resizeCanvas();

    const canvas = canvasRef.current;
    if (!canvas) return;

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('click', handleClick);
    };
  }, [resizeCanvas, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleClick]);

  // Render when pathHistory or userPosition changes
  useEffect(() => {
    render();
  }, [pathHistory, userPosition, render]);

  // Calculate user dot position
  const userDotStyle = userPosition ? (() => {
    const screenCoords = canvasToScreen(userPosition.x, userPosition.y);
    return {
      left: `${screenCoords.x}px`,
      top: `${screenCoords.y}px`,
      transform: `translate(-50%, -50%)`
    };
  })() : { display: 'none' };

  const arrowStyle = heading !== undefined ? {
    transform: `translate(-50%, -50%) rotate(${heading}deg)`
  } : {};

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none' }} />
      {userPosition && (
        <div
          style={{
            ...userDotStyle,
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          <div
            style={{
              ...arrowStyle,
              position: 'absolute',
              width: 0,
              height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderBottom: '28px solid #2196F3',
              filter: 'drop-shadow(0 4px 12px rgba(33, 150, 243, 0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
              top: '50%',
              left: '50%'
            }}
          />
        </div>
      )}
    </div>
  );
});

FloorPlanCanvas.displayName = 'FloorPlanCanvas';

export default FloorPlanCanvas;
