import React, { useEffect, useRef } from 'react';

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

  // Redraw when path data or user position changes
  useEffect(() => {
    drawCanvas();
  }, [pathData, userPosition, heading]);

  const drawCanvas = () => {
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
    if (pathData && pathData.waypoints && pathData.waypoints.length > 0) {
      drawPath(ctx, pathData.waypoints);
    }

    // Draw user position
    if (userPosition) {
      drawUserPosition(ctx, userPosition, heading);
    }
  };

  const drawPath = (ctx, waypoints) => {
    if (waypoints.length < 2) return;

    const canvasHeight = ctx.canvas.height;

    // Draw path line
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    waypoints.forEach((wp, idx) => {
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
    waypoints.forEach((wp, idx) => {
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
      } else if (idx === waypoints.length - 1) {
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
    waypoints.forEach((wp) => {
      if (wp.label) {
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
    const x = position.x;
    const y = position.y;

    // Draw user circle
    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw direction indicator
    const arrowLength = 15;
    const radians = (heading * Math.PI) / 180;
    const endX = x + arrowLength * Math.cos(radians);
    const endY = y + arrowLength * Math.sin(radians);

    ctx.strokeStyle = 'rgba(100, 200, 255, 1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrowhead
    const headlen = 5;
    const angle1 = radians - (Math.PI / 6);
    const angle2 = radians + (Math.PI / 6);

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headlen * Math.cos(angle1), endY - headlen * Math.sin(angle1));
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headlen * Math.cos(angle2), endY - headlen * Math.sin(angle2));
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


