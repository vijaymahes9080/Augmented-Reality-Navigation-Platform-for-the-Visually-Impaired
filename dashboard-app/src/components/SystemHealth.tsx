import React, { useRef, useEffect, useState } from 'react';

export const SystemHealth: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  
  // Real-time states
  const [cpu, setCpu] = useState(24);
  const [ram, setRam] = useState(380); // MB
  const [battery, setBattery] = useState(94);
  const [temp, setTemp] = useState(41); // °C

  // Ring buffers for historical plotting (latency and FPS)
  const historyRef = useRef<{ fps: number; latency: number }[]>(
    Array.from({ length: 40 }, () => ({ fps: 60, latency: 18 }))
  );

  // Update telemetry details randomly to simulate real device feeds
  useEffect(() => {
    const timer = setInterval(() => {
      setCpu(Math.round(20 + Math.random() * 12));
      setRam(Math.round(370 + Math.random() * 25));
      
      setBattery(prev => {
        // Degrade very slowly, reset at 15
        if (prev <= 15) return 99;
        return prev - (Math.random() < 0.05 ? 1 : 0);
      });

      setTemp(Math.round(39 + Math.random() * 4));

      // Append new FPS/latency points
      const newFps = Math.round(58 + Math.random() * 4);
      const newLatency = Math.round(15 + Math.random() * 6);
      
      historyRef.current = [
        ...historyRef.current.slice(1),
        { fps: newFps, latency: newLatency }
      ];

      // Draw graph
      drawChart();
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const drawChart = () => {
    const canvas = chartRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const w = canvas.width = canvas.parentElement?.clientWidth || 300;
    const h = canvas.height = canvas.parentElement?.clientHeight || 90;

    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);

    const history = historyRef.current;
    const pointsCount = history.length;
    const stepX = w / (pointsCount - 1);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = h / 4; y < h; y += h / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 1. Plot Latency (Green/Cyan line, range 0 - 40ms)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = i * stepX;
      // Map 0-40ms latency to h-10 to 10px y-coordinates
      const val = Math.min(pt.latency, 40);
      const y = h - 5 - (val / 40) * (h - 10);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 2. Plot FPS (Indigo line, range 0 - 80 FPS)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = i * stepX;
      const val = Math.min(pt.fps, 80);
      const y = h - 5 - (val / 80) * (h - 10);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
        EDGE COMPUTING HEALTH
      </h3>

      {/* Grid of basic parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
          <span style={{ color: '#9ca3af' }}>ARM CPU Load:</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontWeight: 'bold' }}>
            <span>{cpu}%</span>
            <span style={{ color: cpu < 40 ? 'var(--color-safe)' : 'var(--color-warning)' }}>
              {cpu < 40 ? 'NOMINAL' : 'WARM'}
            </span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
          <span style={{ color: '#9ca3af' }}>Memory (RAM):</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontWeight: 'bold' }}>
            <span>{ram} MB</span>
            <span style={{ color: '#10b981' }}>OK</span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
          <span style={{ color: '#9ca3af' }}>Battery Status:</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontWeight: 'bold' }}>
            <span>{battery}%</span>
            <span style={{ color: battery > 20 ? 'var(--color-safe)' : 'var(--color-danger)' }}>
              {battery > 20 ? 'DISCHARGING' : 'LOW'}
            </span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
          <span style={{ color: '#9ca3af' }}>SoC Temperature:</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontWeight: 'bold' }}>
            <span>{temp}°C</span>
            <span style={{ color: temp < 55 ? 'var(--color-safe)' : 'var(--color-warning)' }}>
              {temp < 55 ? 'COOL' : 'HOT'}
            </span>
          </div>
        </div>
      </div>

      {/* Latency & FPS Realtime Graph */}
      <div style={{ marginTop: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace', marginBottom: '4px' }}>
          <span style={{ color: 'rgba(6, 182, 212, 1)' }}>■ Inference Latency (avg: 18ms)</span>
          <span style={{ color: 'rgba(99, 102, 241, 1)' }}>■ Camera Stream (avg: 60 FPS)</span>
        </div>
        <div style={{ height: '90px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
          <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  );
};
