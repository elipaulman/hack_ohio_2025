import React, { useEffect, useRef, useCallback } from 'react';

const FloorPlanCanvasWithPath = ({
  floorPlanPath,
  pathData,
  userPosition,
  heading,
  onCanvasClick
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Load floor plan image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
    img.onerror = () => console.error('Failed to load floor plan image');
    img.src = floorPlanPath;
  }, [floorPlanPath]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw floor plan
    ctx.drawImage(img, 0, 0);

    // Draw path if available
    if (pathData) {
      // Handle multi-floor paths (segments array) vs single-floor paths (waypoints array)
      if (pathData.segments && Array.isArray(pathData.segments)) {
        // Multi-floor path - draw only the first segment for now
        const firstSegment = pathData.segments[0];
        if (firstSegment && firstSegment.waypoints && firstSegment.waypoints.length > 0) {
          drawPath(ctx, firstSegment.waypoints);
        }
      } else if (pathData.waypoints && pathData.waypoints.length > 0) {
        // Single-floor path
        drawPath(ctx, pathData.waypoints);
      }
    }

    // Draw user position
    console.log('[FloorPlanCanvas] userPosition:', userPosition);
    if (userPosition) {
      console.log('[FloorPlanCanvas] Drawing user at:', userPosition, 'heading:', heading);
      drawUserPosition(ctx, userPosition, heading);
    } else {
      console.log('[FloorPlanCanvas] No user position to draw');
    }
  }, [pathData, userPosition, heading]);

  // Redraw when path data or user position changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const drawPath = (ctx, waypoints) => {
    if (!waypoints || waypoints.length < 2) return;

    const canvasHeight = ctx.canvas.height;

    // Filter out invalid waypoints and waypoints without pixel_coords
    const validWaypoints = waypoints.filter(wp => wp && wp.pixel_coords && wp.pixel_coords.x !== undefined && wp.pixel_coords.y !== undefined);
    
    if (validWaypoints.length < 2) return;

    // Draw path line
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    validWaypoints.forEach((wp, idx) => {
      const x = wp.pixel_coords.x;
      const y = canvasHeight - wp.pixel_coords.y; // Flip Y coordinate

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw waypoint markers
    validWaypoints.forEach((wp, idx) => {
      const x = wp.pixel_coords.x;
      const y = canvasHeight - wp.pixel_coords.y; // Flip Y coordinate

      if (idx === 0) {
        // Start point - green circle
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'darkgreen';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (idx === validWaypoints.length - 1) {
        // End point - blue square
        ctx.fillStyle = 'rgba(0, 0, 255, 0.9)';
        ctx.fillRect(x - 8, y - 8, 16, 16);
        ctx.strokeStyle = 'darkblue';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 8, y - 8, 16, 16);
      } else {
        // Intermediate waypoint - small circle
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw room labels on path
    validWaypoints.forEach((wp) => {
      if (wp.label && wp.pixel_coords) {
        const x = wp.pixel_coords.x;
        const y = canvasHeight - wp.pixel_coords.y - 15; // Flip Y coordinate and offset for label

        // Draw label background
        const labelText = wp.label;
        const textWidth = ctx.measureText(labelText).width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - textWidth / 2 - 4, y - 12, textWidth + 8, 16);

        // Draw label text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, x, y - 4);
      }
    });
  };

  const drawUserPosition = (ctx, position, heading) => {
    const canvasHeight = ctx.canvas.height;
    const x = position.x;
    const y = canvasHeight - position.y; // Flip Y coordinate to match path rendering

    // Draw a large triangle pointing in the heading direction
    const triangleSize = 85; // Size of the triangle
    const radians = (heading * Math.PI) / 180;

    // Calculate the three points of the triangle
    // Tip of the triangle (pointing in heading direction)
    const tipX = x + triangleSize * Math.sin(radians);
    const tipY = y - triangleSize * Math.cos(radians); // Negative because Y is flipped

    // Base of the triangle (perpendicular to heading)
    const baseWidth = triangleSize * 0.6;
    const baseAngle1 = radians + Math.PI / 2;
    const baseAngle2 = radians - Math.PI / 2;

    const base1X = x + (baseWidth / 2) * Math.sin(baseAngle1);
    const base1Y = y - (baseWidth / 2) * Math.cos(baseAngle1);
    const base2X = x + (baseWidth / 2) * Math.sin(baseAngle2);
    const base2Y = y - (baseWidth / 2) * Math.cos(baseAngle2);

    // Draw filled triangle
    ctx.fillStyle = 'rgba(33, 150, 243, 0.9)'; // Blue color
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(base1X, base1Y);
    ctx.lineTo(base2X, base2Y);
    ctx.closePath();
    ctx.fill();

    // Draw white outline for better visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(base1X, base1Y);
    ctx.lineTo(base2X, base2Y);
    ctx.closePath();
    ctx.stroke();

    // Add a darker inner stroke for definition
    ctx.strokeStyle = 'rgba(25, 118, 210, 1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !onCanvasClick) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onCanvasClick(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        width: '100%',
        height: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'crosshair',
        backgroundColor: '#f0f0f0'
      }}
    />
  );
};

export default FloorPlanCanvasWithPath;


