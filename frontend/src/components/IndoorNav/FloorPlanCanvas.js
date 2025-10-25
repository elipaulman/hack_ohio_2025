import React, { useRef, useEffect, useCallback, useState } from 'react';

const FloorPlanCanvas = ({ floorPlanPath, userPosition, heading, pathHistory, onCanvasClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(new Image());
  const [imageLoaded, setImageLoaded] = useState(false);

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
    touchStartDistance: 0,
    touchStartScale: 1.0,
    dpr: window.devicePixelRatio || 1
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

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();
        ctx.translate(state.offsetX, state.offsetY);
        ctx.scale(state.scale, state.scale);
        ctx.drawImage(image, 0, 0);
        ctx.restore();
      }
    });
  }, [imageLoaded]);


  // Draw path history
  const drawPathHistory = useCallback((ctx, path) => {
    if (!path || path.length < 2) return;

    const state = stateRef.current;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.85)';
    ctx.lineWidth = 2.5 / state.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    path.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    ctx.stroke();
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
    const state = stateRef.current;
    const screenX = canvasX * state.scale + state.offsetX;
    const screenY = canvasY * state.scale + state.offsetY;

    return { x: screenX, y: screenY };
  }, []);

  // Touch handlers
  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e) => {
    if (e.target !== canvasRef.current) return;

    const state = stateRef.current;
    if (e.touches.length === 1) {
      state.isPanning = true;
      state.lastTouchX = e.touches[0].clientX;
      state.lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      e.preventDefault();
      state.touchStartDistance = getTouchDistance(e.touches);
      state.touchStartScale = state.scale;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    const state = stateRef.current;

    if (e.touches.length === 1 && state.isPanning) {
      e.preventDefault();
      const dx = e.touches[0].clientX - state.lastTouchX;
      const dy = e.touches[0].clientY - state.lastTouchY;

      state.offsetX += dx;
      state.offsetY += dy;

      state.lastTouchX = e.touches[0].clientX;
      state.lastTouchY = e.touches[0].clientY;

      render();
    } else if (e.touches.length === 2 && state.touchStartDistance > 0) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const scaleChange = distance / state.touchStartDistance;
      state.scale = Math.max(state.minScale, Math.min(state.maxScale, state.touchStartScale * scaleChange));

      render();
    }
  }, [render]);

  const handleTouchEnd = useCallback((e) => {
    const state = stateRef.current;

    if (e.touches.length === 0) {
      state.isPanning = false;
      state.touchStartDistance = 0;
    } else if (e.touches.length === 1) {
      state.touchStartDistance = 0;
    }
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target !== canvasRef.current) return;

    const state = stateRef.current;
    state.isPanning = true;
    state.lastTouchX = e.clientX;
    state.lastTouchY = e.clientY;
  }, []);

  const handleMouseMove = useCallback((e) => {
    const state = stateRef.current;

    if (state.isPanning) {
      const dx = e.clientX - state.lastTouchX;
      const dy = e.clientY - state.lastTouchY;

      state.offsetX += dx;
      state.offsetY += dy;

      state.lastTouchX = e.clientX;
      state.lastTouchY = e.clientY;

      render();
    }
  }, [render]);

  const handleMouseUp = useCallback(() => {
    stateRef.current.isPanning = false;
  }, []);

  const handleClick = useCallback((e) => {
    if (e.target !== canvasRef.current) return;
    if (stateRef.current.isPanning) return;

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
      state.scale = Math.min(scaleX, scaleY) * 0.95;
      state.offsetX = (canvasWidth - imageWidth * state.scale) / 2;
      state.offsetY = (canvasHeight - imageHeight * state.scale) / 2;

      setImageLoaded(true);

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
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [resizeCanvas, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp, handleClick]);

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
              borderTop: '28px solid #2196F3',
              filter: 'drop-shadow(0 0 -12px rgba(33, 150, 243, 0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
              top: '50%',
              left: '50%'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FloorPlanCanvas;
