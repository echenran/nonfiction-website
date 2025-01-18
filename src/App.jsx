import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import rough from 'roughjs';
import './App.css';

const PerspectiveRoad = ({ containerWidth, isDarkMode, onDarkModeChange }) => {
  const svgRef = useRef(null);
  const animationRef = useRef(null);

  const signRef = useRef({
    y: 150,
    minY: 150,
    maxY: 620,
    minScale: 0.001,
    maxScale: 2.5,
    speed: 2
  });

  const sunRef = useRef({
    x: -50,
    y: 0,
    progress: 0.35,
    speed: 0.0005
  });

  const starsRef = useRef(null);

  const colorTransitionRef = useRef({
    isTransitioning: false,
    startTime: 0,
    startColor: '',
    targetColor: '',
    startGradientColor: '',
    targetGradientColor: '',
    duration: 1500
  });

  const interpolateColor = (startColor, endColor, progress) => {
    const normalizeColor = (color) => {
      if (!color.startsWith('#')) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = color;
        return ctx.fillStyle;
      }
      return color;
    };

    startColor = normalizeColor(startColor);
    endColor = normalizeColor(endColor);

    const start = {
      r: parseInt(startColor.slice(1, 3), 16),
      g: parseInt(startColor.slice(3, 5), 16),
      b: parseInt(startColor.slice(5, 7), 16)
    };
    
    const end = {
      r: parseInt(endColor.slice(1, 3), 16),
      g: parseInt(endColor.slice(3, 5), 16),
      b: parseInt(endColor.slice(5, 7), 16)
    };

    const r = Math.round(start.r + (end.r - start.r) * progress);
    const g = Math.round(start.g + (end.g - start.g) * progress);
    const b = Math.round(start.b + (end.b - start.b) * progress);

    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  useEffect(() => {
    const numStars = 50;
    const stars = [];
    const width = containerWidth;
    const height = window.innerWidth <= 768 ? 250 : 400;
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.18),
        size: Math.random() * 1.5 + 0.5,
        opacity: 0
      });
    }
    starsRef.current = stars;
  }, [containerWidth]);

  const updateStarOpacities = (isDark, timestamp) => {
    if (!starsRef.current) return;
    
    const horizonY = svgRef.current.height.baseVal.value * 0.2;
    const sunY = sunRef.current.y;
    
    const fadeStartY = horizonY + 100;
    const fadeEndY = horizonY;
    
    let targetOpacity = 1;
    if (sunY < fadeStartY && sunY > fadeEndY) {
      targetOpacity = (sunY - fadeEndY) / (fadeStartY - fadeEndY);
    } else if (sunY <= fadeEndY) {
      targetOpacity = 0;
    }
    
    starsRef.current.forEach(star => {
      const opacityStep = 0.005;
      if (star.opacity < targetOpacity) {
        star.opacity = Math.min(targetOpacity, star.opacity + opacityStep);
      } else if (star.opacity > targetOpacity) {
        star.opacity = Math.max(targetOpacity, star.opacity - opacityStep);
      }
    });
  };

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

  const drawSun = (rs, svgEl) => {
    const sun = sunRef.current;
    sun.progress += sun.speed;
    if (sun.progress > 1) sun.progress = 0;
    
    const isMobile = window.innerWidth <= 768;
    const startX = isMobile ? -150 : -100;
    const endX = containerWidth * (isMobile ? 1.4 : 1.2);
    sun.x = startX + (endX - startX) * sun.progress;
    
    const horizonY = svgEl.height.baseVal.value * 0.2;
    const maxHeight = horizonY - (isMobile ? 1000 : 300);
    sun.y = horizonY - maxHeight * (1 - Math.sin(sun.progress * Math.PI)) - 100;

    const themeChangeOffset = 30;
    onDarkModeChange(sun.y > (horizonY + themeChangeOffset));

    if (sun.y < svgEl.height.baseVal.value) {
      const isMobile = window.innerWidth <= 768;
      const sunSize = isMobile ? 25 : 40;
      const rayLength = isMobile ? 12 : 20;
      const rayGap = isMobile ? 6 : 10;
      
      const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clipPath.setAttribute("id", "sunClip");
      
      const clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      clipRect.setAttribute("x", "0");
      clipRect.setAttribute("y", "0");
      clipRect.setAttribute("width", containerWidth);
      clipRect.setAttribute("height", horizonY);
      clipPath.appendChild(clipRect);
      svgEl.appendChild(clipPath);

      const sunGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      sunGroup.setAttribute("clip-path", "url(#sunClip)");
      
      const sunCircle = rs.circle(sun.x, sun.y, sunSize, {
        fill: '#FFD700',
        fillStyle: 'solid',
        stroke: 'black',
        strokeWidth: isMobile ? 1.5 : 2,
        roughness: 0.3
      });
      sunGroup.appendChild(sunCircle);

      const numRays = 8;
      for (let i = 0; i < numRays; i++) {
        const angle = (i * 2 * Math.PI) / numRays;
        const rayX1 = sun.x + Math.cos(angle) * (sunSize / 2 + rayGap);
        const rayY1 = sun.y + Math.sin(angle) * (sunSize / 2 + rayGap);
        const rayX2 = sun.x + Math.cos(angle) * (sunSize / 2 + rayGap + rayLength);
        const rayY2 = sun.y + Math.sin(angle) * (sunSize / 2 + rayGap + rayLength);
        
        const ray = rs.line(rayX1, rayY1, rayX2, rayY2, {
          stroke: 'black',
          strokeWidth: isMobile ? 2 : 3,
          roughness: 0.5
        });
        sunGroup.appendChild(ray);
      }

      svgEl.appendChild(sunGroup);
    }
  };

  const drawFrame = (timestamp) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    while (svgEl.firstChild) {
      svgEl.removeChild(svgEl.firstChild);
    }

    const rs = rough.svg(svgEl);
    const seed = Math.floor(timestamp / 100);

    const width = containerWidth;
    const isMobile = window.innerWidth <= 768;
    const height = isMobile ? 250 : 400;
    const horizonY = height * 0.2;

    const startX = width * 0.85;
    const startY = horizonY;
    
    const leftRoadTopX = startX - 5;
    const leftRoadTopY = startY;
    const leftRoadBottomX = width * 0.3;
    const leftRoadBottomY = height - (height * 0.08);
    const rightRoadBottomX = width * 0.7;

    svgEl.setAttribute('height', height);
    svgEl.setAttribute('viewBox', `0 0 ${containerWidth} ${height}`);

    let targetStrokeColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--border-color')
      .trim();
    if (targetStrokeColor === 'black') targetStrokeColor = '#000000';
    if (targetStrokeColor === 'white') targetStrokeColor = '#FFFFFF';
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const targetGradientColor = isDark ? '#271B5A' : '#c5c5c5';

    const transition = colorTransitionRef.current;
    if (
      (targetStrokeColor !== transition.targetColor ||
        targetGradientColor !== transition.targetGradientColor) &&
      !transition.isTransitioning
    ) {
      transition.isTransitioning = true;
      transition.startTime = timestamp;
      transition.startColor = transition.targetColor || targetStrokeColor;
      transition.targetColor = targetStrokeColor;
      transition.startGradientColor = transition.targetGradientColor || targetGradientColor;
      transition.targetGradientColor = targetGradientColor;
    }

    let currentStrokeColor = targetStrokeColor;
    let currentGradientColor = targetGradientColor;
    
    if (transition.isTransitioning) {
      const progress = Math.min((timestamp - transition.startTime) / transition.duration, 1);
      try {
        currentStrokeColor = interpolateColor(transition.startColor, transition.targetColor, progress);
        currentGradientColor = interpolateColor(transition.startGradientColor, transition.targetGradientColor, progress);
      } catch (error) {
        console.error('Color interpolation error:', error);
        currentStrokeColor = targetStrokeColor;
        currentGradientColor = targetGradientColor;
      }
      if (progress === 1) {
        transition.isTransitioning = false;
      }
    }

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("style", `stop-color:${currentGradientColor};stop-opacity:0.8`);

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("style", `stop-color:${currentGradientColor};stop-opacity:0`);

    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", "roadGradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("y2", "100%");
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);

    const defs = svgEl.querySelector("defs") || document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = '';
    defs.appendChild(gradient);
    if (!svgEl.querySelector("defs")) {
      svgEl.appendChild(defs);
    }

    if (starsRef.current) {
      updateStarOpacities(isDark, timestamp);
      starsRef.current.forEach(star => {
        const starDot = rs.circle(star.x, star.y, star.size, {
          fill: '#FFFDE7',
          fillStyle: 'solid',
          stroke: 'none',
          roughness: 0.3,
        });
        starDot.style.opacity = star.opacity;
        svgEl.appendChild(starDot);
      });
    }

    drawSun(rs, svgEl);

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

    let shadingOpacity = 1;
    if (transition.isTransitioning) {
      const progress = Math.min((timestamp - transition.startTime) / transition.duration, 1);
      shadingOpacity = isDark ? 1 - progress : progress;
    } else {
      shadingOpacity = isDark ? 0 : 1;
    }
    
    roadShading.style.opacity = shadingOpacity;
    svgEl.appendChild(roadShading);

    // HORIZON LINE (No inline .style.transition now)
    const horizon = rs.line(0, horizonY, width, horizonY, {
      stroke: currentStrokeColor,
      strokeWidth: 2,
      roughness: 0.5,
      seed
    });
    svgEl.appendChild(horizon);

    // LEFT ROAD LINE
    const leftRoad = rs.line(
      leftRoadTopX, 
      leftRoadTopY, 
      leftRoadBottomX, 
      leftRoadBottomY, 
      {
        stroke: currentStrokeColor,
        strokeWidth: 1.5,
        roughness: 0.8,
        seed: seed + 1
      }
    );
    svgEl.appendChild(leftRoad);

    // RIGHT ROAD LINE
    const rightRoad = rs.line(
      startX + 5, 
      startY, 
      rightRoadBottomX, 
      leftRoadBottomY, 
      {
        stroke: currentStrokeColor,
        strokeWidth: 1.5,
        roughness: 0.8,
        seed: seed + 2
      }
    );
    svgEl.appendChild(rightRoad);

    // Dashed center line
    const centerStartX = (leftRoadTopX + (startX + 5)) / 2;
    const centerEndX = (leftRoadBottomX + rightRoadBottomX) / 2;
    const dashSegments = generateDashedLine(
      centerStartX,
      startY,
      centerEndX,
      leftRoadBottomY - 40,
      timestamp
    );
    dashSegments.forEach(([x1, y1, x2, y2]) => {
      const dash = rs.line(x1, y1, x2, y2, {
        stroke: currentStrokeColor,
        strokeWidth: 1.5,
        roughness: 0.8,
        seed: seed + 3
      });
      svgEl.appendChild(dash);
    });

    // Animate the sign
    const sign = signRef.current;
    let t = (sign.y - sign.minY) / (sign.maxY - sign.minY);
    if (t < 0) t = 0;
    if (t > 1) t = 1;

    sign.y += sign.speed * (0.2 + t * 8);
    if (sign.y > sign.maxY) {
      sign.y = sign.minY;
      t = 0;
    }

    // Optional: you can still draw a sign if you like, omitted here

    animationRef.current = requestAnimationFrame(drawFrame);
  };

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

  useEffect(() => {
    animationRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [containerWidth]);

  return (
    <svg
      ref={svgRef}
      width={containerWidth}
      height={window.innerWidth <= 768 ? 250 : 400}
      viewBox={`0 0 ${containerWidth} ${window.innerWidth <= 768 ? 250 : 400}`}
      preserveAspectRatio="xMidYMid meet"
    />
  );
};

const NonfictionPage = () => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // useEffect(() => {
  //   const handleResize = () => {
  //     if (containerRef.current) {
  //       setContainerWidth(containerRef.current.offsetWidth);
  //     }
  //   };
  //   handleResize();
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');

    // if (containerRef.current) {
    //   setContainerWidth(containerRef.current.offsetWidth);
    // }
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      requestAnimationFrame(() => {
        // Sometimes Safari adjusts again. Measure again if you like:
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      });
    }

    document.documentElement.classList.remove('preload');
  }, []);


  useEffect(() => {
    let raf;
    const startDrawing = () => {
      raf = requestAnimationFrame(drawFrame);
    };
    raf = requestAnimationFrame(startDrawing);
    return () => cancelAnimationFrame(raf);
  }, [containerWidth]);

  return (
    <div className="nonfiction-page">
      <div className="main-container">
        <h1 className="nonfiction-header">Nonfiction.</h1>
        <div className="content-box">
          <div className="animation-section" ref={containerRef}>
            {containerWidth > 0 && (
              <>
                <PerspectiveRoad 
                  containerWidth={containerWidth}
                  isDarkMode={isDarkMode}
                  onDarkModeChange={setIsDarkMode}
                />
              </>
            )}
          </div>

          <div className="text-section">
            <p>
              We build technology with optimism and thought. 
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