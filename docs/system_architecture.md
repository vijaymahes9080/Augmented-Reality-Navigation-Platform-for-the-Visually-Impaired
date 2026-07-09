# VisionPath AR — System Architecture Specification

This document details the real-time, low-latency (<100ms target), offline-first system architecture for the VisionPath AR platform.

---

## 1. Top-Level Hardware & Software Topology

```
+-----------------------------------------------------------------------------------+
|                            LOCAL WEARABLE HARDWARE LAYER                          |
|                                                                                   |
|  +------------------+     +-----------------------+     +----------------------+  |
|  |  SENSOR ENGINE   |     |    FUSION COMPUTER    |     |   INTELLIGENCE CORE  |  |
|  |                  |     |                       |     |                      |  |
|  | - Camera Feed    | --> | - Kalman Filter (EKF) | --> | - A* Pathfinding     |  |
|  | - MPU-6050 IMU   |     | - Depth Extraction    |     | - Steering Vector    |  |
|  | - GPS & Sonar    |     | - Object Tracking     |     | - Collision Avoid    |  |
|  +------------------+     +-----------------------+     +----------------------+  |
|           |                           |                             |             |
|           +---------------------------+-----------------------------+             |
|                                       | (Low Latency Thread IPC)                  |
|                                       v                                           |
|                          +-------------------------+                              |
|                          |   ACCESSIBILITY SHELL   |                              |
|                          |                         |                              |
|                          | - Spatial Audio (HRTF)  |                              |
|                          | - Synthesized Cues      |                              |
|                          | - Tactile Haptic Pulses |                              |
|                          +-------------------------+                              |
+-----------------------------------------------------------------------------------+
                                        ^
                                        | (Secure TLS WebSockets / MQTT)
                                        v
+-----------------------------------------------------------------------------------+
|                                  CLOUD SUITE LAYER                                |
|                                                                                   |
|  +--------------------+     +------------------------+     +-------------------+  |
|  |  TELEMETRY PORTAL  |     |   DATABASE ARCHIVE     |     |  OTA MODEL STORE  |  |
|  | - Health Analytics |     | - PostgreSQL Cluster   |     | - Quantized YOLO  |  |
|  | - Live SOS Feeds   |     | - Nav Logs Ledger      |     | - Compiler Specs  |  |
|  +--------------------+     +------------------------+     +-------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Multi-Threaded Queue IPC Structure

To ensure that AI inference cycles (which can take 15-30ms) do not block raw camera frames or high-frequency IMU reads (100Hz), the edge engine operates a multi-threaded decoupled pipeline:

1. **Capture Thread (Thread 1)**: Interfaces with camera hardware (`V4L2` on Linux) to fetch raw images. Feeds the `frame_queue` at 30 FPS.
2. **Inference Thread (Thread 2)**: Pulls frames, runs dynamic frame-skipping optimizations (e.g. inference every 3rd frame, tracking optical flows on intermediate frames), and registers detections into `detection_queue`.
3. **Sensor Fusion & Navigation Thread (Thread 3)**: Blends IMU data and GPS readings inside an Extended Kalman Filter, computes potential field obstacle avoidance vectors, and writes steering cues to `guidance_queue`.
4. **Feedback Thread (Thread 4)**: Consumes steering cues and sends voice announcements or generates panning stereo beeps (spatial audio) to alert the user.

---

## 3. Communication Protocols

- **Local Bus Protocols**:
  - Camera: CSI interface or high-speed USB 3.0 UVC.
  - IMU (MPU6050): I2C protocol at 400 kHz (Fast Mode).
  - Beacons: BLE advertising packets (Bluetooth 5.0 LE).
- **Network Sync Protocols**:
  - Telemetry Logs: Secure MQTT over SSL/TLS (port 8883) to reduce bandwidth overhead.
  - Live SOS Location: Secure WebSocket (wss://) protocol for real-time tracking during emergencies.
