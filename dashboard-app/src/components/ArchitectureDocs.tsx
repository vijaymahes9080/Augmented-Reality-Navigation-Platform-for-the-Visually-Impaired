import React, { useState } from 'react';

export const ArchitectureDocs: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'api_db' | 'ai_pipeline' | 'deployment'>('architecture');

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
          VISIONPATH AR ENGINEERING DIRECTORY
        </h3>
      </div>

      {/* Directory sub-tabs */}
      <div className="tab-navigation" style={{ background: 'rgba(0,0,0,0.3)', padding: '2px' }}>
        <button 
          className={`tab-btn ${activeSubTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('architecture')}
          style={{ fontSize: '0.7rem', padding: '4px' }}
        >
          Sys-Arch
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'api_db' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('api_db')}
          style={{ fontSize: '0.7rem', padding: '4px' }}
        >
          API & DB
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'ai_pipeline' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('ai_pipeline')}
          style={{ fontSize: '0.7rem', padding: '4px' }}
        >
          AI Pipeline
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'deployment' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('deployment')}
          style={{ fontSize: '0.7rem', padding: '4px' }}
        >
          Deployment
        </button>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
        
        {/* TAB 1: System Architecture */}
        {activeSubTab === 'architecture' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ color: 'var(--accent-cyan)' }}>■ REAL-TIME HYBRID TOPOLOGY</h4>
            <p style={{ color: '#9ca3af', fontSize: '0.7rem', lineHeight: '1.25' }}>
              VisionPath AR uses an Edge-Heavy, Offline-First layout. Crucial navigation loops run on ARM processors locally to satisfy the &lt;100ms latency target. The cloud synchronizes settings and monitors telemetry updates.
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-glass)',
              borderRadius: '4px',
              padding: '6px',
              fontSize: '0.65rem'
            }}>
              <strong>LOCAL HARWARE WRAPPER (Smartphone/Pi/Glasses)</strong><br/>
              [Camera/IMU/GPS Sensors] → [Sensor Fusion (EKF)] → [Navigation Intelligence]<br/>
              &nbsp;&nbsp;↓ (Latency &lt;10ms) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↓ (Dijkstra Pathing) &nbsp;&nbsp; ↓ (Direct Loop)<br/>
              [Quantized INT8 YOLO/MediaPipe] → [Collision Prevention] → [Audio/Spatial Voice]<br/>
              <br/>
              <strong>CLOUD LAYER (Sync via WebSocket / Secure TLS MQTT)</strong><br/>
              [Device Telemetry Sync] ↔ [Logs PostgreSQL] ↔ [OTA AI Models Updater]
            </div>

            <h4 style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>■ EDGE-AI TELEMETRY SPEC</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: '#fff' }}>
                  <th style={{ padding: '3px 0' }}>Data Packet</th>
                  <th>Protocol</th>
                  <th>Frequency</th>
                  <th>Latency Target</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0', color: 'var(--accent-indigo)' }}>Video Frame Buffer</td>
                  <td>V4L2 Local</td>
                  <td>30 FPS</td>
                  <td>&lt;1 ms</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: 'var(--accent-indigo)' }}>IMU Rotation Matrix</td>
                  <td>I2C Bus</td>
                  <td>100 Hz</td>
                  <td>&lt;2 ms</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: 'var(--accent-indigo)' }}>Object Bounding Box</td>
                  <td>Local Memory</td>
                  <td>10-15 FPS</td>
                  <td>15 - 25 ms</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: 'var(--accent-indigo)' }}>Cloud Telemetry Logs</td>
                  <td>Secure MQTT</td>
                  <td>0.2 Hz</td>
                  <td>&lt;500 ms</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: API & Database Schema */}
        {activeSubTab === 'api_db' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ color: 'var(--accent-cyan)' }}>■ TELEMETRY SYNCHRONIZATION API</h4>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.65rem' }}>
              <strong>POST /api/v1/telemetry/sync</strong> (Offline-Fallback Cache Sync)<br/>
              Request Payload:<br/>
              <code>{"{"}<br/>
              &nbsp;&nbsp;"device_id": "VP-GLASSES-910X",<br/>
              &nbsp;&nbsp;"timestamp": "2026-06-24T15:51:00Z",<br/>
              &nbsp;&nbsp;"location": {"{"} "lat": 37.7749, "lng": -122.4194, "acc": 1.2 {"}"},<br/>
              &nbsp;&nbsp;"battery_level": 94.0,<br/>
              &nbsp;&nbsp;"average_fps": 60.0,<br/>
              &nbsp;&nbsp;"inference_latency_ms": 18.2<br/>
              {"}"}</code>
            </div>

            <h4 style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>■ SOS SIGNALING PROTOCOL</h4>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.65rem' }}>
              <strong>WebSocket Endpoint:</strong> <code>ws://broker.visionpath.ar/sos</code><br/>
              Active Broadcast Message:<br/>
              <code>{"{"}<br/>
              &nbsp;&nbsp;"event": "IMU_FALL_TRIGGERED",<br/>
              &nbsp;&nbsp;"device_id": "VP-GLASSES-910X",<br/>
              &nbsp;&nbsp;"lat": 37.774929, "lng": -122.419416,<br/>
              &nbsp;&nbsp;"speed_mps": 0.0, "time": "2026-06-24T15:51:01Z"<br/>
              {"}"}</code>
            </div>

            <h4 style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>■ POSTGRESQL DATABASE SCHEMA</h4>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '6px', fontSize: '0.65rem' }}>
              <strong>Table: users</strong> (id INT PRIMARY KEY, name VARCHAR, emergency_sms VARCHAR)<br/>
              <strong>Table: device_states</strong> (id UUID, battery FLOAT, status VARCHAR, firmware_v VARCHAR)<br/>
              <strong>Table: navigation_logs</strong> (id BIGINT, device_id UUID, route_mode VARCHAR, start_lat FLOAT, start_lng FLOAT, duration_seconds INT)
            </div>
          </div>
        )}

        {/* TAB 3: AI Pipeline */}
        {activeSubTab === 'ai_pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ color: 'var(--accent-cyan)' }}>■ CV PERCEPTION ENGINE PIPELINE</h4>
            <p style={{ color: '#9ca3af', fontSize: '0.7rem', lineHeight: '1.25' }}>
              Frames are captured by camera thread. To achieve &lt;100ms targets on ARM processors (Raspberry Pi/Smart Glasses), we use quantized architectures.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', fontSize: '0.65rem', lineHeight: '1.4' }}>
              <strong>1. Monocular Distance Estimation Formula:</strong><br/>
              Distance = (FocalLength * RealWidth) / PixelWidth<br/>
              FocalLength (f) = (PixelWidth_calibration * Distance_calibration) / RealWidth_calibration<br/>
              <br/>
              <strong>2. Collision Warning Risk Score:</strong><br/>
              Risk = class_weight * e^(-distance) * cos(heading_error)<br/>
              If Risk &gt; 0.85, high priority spatial voice prompt is triggered.
            </div>

            <h4 style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>■ EDGE MODEL BENCHMARKS (INT8 Quantized)</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: '#fff' }}>
                  <th style={{ padding: '3px 0' }}>Model Name</th>
                  <th>Size</th>
                  <th>Inference (Pi 4)</th>
                  <th>mAP Accuracy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0', color: 'var(--accent-indigo)' }}>YOLOv8-Nano (Quant)</td>
                  <td>3.2 MB</td>
                  <td>22 ms (NPU)</td>
                  <td>89.4%</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: 'var(--accent-indigo)' }}>MobileNetV3-SSD</td>
                  <td>2.1 MB</td>
                  <td>14 ms (CPU)</td>
                  <td>84.1%</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: 'var(--accent-indigo)' }}>DepthAnything-Lite</td>
                  <td>8.5 MB</td>
                  <td>45 ms (NPU)</td>
                  <td>82.6% (Abs Rel)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: Deployment & MVP Roadmap */}
        {activeSubTab === 'deployment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ color: 'var(--accent-cyan)' }}>■ MVP HARDWARE BILL OF MATERIALS</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '4px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>• Raspberry Pi Zero 2 W / Pi 4 Model B (Broadcom BCM2711 ARM Cortex-A72)</li>
              <li>• IMU MPU-6050 Accelerometer/Gyroscope (I2C interface)</li>
              <li>• Raspberry Pi Camera Module V2 (OmniVision OV5647 8MP)</li>
              <li>• Ultrasonic distance sensors HC-SR04 (GPIO ping interfaces)</li>
              <li>• BLE Beacons (Bluetooth 5.0 LE proximity sensors)</li>
            </ul>

            <h4 style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>■ MVP ROADMAP DEVELOPMENT</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.65rem' }}>
              <div style={{ borderLeft: '2px solid var(--accent-indigo)', paddingLeft: '6px' }}>
                <strong>Phase 1: Sensor Calibration (Weeks 1-3)</strong><br/>
                Calibrate camera pinhole model focal length and configure MPU6050 accelerometer parameters.
              </div>
              <div style={{ borderLeft: '2px solid var(--accent-indigo)', paddingLeft: '6px' }}>
                <strong>Phase 2: Edge Model Compiling (Weeks 4-6)</strong><br/>
                Compile YOLOv8-Nano to ONNX INT8 and export to TensorFlow Lite. Implement EKF filter.
              </div>
              <div style={{ borderLeft: '2px solid var(--accent-indigo)', paddingLeft: '6px' }}>
                <strong>Phase 3: Integration & User-Test (Weeks 7-10)</strong><br/>
                Build the client-side AR audio/vibe feedback. Run field trials with low-vision users.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
