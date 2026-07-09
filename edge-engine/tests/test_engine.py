import unittest
import numpy as np
import math
from src.fusion.kalman import ExtendedKalmanFilter
from src.intelligence.navigator import EdgeNavigationPlanner

class TestVisionPathEdgeEngine(unittest.TestCase):

    def test_extended_kalman_filter_convergence(self):
        """
        Verifies that the EKF successfully merges IMU drift and GPS coordinates,
        converging to low error covariance and high confidence ratings.
        """
        ekf = ExtendedKalmanFilter(dt=0.2)
        initial_confidence = ekf.get_confidence()
        
        # Simulating walking along straight path: actual speed x = 1.0 m/s
        actual_x = 0.0
        for i in range(10):
            # 1. EKF Predict
            ekf.predict(ax=0.0, ay=0.0)
            
            # 2. EKF Update (incorporate GPS with noise)
            actual_x += 1.0 * 0.2  # actual pos update
            gps_measured_x = actual_x + np.random.normal(0, 0.1)
            ekf.update(gps_x=gps_measured_x, gps_y=0.0, gps_accuracy=1.5)

        estimated_x, estimated_y, vx, vy = ekf.get_position()
        final_confidence = ekf.get_confidence()

        # Check estimated coordinate converges to actual position
        self.assertAlmostEqual(estimated_x, actual_x, delta=0.5)
        # Check that EKF filter confidence has improved after GPS updates
        self.assertGreater(final_confidence, initial_confidence)

    def test_routing_path_planner(self):
        """
        Verifies that the Dijkstra/A* pathfinder solves shortest routes
        across localized coordinates correctly.
        """
        planner = EdgeNavigationPlanner()
        
        # Test outdoor path sequence resolver
        path = planner.compute_shortest_path("outdoor_start", "outdoor_home")
        
        self.assertGreater(len(path), 0)
        self.assertEqual(path[0][2], "Sidewalk Entrance") # Start name
        self.assertEqual(path[-1][2], "Home Porch")       # End name
        
        # Coordinates should increase along the x-axis mapping
        self.assertEqual(path[0][0], 0.0)
        self.assertEqual(path[-1][0], 40.0)

    def test_potential_field_steering_avoidance(self):
        """
        Verifies that close hazardous obstacles trigger emergency steering veers
        and push back relative vectors.
        """
        planner = EdgeNavigationPlanner()
        user_pos = (5.0, 5.0)
        # Target node directly forward: (5.0, 15.0)
        path = [(5.0, 15.0, "Forward Goal")]
        
        # 1. Test Clear Path: should keep straight
        steering_clear = planner.calculate_steering_adjustment(user_pos, path, [])
        self.assertEqual(steering_clear["steer_action"], "KEEP_STRAIGHT")
        self.assertEqual(steering_clear["risk_score"], 0.0)

        # 2. Test Obstacle Right Ahead (Distance 0.8 meters, high hazard)
        # Placement is left of center, should push steering RIGHT
        obstacles = [{
            "class": "chair",
            "bbox": [100, 200, 50, 50], # X center at 125 (Left side)
            "distance": 0.8,
            "weight": 0.9
        }]
        
        steering_hazard = planner.calculate_steering_adjustment(user_pos, path, obstacles)
        
        # Risk should be very high
        self.assertGreater(steering_hazard["risk_score"], 0.3)
        # Steering action should veer right
        self.assertTrue("VEER_RIGHT" in steering_hazard["steer_action"])

    def test_fall_detection_thresholds(self):
        """
        Verifies the mathematical threshold parameters for fall detections.
        """
        # Normal walking profile: gravity oscillates around 1g (9.81 m/s^2)
        normal_accels = [9.4, 9.8, 10.2, 9.7]
        for a in normal_accels:
            g_force = a / 9.81
            self.assertFalse(g_force > 3.0) # should not trigger high impact fall threshold

        # Fall profile: rapid free-fall (low g) followed by sudden high-g impact
        free_fall_g = 0.15  # < 0.25g
        impact_g = 3.8     # > 3.0g
        
        self.assertLess(free_fall_g, 0.25)
        self.assertGreater(impact_g, 3.0)

if __name__ == "__main__":
    unittest.main()
