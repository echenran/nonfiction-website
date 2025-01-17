import React, { useRef, useEffect } from 'react';
import rough from 'roughjs';

const SquarePattern = ({ width = 400, height = 400 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rc = rough.svg(svg);

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
      { x: 0, y: 0 },                    // Center
      { x: 0, y: -squareSize * 1.5 },    // Top
      { x: 0, y: squareSize * 1.5 },     // Bottom
      { x: -squareSize * 1.5, y: 0 },    // Left
      { x: squareSize * 1.5, y: 0 },     // Right
      { x: -squareSize, y: -squareSize }, // Top Left
      { x: squareSize, y: -squareSize },  // Top Right
      { x: -squareSize, y: squareSize },  // Bottom Left
      { x: squareSize, y: squareSize },   // Bottom Right
    ];

    // Draw each square
    positions.forEach(pos => {
      const square = rc.rectangle(
        centerX + pos.x - squareSize/2,
        centerY + pos.y - squareSize/2,
        squareSize,
        squareSize,
        {
          stroke: 'black',
          strokeWidth: 1,
          roughness: 0.5,
          fill: 'none'
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
    />
  );
};

export default SquarePattern; 