import React, { useRef, useEffect } from 'react';
import type { LocationGPS, IMUOrientation, BeaconNode } from '../hooks/useSensorFusion';

interface TelemetryRadarProps {
  gps: LocationGPS;
  imu: IMUOrientation;
  beacons: BeaconNode[];
  lidarSweep: number[];
  confidence: number;
}

export const TelemetryRadar: React.FC<TelemetryRadarProps> = ({
  gps,
  imu,
  beacons,
  lidarSweep,
  confidence
}) => {
  const radarRef = useRef<HTMLCanvasElement>(null);

  // Render LiDAR scan on canvas
  useEffect(() => {
    const canvas = radarRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const w = canvas.width = canvas.parentElement?.clientWidth || 200;
    const h = canvas.height = canvas.parentElement?.clientHeight || 200;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 15;

    // Clear Canvas
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);

    // Draw Radar Circles
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;
    for (let r = radius / 3; r <= radius; r += radius / 3) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Draw Sweep Line (rotates based on timestamp)
    const angle = (Date.now() / 1200) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.stroke();

    // Draw LiDAR Sweep Points
    if (lidarSweep.length > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // hazard dot
      ctx.shadowColor = '#ef4444';
      
      lidarSweep.forEach((dist, idx) => {
        const pointAngle = (idx / lidarSweep.length) * Math.PI * 2 - Math.PI / 2;
        // Map 0 to 6 meters to radar radius
        const scaleDist = Math.min(dist, 6.0);
        const drawRadius = (scaleDist / 6.0) * radius;
        const px = cx + Math.cos(pointAngle) * drawRadius;
        const py = cy + Math.sin(pointAngle) * drawRadius;

        ctx.shadowBlur = dist < 2.0 ? 8 : 0;
        ctx.beginPath();
        ctx.arc(px, py, dist < 2.0 ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0; // reset
    }

    // Draw User Icon in center
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Outward pointing directional heading arrow
    const headingRad = (imu.heading - 90) * (Math.PI / 180);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(headingRad) * 16, cy + Math.sin(headingRad) * 16);
    ctx.stroke();

  }, [lidarSweep, imu.heading]);

  return (
    <div className="telemetry-radar-grid">
      {/* Sonar Radar Card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
          360° LIDAR & SONAR RADAR
        </h3>
        <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
          <canvas ref={radarRef} style={{ width: '100%', height: '100%', borderRadius: '6px' }} />
        </div>
      </div>

      {/* Sensor Fusion Metrics Card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
          SENSOR FUSION STATE
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
          {/* Compass & Coordinates */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#9ca3af' }}>GPS Local:</span>
              <span style={{ color: '#fff' }}>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Accuracy:</span>
              <span style={{ color: gps.accuracy < 3 ? 'var(--color-safe)' : 'var(--color-warning)' }}>
                ±{gps.accuracy} meters
              </span>
            </div>
          </div>

          {/* IMU Values */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#9ca3af' }}>IMU Orientation:</span>
              <span style={{ color: '#fff' }}>Y:{imu.yaw}° | P:{imu.pitch}° | R:{imu.roll}°</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Heading Angle:</span>
              <span style={{ color: 'var(--accent-cyan)' }}>{imu.heading}° (North = 0°)</span>
            </div>
          </div>

          {/* Localization Confidence */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
            <span>Localization Confidence:</span>
            <span style={{ 
              fontWeight: 'bold', 
              color: confidence > 90 ? 'var(--color-safe)' : confidence > 80 ? 'var(--color-warning)' : 'var(--color-danger)'
            }}>
              {confidence}%
            </span>
          </div>
          <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${confidence}%`, 
              background: confidence > 90 ? 'var(--color-safe)' : confidence > 80 ? 'var(--color-warning)' : 'var(--color-danger)',
              transition: 'width 0.3s ease'
            }}/>
          </div>

          {/* Active Beacons */}
          {beacons.length > 0 && (
            <div style={{ marginTop: '3px' }}>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginBottom: '2px', fontFamily: 'monospace' }}>
                ACTIVE BLE BEACONS (INDOOR):
              </span>
              {beacons.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', background: 'rgba(6,182,212,0.06)', margin: '2px 0', borderRadius: '2px', borderLeft: '2px solid var(--accent-cyan)' }}>
                  <span>{b.name}</span>
                  <span style={{ color: '#06b6d4' }}>{b.rssi} dBm ({b.distance}m)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
