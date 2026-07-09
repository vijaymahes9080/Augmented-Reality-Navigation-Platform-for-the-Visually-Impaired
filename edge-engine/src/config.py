# VisionPath AR — Configuration File

# Camera Settings
CAMERA_INDEX = 0
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
TARGET_FPS = 30

# Detection Settings
CONFIDENCE_THRESHOLD = 0.5
IOU_THRESHOLD = 0.4
FRAME_SKIP_RATE = 3  # Run object detection every 3rd frame

# Monocular Depth Calibration
FOCAL_LENGTH_PIXELS = 530.0  # Calibrated focal length for standard camera lens
AVERAGE_WIDTHS = {
    "pedestrian": 0.5,    # meters
    "vehicle": 1.8,       # meters
    "chair": 0.6,         # meters
    "door": 0.9,          # meters
    "stairs": 1.2,        # meters
    "traffic_light": 0.35 # meters
}

# Hazard Risk Coefficients
HAZARD_WEIGHTS = {
    "pedestrian": 0.4,
    "vehicle": 0.9,
    "chair": 0.5,
    "door": 0.1,  # low hazard (target)
    "stairs": 0.7,
    "traffic_light": 0.6
}

# Sensor Fusion (Kalman Filter) Parameters
GPS_NOISE_STD = 3.0       # meters
IMU_VELOCITY_NOISE_STD = 0.1 # m/s^2

# Fall Detection Parameters
FALL_IMPACT_THRESHOLD_G = 3.0  # g-force peak
FALL_FREEFALL_THRESHOLD_G = 0.25 # low gravity transition
POST_FALL_INACTIVITY_SECONDS = 10.0

# Local Coordinates Node Graph for Indoor/Outdoor Pathfinding
# (Format: Node_ID: (x, y, label))
ROUTE_GRAPH = {
    "outdoor_start": (0.0, 0.0, "Sidewalk Entrance"),
    "outdoor_node_1": (10.0, 2.0, "Street Corner A"),
    "outdoor_node_2": (25.0, -1.0, "Crosswalk Zone"),
    "outdoor_home": (40.0, 5.0, "Home Porch"),
    
    "indoor_start": (100.0, 100.0, "Building Entrance"),
    "indoor_node_1": (105.0, 100.0, "Security Lobby"),
    "indoor_node_2": (105.0, 115.0, "Elevator Hallway"),
    "indoor_office": (120.0, 115.0, "Office Desk")
}
