import React, { useRef, useEffect } from 'react';
import rough from 'roughjs';

const SquarePattern = ({ width = 400, height = 400 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rs = rough.svg(svg);

    // Clear any existing content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Calculate center and square size
    const centerX = width / 2;
    const centerY = height / 2;
    const squareSize = Math.min(width, height) * 0.15;

    // Define square positions relative to center
    const positions = [
      { x: 0, y: 0 },
      { x: 0, y: -squareSize/2 },
      { x: 0, y: squareSize/2 },
      { x: -squareSize/2, y: 0 },
      { x: squareSize/2, y: 0 },
      { x: -squareSize/2, y: -squareSize/2 },
      { x: squareSize/2, y: -squareSize/2 },
      { x: -squareSize/2, y: squareSize/2 },
      { x: squareSize/2, y: squareSize/2 },
    ];

    // Draw each square
    positions.forEach(pos => {
      const square = rs.rectangle(
        centerX + pos.x - squareSize/2,
        centerY + pos.y - squareSize/2,
        squareSize,
        squareSize,
        {
          stroke: 'black',
          strokeWidth: 1.5,
          roughness: 0,
          bowing: 0,
          disableMultiStroke: true,
          fill: 'none',
          seed: 1  // Fixed seed for consistent rendering
        }
      );
      svg.appendChild(square);
    });

  }, [width, height]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ 
        background: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1
      }}
      shapeRendering="geometricPrecision"
      vectorEffect="non-scaling-stroke"
    />
  );
};

export default SquarePattern; 