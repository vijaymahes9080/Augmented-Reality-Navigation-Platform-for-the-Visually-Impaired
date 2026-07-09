import { useState, useEffect, useRef } from 'react';

export interface LocationGPS {
  lat: number;
  lng: number;
  accuracy: number; // in meters
}

export interface IMUOrientation {
  yaw: number;
  pitch: number;
  roll: number;
  heading: number;
}

export interface BeaconNode {
  id: string;
  name: string;
  rssi: number;
  distance: number; // calculated from RSSI
}

export function useSensorFusion(activeRoute: 'outdoor_home' | 'indoor_office' | 'avoid_stairs' | 'safest') {
  const [gps, setGps] = useState<LocationGPS>({ lat: 37.774929, lng: -122.419416, accuracy: 4.2 });
  const [imu, setImu] = useState<IMUOrientation>({ yaw: 0, pitch: 0, roll: 0, heading: 180 });
  const [beacons, setBeacons] = useState<BeaconNode[]>([]);
  const [lidarSweep, setLidarSweep] = useState<number[]>([]);
  const [confidence, setConfidence] = useState(98);
  
  // Track walking progress index
  const progressIndexRef = useRef(0);
  const maxIndex = 60; // 60 states along path

  // Base coordinates depending on route
  const startLat = activeRoute === 'indoor_office' ? 37.789120 : 37.774929;
  const startLng = activeRoute === 'indoor_office' ? -122.401450 : -122.419416;

  useEffect(() => {
    // Reset route index on route change
    progressIndexRef.current = 0;
  }, [activeRoute]);

  // Main fusion interval
  useEffect(() => {
    const interval = setInterval(() => {
      progressIndexRef.current = (progressIndexRef.current + 1) % maxIndex;
      const step = progressIndexRef.current;
      
      // Calculate next GPS coordinate along route
      const factor = step / maxIndex;
      const angleRad = factor * Math.PI * 2;
      
      // Add standard path curves
      const latOffset = Math.sin(angleRad) * 0.0004;
      const lngOffset = (factor * 0.0012) + Math.cos(angleRad) * 0.0002;
      
      const targetLat = startLat + latOffset;
      const targetLng = startLng + lngOffset;

      // Add GPS noise based on mode
      const gpsNoise = Math.random() * 0.00001;
      const gpsAccuracy = activeRoute === 'indoor_office' 
        ? 8.5 + Math.random() * 2 // Indoor GPS degrades
        : 1.5 + Math.random() * 1; // Outdoor GPS is accurate

      setGps({
        lat: parseFloat((targetLat + gpsNoise).toFixed(6)),
        lng: parseFloat((targetLng + gpsNoise).toFixed(6)),
        accuracy: parseFloat(gpsAccuracy.toFixed(1))
      });

      // Update orientation (IMU)
      const currentHeading = Math.floor((180 + (Math.sin(angleRad) * 45) + Math.random() * 5) % 360);
      setImu({
        yaw: parseFloat((Math.sin(angleRad) * 30).toFixed(1)),
        pitch: parseFloat((Math.cos(angleRad * 2) * 5).toFixed(1)),
        roll: parseFloat((Math.sin(angleRad * 3) * 2).toFixed(1)),
        heading: currentHeading
      });

      // Update LiDAR sweeps (32 segments around the user)
      const sweep: number[] = [];
      for (let i = 0; i < 32; i++) {
        // Introduce artificial obstacles (closer obstacles at front angle)
        let dist = 4.0 + Math.random() * 2.0;
        
        // Simulating obstacle at 45 degrees
        if (i >= 3 && i <= 5) {
          dist = 1.2 + Math.random() * 0.2; // obstacle 1.2 meters away
        }
        // Simulating path boundary walls on left/right for indoor mode
        if (activeRoute === 'indoor_office') {
          if (i >= 8 && i <= 10) dist = 0.8 + Math.random() * 0.1; // Left wall
          if (i >= 22 && i <= 24) dist = 0.9 + Math.random() * 0.1; // Right wall
        }
        sweep.push(parseFloat(dist.toFixed(2)));
      }
      setLidarSweep(sweep);

      // Update BLE Beacons for indoor positioning
      if (activeRoute === 'indoor_office') {
        const d1 = Math.abs(2 - (step % 20) * 0.2);
        const d2 = Math.abs(5 - (step % 30) * 0.3);
        const rssi1 = Math.round(-60 - (d1 * 4));
        const rssi2 = Math.round(-72 - (d2 * 3));
        setBeacons([
          { id: 'beacon-hall-a', name: 'Hallway Beacon A', rssi: rssi1, distance: parseFloat(d1.toFixed(2)) },
          { id: 'beacon-lobby', name: 'Entrance Lobby Beacon', rssi: rssi2, distance: parseFloat(d2.toFixed(2)) }
        ]);
      } else {
        setBeacons([]);
      }

      // Calculate confidence score (higher is better)
      // Standard formula: degrades with GPS inaccuracy or lack of bluetooth references
      let confidenceRating = 99;
      if (activeRoute === 'indoor_office') {
        // High confidence if beacons are near, falls if accuracy is low and beacons disappear
        confidenceRating = Math.max(70, Math.round(98 - (gpsAccuracy * 1.5) + (rssiDelta() ? 5 : -10)));
      } else {
        confidenceRating = Math.max(80, Math.round(100 - (gpsAccuracy * 3)));
      }
      setConfidence(confidenceRating);

    }, 250);

    return () => clearInterval(interval);
  }, [activeRoute, startLat, startLng]);

  const rssiDelta = () => beacons.length > 0 && beacons[0].rssi > -70;

  return {
    gps,
    imu,
    beacons,
    lidarSweep,
    confidence
  };
}
