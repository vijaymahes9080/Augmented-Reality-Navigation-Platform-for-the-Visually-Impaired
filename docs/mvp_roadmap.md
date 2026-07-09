# VisionPath AR — MVP Roadmap & Deployment Strategy

This document details the development lifecycle, physical hardware list, automated test plans, and scalability plans for the VisionPath AR platform.

---

## 1. Hardware Bill of Materials (BOM)

To keep the platform compact, lightweight, and affordable, the core wearable package consists of:

| Component | Specification | Model recommendation | Estimated Cost |
| --- | --- | --- | --- |
| **Compute Core** | Quad-core ARM Cortex-A72 (64-bit SoC) | Raspberry Pi 4 Model B (2GB RAM) | $35 |
| **Camera** | 8 Megapixel Fixed Focus Sensor (CSI interface) | Raspberry Pi Camera Module V2 | $25 |
| **IMU Sensor** | 3-axis Accelerometer & 3-axis Gyroscope | MPU-6050 (I2C interface) | $4 |
| **Sonar Sensor** | Ultrasonic distance sensor (GPIO trigger/echo) | HC-SR04 | $3 |
| **Beacons** | Bluetooth Low Energy proximity sensor | Eddystone/iBeacon beacon tag | $8 |
| **Feedback** | Pinned bone-conduction headphones | Generic Bluetooth Headphones | $20 |
| **Power Source** | Li-Po Rechargeable battery module | 5V 3A USB-C Power Bank (5000mAh) | $12 |
| **Total Cost** | | | **~$107** |

---

## 2. Project Milestone Roadmap

```
+---------------------------------------------------------------------------------+
|                               DEVELOPMENT TIMELINE                              |
|                                                                                 |
|  [Month 1: Prototype] ───> [Month 2: AI Quant] ───> [Month 3: Wearable Integration]
|  - Set up EKF filter       - Compile INT8 ONNX      - Custom 3D casing print    |
|  - Plan node graph map     - Frame skip testing     - User-experience tests     |
|  - Write Python loops      - Benchmarking FPS       - Live sound cue tests      |
+---------------------------------------------------------------------------------+
```

- **Milestone 1: EKF Calibration & Sensor Setup (Weeks 1-4)**: Calibrate the IMU biases, map out the test node coordinates, and confirm continuous localization is functioning during GPS signal drops.
- **Milestone 2: AI Network Quantization & Speed Tuning (Weeks 5-8)**: Export YOLOv8-Nano to ONNX, quantize weights to 8-bit integers (`INT8`), and implement the decoupled frame-skipping optical flow cache tracking loop to ensure FPS remains stable on low-power ARM chips.
- **Milestone 3: Hardware Wearable Integration & Live Validation (Weeks 9-12)**: Package the sensors and Raspberry Pi in a custom 3D-printed wearable enclosure. Recruit visually impaired test subjects to validate audio instructions and fall detection alerts in physical environments.

---

## 3. Automated Testing Blueprint

To verify core components on edge devices, the platform includes a test suite executing:
- **Extended Kalman Filter Tests**: Feeds drift trajectories to verify the state estimates converge correctly.
- **Path Planner Verification**: Simulates node graph changes and verifies that shortest routes avoid dynamic hazard nodes.
- **Fall Detection Tests**: Simulates a series of acceleration profiles (normal walking vs dynamic impact spikes) to verify the 10-second SOS alert triggers.

These are run natively via `pytest` or Python's `unittest` module.

---

## 4. Edge-Scale Updates & OTA Model Deployment

To distribute software changes and AI model weights across devices without Docker:
1. **Model Compression**: Trained models are serialized to ONNX and quantized. Compressed `.tflite` files are uploaded to the Cloud Model Registry.
2. **Version Checks**: The edge device runs a background sync job. It polls the server (using a lightweight JSON request: `GET /api/v1/models/latest?hardware=arm_64`) to check for newer model hashes.
3. **OTA Downloads**: If a new model version is available, the device downloads the weights file directly, validates the hash signature, and swaps the model during startup.
4. **Dynamic Inference Fallback**: If an update fails, the system automatically falls back to the locally cached model version.
