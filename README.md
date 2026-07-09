# VisionPath AR — Real-Time Augmented Reality Navigation Platform for the Visually Impaired

VisionPath AR is an intelligent accessibility platform designed to empower visually impaired users to navigate safely and independently. The platform target low-latency (<100ms), offline-first constraints, deploying lightweight AI networks and multi-sensor Kalman filters on edge hardware (smartphones, Raspberry Pi, smart glasses) while providing a premium, accessible web dashboard for real-time simulation, monitoring, and telemetry log management.

---

## 1. Project Directory Structure

```
/ (Workspace Root)
├── dashboard-app/             # Vite + React TypeScript Web Dashboard & Simulator
│   ├── src/
│   │   ├── components/        # UI Panels (ARViewport, TelemetryRadar, SystemHealth, AISettings, EmergencySOS, VoiceAssistant, ArchitectureDocs)
│   │   ├── hooks/             # Sensor Fusion, Dictation Speech, Accelerometer Fall Detection Hooks
│   │   ├── styles/            # Vanilla CSS Theme and Accessibility styling overrides
│   │   ├── App.tsx            # Main Orchestrator and global state
│   │   └── main.tsx
│   ├── package.json           # Vite package manifest
│   └── vite.config.ts
├── edge-engine/               # Multi-Threaded Edge AI Python Engine
│   ├── src/
│   │   ├── perception/        # CV Lane extraction & Monocular Distance estimation
│   │   ├── fusion/            # Extended Kalman Filter (EKF) merging GPS & IMU
│   │   ├── intelligence/      # Potential Field Obstacle Avoidance & A* Path Planning
│   │   ├── main.py            # 4-thread queue-driven edge runner
│   │   └── config.py          # Port indices, thresholds, average widths
│   ├── tests/                 # Unit tests (Kalman stability, routing path accuracy)
│   └── requirements.txt       # Python package dependencies
├── docs/                      # Platform Engineering Directories
│   ├── system_architecture.md # Local multi-threaded topology and network sync rates
│   ├── database_schema.md     # PostgreSQL schemas, indexing and retention rules
│   └── mvp_roadmap.md         # Hardware Bill of Materials, updates and testing plans
└── README.md                  # Central documentation index (This file)
```

---

## 2. Installation & Quick Start

### Module A: Web Simulator Dashboard (`dashboard-app/`)
The client dashboard simulates environment segments, parses voice commands, renders LiDAR sonars, and charts compute health metrics.

1. Navigate to the dashboard directory:
   ```bash
   cd dashboard-app
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite developer server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL in your browser (default: `http://localhost:5173`).
5. **Interactive features to try**:
   - Select **Web Camera** to pipe your local feed, or use **Virtual SIM** to run high-fidelity route sequences.
   - Use the **Voice Assistant** dictation switch, or click simulator shortcut buttons ("Avoid stairs", "Guide me home") to update route profiles.
   - Click **Simulate IMU Fall** to verify the 10-second SOS countdown broadcast.
   - Click **Low Vision Mode** to toggle the solid Yellow-on-Black high-contrast stylesheet.

### Module B: Python Edge Engine (`edge-engine/`)
The Python engine runs continuous localization and collision avoidance steering vectors.

1. Navigate to the edge engine directory:
   ```bash
   cd edge-engine
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run automated tests verifying EKF and pathfinding:
   ```bash
   python -m unittest discover -s tests
   ```
4. Start the 4-thread real-time runner:
   ```bash
   python -m src.main
   ```
   *(Runs for 12 seconds in simulated camera mode, printing spatial voice cue prompts, and shuts down threads gracefully).*

---

## 3. Engineering Specifications Summary

### Multi-Threaded Queue Architecture
The local python engine operates a decoupled queue architecture:
- **Capture Thread**: Reads camera frames into a ring buffer.
- **Inference Thread**: Executes quantized object detection, mapping box pixel-widths to physical distances.
- **Fusion Thread**: Integrates gyroscope/accelerometer inputs inside an EKF and computes steering paths.
- **Guidance Thread**: Triggers synthesized voice instructions or HRTF stereo beep codes.

### Database Layout
Contains relational definitions for logging, metrics analysis, and emergency profiles:
- **`users`**: Registry of contacts and names.
- **`navigation_sessions`**: Record of modes, durations, coordinates, and latency.
- **`telemetry_logs`**: Partitioned database table tracking CPU loads, SoC temps, and batteries.

### MVP Hardware Bill of Materials
An affordable deployment package costing **~$107**:
- Raspberry Pi 4 Model B (2GB RAM)
- MPU-6050 Accelerometer/Gyroscope
- CSI Camera Module V2
- HC-SR04 Sonar Sensors
- Bluetooth LE Beacon tags

---

## 4. License

This project is licensed under the MIT License - see the [LICENSE](file:///d:/current%20project/Augmented%20Reality%20Navigation%20Platform%20for%20the%20Visually%20Impaired/LICENSE) file for details.
