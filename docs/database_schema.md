# VisionPath AR — Database Schema Design

VisionPath AR leverages a PostgreSQL relational database system to handle system logging, user configuration states, emergency response chains, and AI model version registries.

---

## 1. Schema Definitions (DDL)

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    emergency_contact_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device Profiles Table
CREATE TABLE devices (
    device_id UUID PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    device_model VARCHAR(50) NOT NULL,
    firmware_version VARCHAR(30) NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-Time Navigation Session Log
CREATE TABLE navigation_sessions (
    session_id UUID PRIMARY KEY,
    device_id UUID REFERENCES devices(device_id) ON DELETE CASCADE,
    route_mode VARCHAR(20) NOT NULL, -- 'indoor', 'outdoor', 'emergency'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    start_lat DOUBLE PRECISION NOT NULL,
    start_lng DOUBLE PRECISION NOT NULL,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    average_latency_ms REAL,
    average_fps REAL
);

-- Telemetry Logs Table (Partitioned by week for scale)
CREATE TABLE telemetry_logs (
    log_id BIGSERIAL,
    session_id UUID REFERENCES navigation_sessions(session_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    cpu_load_percent SMALLINT NOT NULL,
    ram_used_mb INT NOT NULL,
    battery_percent SMALLINT NOT NULL,
    temp_celsius SMALLINT NOT NULL,
    localization_confidence SMALLINT NOT NULL,
    PRIMARY KEY (log_id, timestamp)
) PARTITION BY RANGE (timestamp);

-- AI Model Registry Table
CREATE TABLE ai_models (
    model_hash VARCHAR(64) PRIMARY KEY,
    model_name VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    file_size_bytes INT NOT NULL,
    target_hardware VARCHAR(30) NOT NULL, -- 'arm_32', 'arm_64', 'jetson'
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Relational Indices & Queries

To guarantee high performance during analytics queries and device checks, the following indices are maintained:

```sql
-- Index for quick user-device association lookups
CREATE INDEX idx_devices_user ON devices(user_id);

-- Index for session history analysis sorted by timestamp
CREATE INDEX idx_sessions_time ON navigation_sessions(start_time DESC);

-- Index for localized telemetry filtering during incident reviews
CREATE INDEX idx_telemetry_session ON telemetry_logs(session_id);
```

---

## 3. Data Retention Policy

- **Active Telemetry**: High-frequency telemetry (1Hz) is stored in the partitioned `telemetry_logs` tables and retained for **30 days**. After 30 days, data is aggregated into hourly statistics and original rows are purged to reduce disk pressure.
- **Navigation Summaries**: Sessions summaries (`navigation_sessions`) are retained for **1 year** for user progress charting.
- **Emergency Incident Logs**: Any session where SOS was activated is flagged and retained **indefinitely** for compliance and system testing purposes.
