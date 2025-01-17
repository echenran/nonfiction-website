import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import './App.css';

const PerspectiveRoad = ({ containerWidth }) => {
  const svgRef = useRef(null);
  const animationRef = useRef(null);

  // We don't need separate state for containerWidth unless you prefer it;
  // we can just use the prop directly.

  const signRef = useRef({
    y: 150,    // Changed from 180 to 130 (50px higher)
    minY: 150, // Changed from 180 to 130 (50px higher)
    maxY: 620, 
    minScale: 0.001,
    maxScale: 2.5,
    speed: 2
  });

  // Add new ref for sun position
  const sunRef = useRef({
    x: -50,
    y: 0,
    progress: 0,
    speed: 0.001
  });

  // Generate dashed line segments
  const generateDashedLine = (
    startX,
    startY,
    endX,
    endY,
    timestamp,
    numSegments = 8
  ) => {
    const points = [];
    
    const dx = endX - startX;
    const dy = endY - startY;
    const totalDistance = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / totalDistance;
    const uy = dy / totalDistance;

    const animationSpeed = 0.0005;
    const baseOffset = (timestamp * animationSpeed) % 1;
    const baseDashLength = totalDistance / (numSegments * 12);

    for (let i = -1; i < numSegments + 1; i++) {
      let t = i / numSegments;
      // incorporate animation offset
      t = (t + baseOffset) % 1;

      if (t >= 0 && t <= 1) {
        const perspectiveScale = 1 + Math.pow(t, 2) * 15;
        const curvedT = Math.pow(t, 3);
        const distAlongLine = curvedT * totalDistance;

        const x1 = startX + ux * distAlongLine;
        const y1 = startY + uy * distAlongLine;
        const scaledDashLength = baseDashLength * perspectiveScale;
        const x2 = x1 + ux * scaledDashLength;
        const y2 = y1 + uy * scaledDashLength;

        if (distAlongLine <= totalDistance) {
          points.push([x1, y1, x2, y2]);
        }
      }
    }

    return points;
  };

  // A helper to draw the sign at (x, y) with a given scale
  const drawSign = (rs, svgEl, x, y, scale, seed) => {
    const w = 50 * scale;
    const h = 30 * scale;
    const signRect = rs.rectangle(x, y, w, h, {
      fill: 'lightgray',
      fillWeight: 1,
      stroke: 'black',
      strokeWidth: 1,
      roughness: 0.5,
      seed
    });
    svgEl.appendChild(signRect);

    const postW = 5 * scale;
    const postH = 25 * scale;
    const postX = x + (w - postW) / 2;
    const postY = y + h;
    const post = rs.rectangle(postX, postY, postW, postH, {
      fill: 'gray',
      fillWeight: 1,
      stroke: 'black',
      strokeWidth: 1,
      roughness: 0.5,
      seed: seed + 1
    });
    svgEl.appendChild(post);
  };

  const drawSun = (rs, svgEl) => {
    const sun = sunRef.current;
    
    // Update sun progress
    sun.progress += sun.speed;
    if (sun.progress > 1) sun.progress = 0;
    
    // Calculate sun position
    const startX = -50;
    const endX = containerWidth * 1.2;
    sun.x = startX + (endX - startX) * sun.progress;
    
    // Calculate y position using a full sine wave
    const horizonY = svgRef.current.height.baseVal.value * 0.2;
    const maxHeight = horizonY - 300;
    sun.y = horizonY - maxHeight * (1 - Math.sin(sun.progress * Math.PI)) - 100;

    // Only draw if within bounds
    if (sun.y < svgRef.current.height.baseVal.value) {
      // Only draw visible portions of the sun and rays
      const sunSize = 60;
      
      // Create a clip path for the sun
      const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clipPath.setAttribute("id", "sunClip");
      
      // Add a rectangle that covers everything above the horizon
      const clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      clipRect.setAttribute("x", "0");
      clipRect.setAttribute("y", "0");
      clipRect.setAttribute("width", containerWidth);
      clipRect.setAttribute("height", horizonY);
      clipPath.appendChild(clipRect);
      svgEl.appendChild(clipPath);

      // Create a group for the sun and rays with the clip path
      const sunGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      sunGroup.setAttribute("clip-path", "url(#sunClip)");
      
      // Draw the sun
      const sunCircle = rs.circle(sun.x, sun.y, sunSize, {
        fill: '#FFD700',
        fillStyle: 'solid',
        stroke: 'black',
        strokeWidth: 2,
        roughness: 0.3
      });
      sunGroup.appendChild(sunCircle);

      // Add rays with gap
      const rayLength = 20;
      const rayGap = 10;
      const numRays = 8;
      for (let i = 0; i < numRays; i++) {
        const angle = (i * 2 * Math.PI) / numRays;
        const rayX1 = sun.x + Math.cos(angle) * (sunSize / 2 + rayGap);
        const rayY1 = sun.y + Math.sin(angle) * (sunSize / 2 + rayGap);
        const rayX2 = sun.x + Math.cos(angle) * (sunSize / 2 + rayGap + rayLength);
        const rayY2 = sun.y + Math.sin(angle) * (sunSize / 2 + rayGap + rayLength);
        
        const ray = rs.line(rayX1, rayY1, rayX2, rayY2, {
          stroke: 'black',
          strokeWidth: 3,
          roughness: 0.5
        });
        sunGroup.appendChild(ray);
      }

      // Add the sun group to the main SVG
      svgEl.appendChild(sunGroup);
    }
  };

  // Main animation loop
  const drawFrame = (timestamp) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    // Clear the SVG
    while (svgEl.firstChild) {
      svgEl.removeChild(svgEl.firstChild);
    }

    const rs = rough.svg(svgEl);
    const seed = Math.floor(timestamp / 100);

    // Define dimensions first
    const width = containerWidth;
    const isMobile = window.innerWidth <= 768;
    const height = isMobile ? 250 : 400;
    const horizonY = height * 0.2;

    // Define road coordinates with responsive values
    const startX = width * 0.85;
    const startY = horizonY;
    
    // Adjust bottom coordinates based on container dimensions
    const leftRoadTopX = startX - 5;
    const leftRoadTopY = startY;
    const leftRoadBottomX = width * 0.3;
    const leftRoadBottomY = height - (height * 0.08);

    // Adjust right road end point
    const rightRoadBottomX = width * 0.7;

    // Update SVG height
    svgEl.setAttribute('height', height);
    svgEl.setAttribute('viewBox', `0 0 ${containerWidth} ${height}`);

    // Add gradient definition
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", "roadGradient");
    gradient.setAttribute("x1", "0");
    gradient.setAttribute("x2", "0");
    gradient.setAttribute("y1", "0");
    gradient.setAttribute("y2", "1");

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("style", "stop-color:#e0e0e0;stop-opacity:0.8");

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("style", "stop-color:#e0e0e0;stop-opacity:0");

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    svgEl.appendChild(gradient);

    // 1. Draw sun first (it will be the bottom layer)
    drawSun(rs, svgEl);

    // 2. Draw road shading
    const roadShading = rs.polygon([
      [startX - 5, startY + 2],
      [startX + 5, startY + 3],
      [rightRoadBottomX, leftRoadBottomY],
      [leftRoadBottomX, leftRoadBottomY]
    ], {
      fill: 'url(#roadGradient)',
      fillStyle: 'solid',
      stroke: 'none',
      roughness: 0.5,
      seed
    });
    svgEl.appendChild(roadShading);

    // 3. Draw horizon line on top
    const horizon = rs.line(0, horizonY, width, horizonY, {
      stroke: 'black',
      strokeWidth: 2,
      roughness: 0.5,
      seed
    });
    svgEl.appendChild(horizon);

    // 4. Draw left road line
    const leftRoad = rs.line(
      leftRoadTopX, 
      leftRoadTopY, 
      leftRoadBottomX, 
      leftRoadBottomY, 
      {
        stroke: 'black',
        strokeWidth: 1.5,
        roughness: 0.8,
        seed: seed + 1
      }
    );
    svgEl.appendChild(leftRoad);

    // 5. Draw right road line
    const rightRoad = rs.line(
      startX + 5, 
      startY, 
      rightRoadBottomX, 
      leftRoadBottomY, 
      {
        stroke: 'black',
        strokeWidth: 1.5,
        roughness: 0.8,
        seed: seed + 2
      }
    );
    svgEl.appendChild(rightRoad);

    // Calculate the center line coordinates based on left and right road positions
    const centerStartX = (leftRoadTopX + (startX + 5)) / 2;
    const centerEndX = (leftRoadBottomX + rightRoadBottomX) / 2;
    
    // Draw dashed center line
    const dashSegments = generateDashedLine(
      centerStartX,
      startY,
      centerEndX,
      leftRoadBottomY - 40,
      timestamp
    );
    dashSegments.forEach(([x1, y1, x2, y2]) => {
      const dash = rs.line(x1, y1, x2, y2, {
        stroke: 'black',
        strokeWidth: 1.5,
        roughness: 0.8,
        seed: seed + 3
      });
      svgEl.appendChild(dash);
    });

    // --- Animate the sign from horizon to bottom ---
    const sign = signRef.current;

    // Calculate how far along in the sign's vertical path we are (0..1)
    let t = (sign.y - sign.minY) / (sign.maxY - sign.minY);
    if (t < 0) t = 0;
    if (t > 1) t = 1;

    // Move downward
    sign.y += sign.speed * (0.2 + t * 8);
    if (sign.y > sign.maxY) {
      sign.y = sign.minY;
      t=0;
    }

    // Scale sign
    const currentScale = sign.minScale + t * (sign.maxScale - sign.minScale);

    // NEW: compute fraction of sign.y along the left road’s y-range
    let roadT = (sign.y - leftRoadTopY) / (leftRoadBottomY - leftRoadTopY);
    // clamp 0..1 so we don't go off the line
    if (roadT < 0) roadT = 0;
    if (roadT > 1) roadT = 1;

    // Lerp x between the road’s top x and bottom x
    const signX = leftRoadTopX + roadT * (leftRoadBottomX - leftRoadTopX) * 2.5 - 2;

    // Draw the sign at the interpolated x
    // drawSign(rs, svgEl, signX, sign.y, currentScale, seed + 4);

    animationRef.current = requestAnimationFrame(drawFrame);
  };

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const height = Math.min(500, window.innerHeight * 0.6);
        svgRef.current.setAttribute('height', height);
        svgRef.current.setAttribute('viewBox', `0 0 ${containerWidth} ${height}`);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerWidth]);

  // Add this useEffect to start/stop the animation
  useEffect(() => {
    // Start the animation
    animationRef.current = requestAnimationFrame(drawFrame);

    // Cleanup function to stop the animation when component unmounts
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [containerWidth]); // Re-run when containerWidth changes

  return (
    <svg
      ref={svgRef}
      width={containerWidth}
      height={window.innerWidth <= 768 ? 250 : 400}
      viewBox={`0 0 ${containerWidth} ${window.innerWidth <= 768 ? 250 : 400}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ background: 'transparent' }}
    />
  );
};

// New main component that wraps everything
const NonfictionPage = () => {
  // 1) Create a ref to the containing div
  const containerRef = useRef(null);

  // 2) State for the current width of the container
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Measure once on mount
    handleResize();

    // Update on browser resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="nonfiction-page">
      <div className="main-container">
        <h1 className="nonfiction-header">Nonfiction.</h1>
        <div className="content-box">
          {/* 3) Attach the ref here */}
          <div className="animation-section" ref={containerRef}>
            {/* Pass containerWidth as a prop */}
            <PerspectiveRoad containerWidth={containerWidth} />
          </div>

          <div className="text-section">
            <p>
              We build with optimism and thought. 
              Our mission is to use artificial intelligence as a tool 
              to augment human intelligence, output, and ability.
            </p>
            <p><a href="https://nonfictiontech.substack.com/">Subscribe to our newsletter</a> →</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NonfictionPage;