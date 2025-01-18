import React, { useEffect, useRef } from 'react';
import rough from 'roughjs/bundled/rough.esm.js';

const EscherStairs = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rc = rough.canvas(canvas);

    // Each square is 50×50
    const squareSize = 50;
    const half = squareSize / 2;

    // Center of canvas
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Distance offsets from the center for each square
    const d = 30; 
    const centers = [
      [cx,     cy - d -30], // top
      [cx + d, cy - d], // top-right
      [cx + d + 30, cy    ], // right
      [cx + d, cy + d], // bottom-right
      [cx,     cy + d + 30], // bottom
      [cx - d, cy + d], // bottom-left
      [cx - d - 30, cy    ], // left
      [cx - d, cy - d]  // top-left
    ];

    centers.forEach(([x, y]) => {
      rc.rectangle(x - half, y - half, squareSize, squareSize, {
        stroke: 'black',
        strokeWidth: 2,
        bowing: 0,
        disableMultiStroke: true,
        roughness: 0.5 // tweak for a more/less “sketchy” look
      });
    });

  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      style={{ border: '1px solid #ccc' }}
    />
  );
};

export default EscherStairs;