import time
import queue
import threading
import numpy as np
import cv2
from src.config import FRAME_WIDTH, FRAME_HEIGHT, TARGET_FPS, FRAME_SKIP_RATE
from src.perception.detector import EdgePerceptionDetector
from src.fusion.kalman import ExtendedKalmanFilter
from src.intelligence.navigator import EdgeNavigationPlanner

# Thread-safe queues
frame_queue = queue.Queue(maxsize=3)
detection_queue = queue.Queue(maxsize=3)
guidance_queue = queue.Queue(maxsize=3)

# Global shutdown flag
shutdown_event = threading.Event()

def capture_thread_loop():
    """
    Thread 1: Frames Capture.
    Captures frames from OpenCV Camera or generates fallback matrices.
    """
    print("[Thread 1: CAPTURE] Initializing video feed...")
    # Attempt camera capture
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
    
    using_camera = cap.isOpened()
    if using_camera:
        print("[Thread 1: CAPTURE] Camera hardware connected successfully.")
    else:
        print("[Thread 1: CAPTURE] No camera detected. Initializing synthetic frames generator...")

    try:
        while not shutdown_event.is_set():
            start_t = time.time()
            
            if using_camera:
                ret, frame = cap.read()
                if not ret:
                    continue
            else:
                # Generate synthetic test frame (moving pattern)
                frame = np.zeros((FRAME_HEIGHT, FRAME_WIDTH, 3), dtype=np.uint8)
                cv2.putText(frame, "SIMULATED CAMERA", (120, 240), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                t = time.time()
                cx = int(FRAME_WIDTH/2 + np.sin(t) * 100)
                cv2.circle(frame, (cx, 300), 40, (0, 0, 255), -1) # fake obstacle

            # Put frame in queue (non-blocking, discard if full to avoid lag)
            try:
                frame_queue.put_nowait(frame)
            except queue.Full:
                pass
            
            # Maintain targeted frame rate delay
            elapsed = time.time() - start_t
            sleep_t = max(0.001, (1.0 / TARGET_FPS) - elapsed)
            time.sleep(sleep_t)
    finally:
        if using_camera:
            cap.release()
        print("[Thread 1: CAPTURE] Capture loop terminated.")

def inference_thread_loop(detector: EdgePerceptionDetector):
    """
    Thread 2: Object Detection and Path Segmentation.
    Pops frames, runs perception, skips inference frame cycles dynamically.
    """
    print("[Thread 2: INFERENCE] AI engine initialized.")
    while not shutdown_event.is_set():
        try:
            # Block with timeout to check exit event
            frame = frame_queue.get(timeout=0.5)
        except queue.Empty:
            continue
        
        # Performance optimization: frame skipping
        run_inference = (detector.frame_count % FRAME_SKIP_RATE == 0)
        
        # Run perception pipeline
        results = detector.process_frame(frame, run_inference)
        
        try:
            detection_queue.put_nowait(results)
        except queue.Full:
            pass

    print("[Thread 2: INFERENCE] Inference loop terminated.")

def sensor_fusion_thread_loop(ekf: ExtendedKalmanFilter, planner: EdgeNavigationPlanner):
    """
    Thread 3: Sensor Fusion & Navigation Intelligence.
    Fuses IMU velocities, predicts path, avoids obstacles.
    """
    print("[Thread 3: FUSION] Localization and Routing engine initialized.")
    
    # Calculate a simple walk path key sequence
    shortest_path = planner.compute_shortest_path("outdoor_start", "outdoor_home")
    user_coords = [0.0, 0.0]
    
    while not shutdown_event.is_set():
        try:
            perc_results = detection_queue.get(timeout=0.5)
        except queue.Empty:
            continue
        
        # 1. EKF prediction (integrate IMU readings)
        # Simulating active forward step acceleration values
        ax_imu = 0.05 + np.random.normal(0, 0.01)
        ay_imu = 0.4 + np.random.normal(0, 0.02)
        ekf.predict(ax_imu, ay_imu)
        
        # 2. GPS measurement update
        # Simulate GPS readings along our planned A* path coordinates
        progress_factor = (perc_results["frame_index"] * 0.005) % 1.0
        if shortest_path:
            # Interpolate coordinates along route
            path_len = len(shortest_path)
            idx = int(progress_factor * (path_len - 1))
            gps_target = shortest_path[idx]
            
            # Feed EKF with noisy GPS reading
            noise_x = np.random.normal(0, 0.5)
            noise_y = np.random.normal(0, 0.5)
            ekf.update(gps_target[0] + noise_x, gps_target[1] + noise_y, gps_accuracy=2.2)

        # Retrieve EKF filtered position
        ex, ey, evx, evy = ekf.get_position()
        confidence = ekf.get_confidence()
        
        # 3. Calculate Collision Avoidance vectors
        obstacles = perc_results["detections"]
        nav_guidance = planner.calculate_steering_adjustment(
            (ex, ey), 
            shortest_path, 
            obstacles
        )
        
        # Ship to guidance thread
        fusion_packet = {
            "pos": (ex, ey),
            "confidence": confidence,
            "steering": nav_guidance,
            "obstacles": obstacles
        }
        
        try:
            guidance_queue.put_nowait(fusion_packet)
        except queue.Full:
            pass

    print("[Thread 3: FUSION] Fusion loop terminated.")

def guidance_thread_loop():
    """
    Thread 4: Audio Cues & Haptic Prompt dispatcher.
    """
    print("[Thread 4: GUIDANCE] Speech and Alerts dispatcher initialized.")
    last_spoken_time = 0

    while not shutdown_event.is_set():
        try:
            guid_data = guidance_queue.get(timeout=0.5)
        except queue.Empty:
            continue
        
        steer = guid_data["steering"]
        risk = steer["risk_score"]
        action = steer["steer_action"]
        node = steer["target_node"]

        now = time.time()
        # Throttled speech cue output every 3 seconds to avoid auditory overflow
        if now - last_spoken_time > 3.0:
            last_spoken_time = now
            print(f"\n>>> [SPATIAL VOICE ALERT] Heading to: {node}")
            print(f"    Confidence: {round(guid_data['confidence'], 1)}% | Risk Level: {risk}")
            
            if "EMERGENCY_STOP" in action:
                print("    !!! VOICE CUE: 'Stop immediately. Obstacle detected in path.'")
            elif action == "VEER_LEFT":
                print("    <<< VOICE CUE: 'Veer left. Obstacle 1.2 meters ahead right.'")
            elif action == "VEER_RIGHT":
                print("    >>> VOICE CUE: 'Veer right. Obstacle 1.5 meters ahead left.'")
            else:
                print("    ^^^ VOICE CUE: 'Path is clear. Walk forward.'")

    print("[Thread 4: GUIDANCE] Alert loop terminated.")

def main():
    print("==================================================")
    print("   VISIONPATH AR — EDGE NAVIGATION SYSTEM RUNNER   ")
    print("==================================================")

    # Initialize Modules
    detector = EdgePerceptionDetector()
    ekf = ExtendedKalmanFilter(dt=0.25)
    planner = EdgeNavigationPlanner()

    # Start Threads
    t1 = threading.Thread(target=capture_thread_loop, name="Capture")
    t2 = threading.Thread(target=inference_thread_loop, args=(detector,), name="Inference")
    t3 = threading.Thread(target=sensor_fusion_thread_loop, args=(ekf, planner), name="Fusion")
    t4 = threading.Thread(target=guidance_thread_loop, name="Guidance")

    t1.start()
    t2.start()
    t3.start()
    t4.start()

    # Run for 15 seconds to demonstrate operations, then gracefully shutdown
    try:
        run_time = 12.0
        print(f"[System] Running real-time telemetry processing for {run_time} seconds...")
        time.sleep(run_time)
    except KeyboardInterrupt:
        pass
    finally:
        print("\n[System] Gracefully shutting down threads...")
        shutdown_event.set()
        
        # Wait for threads to close
        t1.join(timeout=2.0)
        t2.join(timeout=2.0)
        t3.join(timeout=2.0)
        t4.join(timeout=2.0)
        print("[System] All systems offline. Shutdown complete.")

if __name__ == "__main__":
    main()
