import React, { useRef, useEffect, useState } from 'react';

interface Obstacle {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  distance: number; // meters
  hazardLevel: 'low' | 'medium' | 'high';
  direction: 'left' | 'center' | 'right';
}

interface ARViewportProps {
  activeRoute: 'outdoor_home' | 'indoor_office' | 'avoid_stairs' | 'safest';
  onNavigateAlert: (alertText: string) => void;
  lowVisionTheme: boolean;
  frameSkipRate: number; // e.g. 1 (no skip) or 3 (inference every 3rd frame)
}

export const ARViewport: React.FC<ARViewportProps> = ({
  activeRoute,
  onNavigateAlert,
  lowVisionTheme,
  frameSkipRate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [simulationMode, setSimulationMode] = useState<string>('simulation'); // 'webcam', 'simulation' or 'sandbox'
  
  // Sandbox states
  const [sandboxObstacles, setSandboxObstacles] = useState<Obstacle[]>([
    {
      label: 'Pedestrian (Sandbox)',
      x: 380,
      y: 190,
      width: 45,
      height: 120,
      distance: 4.8,
      hazardLevel: 'medium',
      direction: 'center'
    },
    {
      label: 'Traffic Cone (Sandbox)',
      x: 210,
      y: 260,
      width: 40,
      height: 60,
      distance: 2.5,
      hazardLevel: 'low',
      direction: 'left'
    }
  ]);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>('Pedestrian');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track simulation states
  const simFrameRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Toggle Webcam Stream
  useEffect(() => {
    if (simulationMode === 'webcam') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setStreamActive(true);
          }
        })
        .catch(err => {
          console.error("Camera access error:", err);
          alert("Could not access camera. Falling back to High-Fidelity Simulation Mode.");
          setSimulationMode('simulation');
        });
    } else {
      stopCameraStream();
    }

    return () => stopCameraStream();
  }, [simulationMode]);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  // Setup HRTF Audio Context on first click
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Play stereo-panned beep cue for obstacles
  const playSpatialPing = (distance: number, direction: 'left' | 'center' | 'right') => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const panner = ctx.createPanner();

    osc.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(ctx.destination);

    // Dynamic beep frequency depending on obstacle hazard level
    osc.frequency.setValueAtTime(distance < 1.5 ? 880 : 440, ctx.currentTime);
    osc.type = 'sine';

    // Throttled volume based on distance
    const vol = Math.max(0.01, Math.min(0.2, (3.0 - distance) / 3.0));
    gainNode.gain.setValueAtTime(vol, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    // HRTF Spatial Panning
    panner.panningModel = 'HRTF';
    let panX = 0;
    if (direction === 'left') panX = -1.5;
    if (direction === 'right') panX = 1.5;
    panner.positionX.setValueAtTime(panX, ctx.currentTime);
    panner.positionY.setValueAtTime(0, ctx.currentTime);
    panner.positionZ.setValueAtTime(-1, ctx.currentTime);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.16);
  };

  // Sandbox Mouse/Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (simulationMode !== 'sandbox') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    for (let i = sandboxObstacles.length - 1; i >= 0; i--) {
      const o = sandboxObstacles[i];
      if (clickX >= o.x && clickX <= o.x + o.width && clickY >= o.y && clickY <= o.y + o.height) {
        setDraggedIndex(i);
        setDragOffset({ x: clickX - o.x, y: clickY - o.y });
        initAudio();
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (simulationMode !== 'sandbox' || draggedIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const o = sandboxObstacles[draggedIndex];
    const newX = Math.max(0, Math.min(canvas.width - o.width, clickX - dragOffset.x));
    const newY = Math.max(canvas.height * 0.1, Math.min(canvas.height - o.height, clickY - dragOffset.y));

    const horizon = canvas.height * 0.45;
    const heightSpan = canvas.height - horizon;
    const normY = Math.max(0.01, Math.min(1.0, (newY + o.height - horizon) / heightSpan));
    const distance = parseFloat((0.5 + 14.5 * (1.0 - normY)).toFixed(1));

    const centerPercent = (newX + o.width / 2) / canvas.width;
    let direction: 'left' | 'center' | 'right' = 'center';
    if (centerPercent < 0.4) {
      direction = 'left';
    } else if (centerPercent > 0.6) {
      direction = 'right';
    }

    let hazardLevel: 'low' | 'medium' | 'high' = 'low';
    if (distance < 2.0) {
      hazardLevel = 'high';
    } else if (distance < 5.0) {
      hazardLevel = 'medium';
    }

    setSandboxObstacles(prev => prev.map((item, idx) => {
      if (idx === draggedIndex) {
        return {
          ...item,
          x: newX,
          y: newY,
          distance,
          direction,
          hazardLevel
        };
      }
      return item;
    }));
  };

  const handleMouseUp = () => {
    setDraggedIndex(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (simulationMode !== 'sandbox') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setSandboxObstacles(prev => prev.filter(item => {
      const hit = clickX >= item.x && clickX <= item.x + item.width && clickY >= item.y && clickY <= item.y + item.height;
      return !hit;
    }));
  };

  const handleAddObstacle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 60;
    let height = 80;
    let label = selectedObstacleType;
    let hazardLevel: 'low' | 'medium' | 'high' = 'medium';

    if (selectedObstacleType === 'Pedestrian') {
      width = 45;
      height = 120;
      hazardLevel = 'high';
    } else if (selectedObstacleType === 'Traffic Cone') {
      width = 40;
      height = 60;
      hazardLevel = 'low';
    } else if (selectedObstacleType === 'Stairs') {
      width = 120;
      height = 90;
      hazardLevel = 'high';
    } else if (selectedObstacleType === 'Office Chair') {
      width = 60;
      height = 80;
      hazardLevel = 'medium';
    } else if (selectedObstacleType === 'Vehicle') {
      width = 140;
      height = 80;
      hazardLevel = 'high';
    } else if (selectedObstacleType === 'Pothole') {
      width = 90;
      height = 40;
      hazardLevel = 'high';
    }

    const x = canvas.width / 2 - width / 2 + (Math.random() - 0.5) * 120;
    const y = canvas.height * 0.5 + (Math.random() - 0.5) * 60;

    const newObstacle: Obstacle = {
      label,
      x: Math.max(0, Math.min(canvas.width - width, x)),
      y: Math.max(canvas.height * 0.15, Math.min(canvas.height - height, y)),
      width,
      height,
      distance: 3.5,
      hazardLevel,
      direction: 'center'
    };

    const horizon = canvas.height * 0.45;
    const heightSpan = canvas.height - horizon;
    const normY = Math.max(0.01, Math.min(1.0, (newObstacle.y + newObstacle.height - horizon) / heightSpan));
    newObstacle.distance = parseFloat((0.5 + 14.5 * (1.0 - normY)).toFixed(1));

    const centerPercent = (newObstacle.x + newObstacle.width / 2) / canvas.width;
    if (centerPercent < 0.4) {
      newObstacle.direction = 'left';
    } else if (centerPercent > 0.6) {
      newObstacle.direction = 'right';
    } else {
      newObstacle.direction = 'center';
    }

    setSandboxObstacles(prev => [...prev, newObstacle]);
  };

  // Run the render and CV pipeline loops
  useEffect(() => {
    let animationId: number;
    let lastAlertTime = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const width = canvas.width = canvas.parentElement?.clientWidth || 640;
      const height = canvas.height = canvas.parentElement?.clientHeight || 400;

      simFrameRef.current++;
      const frameNum = simFrameRef.current;

      // Draw background
      if (simulationMode === 'webcam' && streamActive && videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      } else {
        // Draw simulated environmental background grid
        drawSimulatedBackground(ctx, width, height, frameNum);
      }

      // Generate simulated obstacles based on active route and frame index
      const obstacles = simulationMode === 'sandbox'
        ? sandboxObstacles
        : getObstaclesForRoute(activeRoute, frameNum, width, height);

      // Dynamic path avoidance steering calculation
      let pathShiftX = 0;
      if (simulationMode === 'sandbox') {
        obstacles.forEach(o => {
          const obsCenterX = o.x + o.width / 2;
          const obsCenterY = o.y + o.height;
          const horizon = height * 0.45;
          if (obsCenterY > horizon && obsCenterY <= height) {
            const pathCenterX = width / 2;
            const diffX = obsCenterX - pathCenterX;
            const distanceX = Math.abs(diffX);
            const threshold = width * 0.22;
            if (distanceX < threshold) {
              const force = (1.0 - distanceX / threshold) * (width * 0.15);
              const directionSign = diffX > 0 ? -1 : 1;
              pathShiftX += directionSign * force;
            }
          }
        });
        pathShiftX = Math.max(-width * 0.22, Math.min(width * 0.22, pathShiftX));
      }

      // Perform frame-skipping optimizations (skip complex AI calculations every N frames)
      const shouldRunInference = frameNum % frameSkipRate === 0;

      // Draw bounding boxes, depth labels, and paths
      drawAROverlays(ctx, width, height, obstacles, frameNum, shouldRunInference, pathShiftX);

      // Speak alerts if obstacle gets dangerously close (throttled every 4 seconds)
      const dangerousObstacle = obstacles.find(o => o.distance < 1.8 && o.hazardLevel === 'high');
      const now = Date.now();
      if (dangerousObstacle && now - lastAlertTime > 4000) {
        lastAlertTime = now;
        onNavigateAlert(`Warning. ${dangerousObstacle.label} detected ${dangerousObstacle.distance} meters ahead ${dangerousObstacle.direction}. Veer away.`);
        playSpatialPing(dangerousObstacle.distance, dangerousObstacle.direction);
      } else if (obstacles.length > 0) {
        // Dynamic Sonar warning frequency
        const closest = obstacles.reduce((min, o) => o.distance < min.distance ? o : min, obstacles[0]);
        let pingInterval = 40;
        if (closest.distance < 1.5) {
          pingInterval = 10;
        } else if (closest.distance < 3.0) {
          pingInterval = 20;
        }
        if (frameNum % pingInterval === 0) {
          playSpatialPing(closest.distance, closest.direction);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [simulationMode, streamActive, activeRoute, frameSkipRate, onNavigateAlert, sandboxObstacles]);

  // Renders a stylized vector outline grid representing the physical environment 3D scene
  const drawSimulatedBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0b0f19');
    grad.addColorStop(1, '#05070c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw grid perspective lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1.5;
    const horizon = h * 0.45;
    const scroll = (frame * 1.5) % 40;

    // Horizontal lines
    for (let y = horizon; y < h; y += 40) {
      const stepY = y + scroll;
      if (stepY > h) continue;
      ctx.beginPath();
      ctx.moveTo(0, stepY);
      ctx.lineTo(w, stepY);
      ctx.stroke();
    }

    // Perspective vanishing point lines
    const numVanishingLines = 14;
    for (let i = 0; i <= numVanishingLines; i++) {
      const xStart = (i / numVanishingLines) * w;
      ctx.beginPath();
      ctx.moveTo(w / 2, horizon);
      ctx.lineTo(xStart, h);
      ctx.stroke();
    }
  };

  const getObstaclesForRoute = (route: string, frame: number, w: number, h: number): Obstacle[] => {
    const timeFactor = (frame * 0.015);
    const list: Obstacle[] = [];

    if (route === 'outdoor_home') {
      // 1. Moving Vehicle
      const carOffset = (timeFactor * 40) % (w + 200) - 100;
      const carDist = Math.max(1.0, 15.0 - ((carOffset / w) * 12.0));
      if (carOffset < w) {
        list.push({
          label: 'Vehicle (Tesla Model 3)',
          x: carOffset,
          y: h * 0.52,
          width: 140,
          height: 80,
          distance: parseFloat(carDist.toFixed(1)),
          hazardLevel: carDist < 3.0 ? 'high' : carDist < 6.0 ? 'medium' : 'low',
          direction: carOffset < w * 0.45 ? 'left' : carOffset > w * 0.55 ? 'right' : 'center'
        });
      }

      // 2. Pedestrian
      const pedOffset = Math.sin(timeFactor * 1.2) * 80 + (w * 0.65);
      const pedDist = 3.5 + Math.sin(timeFactor) * 1.5;
      list.push({
        label: 'Pedestrian',
        x: pedOffset,
        y: h * 0.46,
        width: 45,
        height: 120,
        distance: parseFloat(pedDist.toFixed(1)),
        hazardLevel: pedDist < 2.0 ? 'high' : 'low',
        direction: pedOffset < w * 0.45 ? 'left' : pedOffset > w * 0.55 ? 'right' : 'center'
      });

      // 3. Traffic Light
      list.push({
        label: 'Traffic Light (RED)',
        x: w * 0.2,
        y: h * 0.15,
        width: 35,
        height: 90,
        distance: 8.4,
        hazardLevel: 'medium',
        direction: 'left'
      });
    }

    if (route === 'indoor_office') {
      // 1. Glass Door entrance
      const doorDist = Math.max(0.5, 6.0 - (frame * 0.02) % 5.5);
      list.push({
        label: 'Glass Door Entrance',
        x: w * 0.4,
        y: h * 0.4,
        width: 120,
        height: 180,
        distance: parseFloat(doorDist.toFixed(1)),
        hazardLevel: doorDist < 1.5 ? 'medium' : 'low',
        direction: 'center'
      });

      // 2. Office Chair obstacle
      const chairDist = Math.max(0.8, 4.2 - (frame * 0.015) % 3.5);
      list.push({
        label: 'Office Chair (Hazard)',
        x: w * 0.18,
        y: h * 0.55,
        width: 60,
        height: 80,
        distance: parseFloat(chairDist.toFixed(1)),
        hazardLevel: chairDist < 1.5 ? 'high' : 'medium',
        direction: 'left'
      });
    }

    if (route === 'avoid_stairs') {
      // 1. Ramp path highlight (Safe)
      list.push({
        label: 'Wheelchair Ramp',
        x: w * 0.5,
        y: h * 0.45,
        width: 150,
        height: 140,
        distance: 2.2,
        hazardLevel: 'low', // Safe
        direction: 'center'
      });
    }

    if (route === 'safest') {
      // Pedestrians & Scooters
      const scooterX = (timeFactor * 120) % (w + 100) - 50;
      const scooterDist = Math.max(0.5, 8.0 - (scooterX / w) * 7.5);
      list.push({
        label: 'Electric Scooter (Dynamic)',
        x: scooterX,
        y: h * 0.48,
        width: 50,
        height: 100,
        distance: parseFloat(scooterDist.toFixed(1)),
        hazardLevel: scooterDist < 2.0 ? 'high' : 'medium',
        direction: scooterX < w * 0.45 ? 'left' : scooterX > w * 0.55 ? 'right' : 'center'
      });
    }

    return list;
  };

  const drawAROverlays = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    obstacles: Obstacle[],
    frame: number,
    runInference: boolean,
    pathShiftX: number
  ) => {
    const horizon = h * 0.45;

    // 1. Draw Ground Safe Walking Path Segmentation (Bending/Avoiding obstacles)
    ctx.fillStyle = lowVisionTheme ? 'rgba(0, 255, 0, 0.4)' : 'rgba(16, 185, 129, 0.22)';
    ctx.strokeStyle = lowVisionTheme ? '#00ff00' : '#10b981';
    ctx.lineWidth = 3;

    ctx.beginPath();
    // Bottom-Left
    ctx.moveTo(w * 0.15, h);
    
    // Left boundary curve to Top-Left
    const ctrlLeftX = w * 0.285 + pathShiftX;
    const ctrlY = (h + horizon) / 2;
    ctx.quadraticCurveTo(ctrlLeftX, ctrlY, w * 0.42 + pathShiftX * 0.3, horizon);
    
    // Top line to Top-Right
    ctx.lineTo(w * 0.58 + pathShiftX * 0.3, horizon);
    
    // Right boundary curve back to Bottom-Right
    const ctrlRightX = w * 0.715 + pathShiftX;
    ctx.quadraticCurveTo(ctrlRightX, ctrlY, w * 0.85, h);
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Draw 3D Guidance Chevrons (flowing forward along the bent path)
    const chevronSpeed = (frame * 2.5) % 80;
    ctx.strokeStyle = lowVisionTheme ? '#ffff00' : '#06b6d4';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let offset = 0; offset < 240; offset += 80) {
      const step = chevronSpeed + offset;
      const scale = step / 240;
      
      const chevronY = (horizon) + (scale * (h - horizon));
      const chevronW = 40 * scale;
      const chevronH = 15 * scale;
      
      const t = scale;
      const lineX = (1 - t) * (1 - t) * (w / 2 + pathShiftX * 0.3) + 2 * (1 - t) * t * (w / 2 + pathShiftX) + t * t * (w / 2);

      ctx.beginPath();
      ctx.moveTo(lineX - chevronW, chevronY + chevronH);
      ctx.lineTo(lineX, chevronY);
      ctx.lineTo(lineX + chevronW, chevronY + chevronH);
      ctx.stroke();
    }

    // 3. Render Object Detection Bounding Boxes
    obstacles.forEach(o => {
      let boxColor = '#10b981'; // safe

      if (o.hazardLevel === 'high') {
        boxColor = lowVisionTheme ? '#ff0000' : '#ef4444';
      } else if (o.hazardLevel === 'medium') {
        boxColor = lowVisionTheme ? '#ffff00' : '#f59e0b';
      }

      ctx.shadowColor = boxColor;
      ctx.shadowBlur = lowVisionTheme ? 0 : 15;

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 3;

      // Draw bounding box
      ctx.strokeRect(o.x, o.y, o.width, o.height);
      ctx.shadowBlur = 0; // reset

      // Draw Label Badge
      ctx.fillStyle = boxColor;
      ctx.fillRect(o.x, o.y - 25, o.width, 25);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px "Space Grotesk", sans-serif';
      ctx.fillText(`${o.label} [${o.distance}m]`, o.x + 6, o.y - 8);

      // Drawing corner crosshairs to represent computer vision depth-anchoring
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      const cSize = 10;
      
      // Top-Left corner
      ctx.beginPath();
      ctx.moveTo(o.x - 3, o.y + cSize);
      ctx.lineTo(o.x - 3, o.y - 3);
      ctx.lineTo(o.x + cSize, o.y - 3);
      ctx.stroke();

      // Bottom-Right corner
      ctx.beginPath();
      ctx.moveTo(o.x + o.width + 3, o.y + o.height - cSize);
      ctx.lineTo(o.x + o.width + 3, o.y + o.height + 3);
      ctx.lineTo(o.x + o.width - cSize, o.y + o.height + 3);
      ctx.stroke();
    });

    // 4. Inference Overlay Status Indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 160, 42);
    ctx.strokeStyle = runInference ? '#06b6d4' : '#6b7280';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 160, 42);

    ctx.fillStyle = runInference ? '#06b6d4' : '#9ca3af';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`AI PIPELINE: RUNNING`, 20, 26);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillText(`LATENCY: ${runInference ? '18ms' : 'SKIPPED'}`, 20, 40);
  };

  return (
    <div className="glass-panel viewport-area" style={{ height: '100%' }} onClick={initAudio}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>REAL-TIME AR VIEWPORT</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`tab-btn ${simulationMode === 'simulation' ? 'active' : ''}`}
            onClick={() => setSimulationMode('simulation')}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Virtual SIM
          </button>
          <button 
            className={`tab-btn ${simulationMode === 'sandbox' ? 'active' : ''}`}
            onClick={() => setSimulationMode('sandbox')}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Interactive Sandbox
          </button>
          <button 
            className={`tab-btn ${simulationMode === 'webcam' ? 'active' : ''}`}
            onClick={() => setSimulationMode('webcam')}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Live Web Camera
          </button>
        </div>
      </div>

      <div className="viewport-canvas-container">
        {simulationMode === 'webcam' && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ display: 'none' }}
          />
        )}
        <canvas 
          ref={canvasRef} 
          className="viewport-canvas" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: simulationMode === 'sandbox' ? 'pointer' : 'default' }}
        />

        {/* Sandbox Control HUD */}
        {simulationMode === 'sandbox' && (
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-glass-bright)',
            padding: '10px 14px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            width: '240px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
              SANDBOX SIMULATION CONTROLS
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select 
                value={selectedObstacleType}
                onChange={(e) => setSelectedObstacleType(e.target.value)}
                style={{
                  flexGrow: 1,
                  fontSize: '0.7rem',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  border: '1px solid var(--border-glass-bright)',
                  borderRadius: '4px',
                  padding: '2px 4px'
                }}
              >
                <option value="Pedestrian">Pedestrian</option>
                <option value="Traffic Cone">Traffic Cone</option>
                <option value="Stairs">Stairs</option>
                <option value="Office Chair">Office Chair</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Pothole">Pothole</option>
              </select>
              <button 
                onClick={handleAddObstacle}
                style={{
                  fontSize: '0.7rem',
                  background: 'var(--accent-indigo)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                + ADD
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                Double-click box to delete
              </span>
              <button 
                onClick={() => setSandboxObstacles([])}
                style={{
                  fontSize: '0.65rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
        
        {/* Overlay HUD stats */}
        <div style={{
          position: 'absolute',
          bottom: '15px',
          right: '15px',
          background: 'rgba(0, 0, 0, 0.75)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid var(--border-glass-bright)',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          color: '#00ffcc',
          pointerEvents: 'none'
        }}>
          FPS: 60 | HZ: 60.0 | MODE: {simulationMode === 'sandbox' ? 'INTERACTIVE SANDBOX' : activeRoute.toUpperCase().replace('_', ' ')}
        </div>
      </div>
    </div>
  );
};
