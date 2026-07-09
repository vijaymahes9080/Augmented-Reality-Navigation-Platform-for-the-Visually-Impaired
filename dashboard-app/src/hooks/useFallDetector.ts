import { useState, useEffect, useRef, useCallback } from 'react';

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

export function useFallDetector(onSOSTriggered: () => void) {
  const [accelData, setAccelData] = useState<AccelerometerData>({ x: 0, y: 9.81, z: 0, magnitude: 1.0 });
  const [isAlerting, setIsAlerting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownIntervalRef = useRef<any | null>(null);

  // Simulate incoming accelerometer stream
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAlerting) return; // Freeze simulation during active fall warning

      // Add small gravity fluctuations to simulate normal walking
      const walkFluctuationX = (Math.random() - 0.5) * 1.5;
      const walkFluctuationY = 9.81 + (Math.random() - 0.5) * 1.8;
      const walkFluctuationZ = (Math.random() - 0.5) * 1.2;

      const mag = Math.sqrt(
        walkFluctuationX * walkFluctuationX +
        walkFluctuationY * walkFluctuationY +
        walkFluctuationZ * walkFluctuationZ
      ) / 9.81; // In g-force unit

      setAccelData({
        x: parseFloat(walkFluctuationX.toFixed(2)),
        y: parseFloat(walkFluctuationY.toFixed(2)),
        z: parseFloat(walkFluctuationZ.toFixed(2)),
        magnitude: parseFloat(mag.toFixed(2))
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isAlerting]);

  // Handle countdown logic
  useEffect(() => {
    if (isAlerting) {
      setCountdown(10);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setIsAlerting(false);
            onSOSTriggered(); // Trigger emergency SOS broadcast
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAlerting, onSOSTriggered]);

  // Manually trigger a fall simulation to test the SOS system
  const triggerSimulatedFall = useCallback(() => {
    // 1. High impact event (g-force spike)
    const impactX = 22.4;
    const impactY = -12.1;
    const impactZ = 30.2;
    const mag = Math.sqrt(impactX * impactX + impactY * impactY + impactZ * impactZ) / 9.81;

    setAccelData({
      x: impactX,
      y: impactY,
      z: impactZ,
      magnitude: parseFloat(mag.toFixed(2))
    });

    setIsAlerting(true);
  }, []);

  const dismissFallAlert = useCallback(() => {
    setIsAlerting(false);
    setCountdown(10);
  }, []);

  return {
    accelData,
    isAlerting,
    countdown,
    triggerSimulatedFall,
    dismissFallAlert
  };
}
