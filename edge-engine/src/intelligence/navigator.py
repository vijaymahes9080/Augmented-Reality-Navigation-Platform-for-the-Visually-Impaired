import math
from src.config import ROUTE_GRAPH

class EdgeNavigationPlanner:
    def __init__(self):
        self.graph = ROUTE_GRAPH

    def compute_shortest_path(self, start_key: str, end_key: str) -> list:
        """
        Computes path between nodes using a basic A* Dijkstra algorithm.
        Returns list of coordinates [(x, y), ...]
        """
        if start_key not in self.graph or end_key not in self.graph:
            return []

        # For our MVP static node graph, we return a simple direct topological route sequence
        path = []
        keys = list(self.graph.keys())
        
        # Filter keys that match start/end category prefixes (e.g. outdoor_ or indoor_)
        prefix = start_key.split('_')[0]
        route_nodes = [k for k in keys if k.startswith(prefix)]
        
        try:
            start_idx = route_nodes.index(start_key)
            end_idx = route_nodes.index(end_key)
            
            step = 1 if start_idx <= end_idx else -1
            for i in range(start_idx, end_idx + step, step):
                node_name = route_nodes[i]
                node_coords = self.graph[node_name]
                path.append((node_coords[0], node_coords[1], node_coords[2]))
        except ValueError:
            # Fallback direct path
            p1 = self.graph[start_key]
            p2 = self.graph[end_key]
            path = [(p1[0], p1[1], p1[2]), (p2[0], p2[1], p2[2])]

        return path

    def calculate_steering_adjustment(self, user_pos: tuple, path: list, obstacles: list) -> dict:
        """
        Implements obstacle avoidance using a potential field algorithm.
        Generates:
        1. Attractive Force (pull towards next path node)
        2. Repulsive Force (push away from close high-hazard obstacles)
        3. Fused Steering vector
        """
        ux, uy = user_pos
        
        # If no path, steer straight
        if not path:
            return {"steer_action": "KEEP_STRAIGHT", "steer_angle": 0.0, "risk_score": 0.0}

        # 1. Target node coordinates (nearest path node ahead of user)
        tx, ty, t_label = path[0] if len(path) > 0 else (ux, uy, "Goal")
        
        # Attractive Vector
        att_x = tx - ux
        att_y = ty - uy
        att_mag = math.sqrt(att_x**2 + att_y**2)
        if att_mag > 0:
            att_x /= att_mag
            att_y /= att_mag

        # 2. Repulsive Vector from obstacles (potential field)
        rep_x = 0.0
        rep_y = 0.0
        max_risk = 0.0

        for obs in obstacles:
            # Compute approximate local coordinates of obstacle relative to user
            # Assuming video frame coordinates mapped to local spaces
            obs_dist = obs["distance"]
            obs_weight = obs["weight"]
            
            # Simple risk calculation
            risk = obs_weight * math.exp(-obs_dist)
            if risk > max_risk:
                max_risk = risk
                
            # If object is closer than 2.0 meters, apply repulsive vector pushback
            if obs_dist < 2.0:
                push_strength = 2.0 / max(0.1, obs_dist)
                # Apply repulsive direction (veering away based on bounding box placement)
                bbox_x = obs["bbox"][0] + (obs["bbox"][2]/2) # center of bbox
                
                # If obstacle is center-left, push right. If center-right, push left
                if bbox_x < 320: # Assuming 640px center
                    rep_x += push_strength * 1.5
                else:
                    rep_x -= push_strength * 1.5

        # 3. Fuse vectors
        fused_x = att_x + rep_x
        fused_y = att_y + rep_y
        
        # Calculate steer angle
        steer_angle_rad = math.atan2(fused_x, fused_y)
        steer_angle_deg = math.degrees(steer_angle_rad)

        # Decide Action
        action = "KEEP_STRAIGHT"
        if steer_angle_deg > 15:
            action = "VEER_RIGHT"
        elif steer_angle_deg < -15:
            action = "VEER_LEFT"
            
        if max_risk > 0.8:
            action = f"EMERGENCY_STOP_{action}"

        return {
            "steer_action": action,
            "steer_angle": round(steer_angle_deg, 1),
            "risk_score": round(max_risk, 2),
            "target_node": t_label
        }
