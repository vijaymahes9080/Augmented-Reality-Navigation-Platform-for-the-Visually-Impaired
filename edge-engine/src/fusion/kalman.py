import numpy as np

class ExtendedKalmanFilter:
    def __init__(self, dt: float = 0.25):
        self.dt = dt
        
        # State Vector: [x, y, vx, vy]^T
        self.x = np.array([0.0, 0.0, 0.0, 0.0])
        
        # State Transition Matrix F
        self.F = np.array([
            [1.0, 0.0, dt,  0.0],
            [0.0, 1.0, 0.0, dt ],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ])
        
        # State Covariance Matrix P
        self.P = np.eye(4) * 1.0
        
        # Measurement Matrix H (Only GPS measures position directly)
        self.H = np.array([
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0]
        ])
        
        # Measurement Noise Covariance R (GPS accuracy)
        self.R = np.eye(2) * 9.0  # 3m standard deviation squared
        
        # Process Noise Covariance Q (IMU velocity drifts)
        self.Q = np.eye(4) * 0.05

    def predict(self, ax: float, ay: float):
        """
        Predict step using IMU acceleration updates.
        """
        # Update velocities with acceleration integration
        self.x[2] += ax * self.dt
        self.x[3] += ay * self.dt
        
        # State transitions
        self.x = np.dot(self.F, self.x)
        self.P = np.dot(np.dot(self.F, self.P), self.F.T) + self.Q

    def update(self, gps_x: float, gps_y: float, gps_accuracy: float):
        """
        Update step using GPS measurements.
        Dynamic R matrix adjusts to GPS accuracy.
        """
        # Dynamic measurement noise scaling
        self.R = np.eye(2) * (gps_accuracy ** 2)
        
        # Measurement residual
        z = np.array([gps_x, gps_y])
        y = z - np.dot(self.H, self.x)
        
        # Kalman Gain
        S = np.dot(np.dot(self.H, self.P), self.H.T) + self.R
        K = np.dot(np.dot(self.P, self.H.T), np.linalg.inv(S))
        
        # Update State & Covariance
        self.x = self.x + np.dot(K, y)
        self.P = np.dot((np.eye(4) - np.dot(K, self.H)), self.P)

    def get_position(self) -> tuple:
        """
        Returns estimated position and velocities: (x, y, vx, vy)
        """
        return float(self.x[0]), float(self.x[1]), float(self.x[2]), float(self.x[3])

    def get_confidence(self) -> float:
        """
        Returns navigation confidence score (0-100%) based on trace of state covariance.
        """
        trace = np.trace(self.P[:2, :2])
        # Higher covariance = lower confidence
        conf = 100.0 * np.exp(-trace / 10.0)
        return float(np.clip(conf, 0.0, 100.0))
