import { useState, useCallback } from 'react';
import { ARViewport } from './components/ARViewport';
import { TelemetryRadar } from './components/TelemetryRadar';
import { SystemHealth } from './components/SystemHealth';
import { AISettings } from './components/AISettings';
import { EmergencySOS } from './components/EmergencySOS';
import { VoiceAssistant } from './components/VoiceAssistant';
import { ArchitectureDocs } from './components/ArchitectureDocs';

import { useSensorFusion } from './hooks/useSensorFusion';
import { useFallDetector } from './hooks/useFallDetector';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';

export default function App() {
  // Navigation & Route states
  const [activeRoute, setActiveRoute] = useState<'outdoor_home' | 'indoor_office' | 'avoid_stairs' | 'safest'>('outdoor_home');
  const [activeTab, setActiveTab] = useState<'console' | 'specs'>('console');
  
  // AI Pipeline Configs
  const [activeModel, setActiveModel] = useState<string>('yolo_nano');
  const [frameSkipRate, setFrameSkipRate] = useState<number>(3);
  const [quantizedEnabled, setQuantizedEnabled] = useState<boolean>(true);

  // Accessibility Audio Configs
  const [voiceVolume, setVoiceVolume] = useState<number>(0.8);
  const [voiceRate, setVoiceRate] = useState<number>(1.1);
  const [lowVisionTheme, setLowVisionTheme] = useState<boolean>(false);

  // SOS status
  const [sosBroadcastActive, setSosBroadcastActive] = useState<boolean>(false);

  // Callback to handle active route changes
  const handleRouteCommand = useCallback((scenario: 'outdoor_home' | 'indoor_office' | 'avoid_stairs' | 'safest') => {
    setActiveRoute(scenario);
  }, []);

  // Callback to handle emergency fall trigger
  const handleSOSTriggered = useCallback(() => {
    setSosBroadcastActive(true);
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]); // Vibrational pattern for SOS
    }
  }, []);

  // Sensor Fusion Hook
  const { gps, imu, beacons, lidarSweep, confidence } = useSensorFusion(activeRoute);

  // Fall Detection Hook
  const { accelData, isAlerting, countdown, triggerSimulatedFall, dismissFallAlert } = useFallDetector(handleSOSTriggered);

  // Voice Assistant Hook
  const { isListening, speechLogs, speak, startListening, stopListening, recognitionAvailable } = useVoiceAssistant(
    handleRouteCommand,
    handleSOSTriggered
  );

  // Trigger alert read-out
  const handleNavigateAlert = useCallback((alertText: string) => {
    speak(alertText, voiceRate, voiceVolume);
  }, [speak, voiceRate, voiceVolume]);

  // Click shortcut simulation helper
  const handleSimulateCommand = (cmdText: string) => {
    const query = cmdText.toLowerCase().trim();
    if (query.includes('home')) {
      speak('Starting outdoor navigation guide to Home. Walking path established.', voiceRate, voiceVolume);
      setActiveRoute('outdoor_home');
    } else if (query.includes('entrance') || query.includes('find entrance') || query.includes('find nearest entrance')) {
      speak('Finding nearest office entrance. Calibrating indoor beacon sensors.', voiceRate, voiceVolume);
      setActiveRoute('indoor_office');
    } else if (query.includes('stairs') || query.includes('avoid stairs')) {
      speak('Re-routing path to avoid stairs. Standard ramp navigation selected.', voiceRate, voiceVolume);
      setActiveRoute('avoid_stairs');
    } else if (query.includes('safe') || query.includes('safest')) {
      speak('Recalculating safest path. Priority set to low-traffic sidewalks.', voiceRate, voiceVolume);
      setActiveRoute('safest');
    } else if (query.includes('assistance') || query.includes('emergency') || query.includes('sos')) {
      speak('Emergency voice command detected. Initiating immediate SOS broadcast.', voiceRate, voiceVolume);
      setSosBroadcastActive(true);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Panel */}
      <header className="glass-panel dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'var(--accent-cyan)',
            boxShadow: 'var(--glow-cyan)'
          }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(to right, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            VISIONPATH AR
          </h1>
          <span style={{ fontSize: '0.65rem', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
            v1.2.0-EDGE
          </span>
        </div>

        {/* Global Telemetry HUD */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#9ca3af' }} className="sr-only-focusable">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              GPS: <strong style={{ color: gps.accuracy < 3 ? 'var(--color-safe)' : 'var(--color-warning)' }}>3D_LOCK</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              EDGE: <strong style={{ color: 'var(--color-safe)' }}>ONLINE</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              SYNC: <strong style={{ color: 'var(--color-safe)' }}>CONNECTED</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              BATTERY: <strong style={{ color: 'var(--color-safe)' }}>{accelData.magnitude > 2.0 ? 'IMPACT' : '94%'}</strong>
            </span>
          </div>

          <button 
            className="tab-btn active"
            onClick={() => {
              const next = !lowVisionTheme;
              setLowVisionTheme(next);
              if (next) {
                document.body.classList.add('high-contrast');
              } else {
                document.body.classList.remove('high-contrast');
              }
            }}
            style={{ 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.75rem', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border-glass-bright)'
            }}
          >
            {lowVisionTheme ? 'HIGH CONTRAST ON' : 'LOW VISION MODE'}
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="dashboard-body">
        {/* Left Side: AR Viewport & LiDAR Sonar */}
        <section className="viewport-area">
          <ARViewport 
            activeRoute={activeRoute} 
            onNavigateAlert={handleNavigateAlert} 
            lowVisionTheme={lowVisionTheme}
            frameSkipRate={frameSkipRate}
          />
          <TelemetryRadar 
            gps={gps} 
            imu={imu} 
            beacons={beacons} 
            lidarSweep={lidarSweep} 
            confidence={confidence} 
          />
        </section>

        {/* Right Side Sidebar Controls/Specs */}
        <section className="sidebar-area">
          <nav className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'console' ? 'active' : ''}`}
              onClick={() => setActiveTab('console')}
            >
              CONTROL CONSOLE
            </button>
            <button 
              className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              ARCHITECTURE SPEC
            </button>
          </nav>

          {activeTab === 'console' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Voice controls */}
              <VoiceAssistant 
                isListening={isListening} 
                speechLogs={speechLogs}
                startListening={startListening} 
                stopListening={stopListening} 
                recognitionAvailable={recognitionAvailable}
                onSimulateCommand={handleSimulateCommand}
              />
              
              {/* Emergency SOS panels */}
              <EmergencySOS 
                gps={gps}
                isAlerting={isAlerting}
                countdown={countdown}
                triggerSimulatedFall={triggerSimulatedFall}
                dismissFallAlert={dismissFallAlert}
                sosBroadcastActive={sosBroadcastActive}
                setSosBroadcastActive={setSosBroadcastActive}
              />

              {/* Edge compute statistics */}
              <SystemHealth />

              {/* Deep AI models and parameters */}
              <AISettings 
                activeModel={activeModel} 
                setActiveModel={setActiveModel}
                frameSkipRate={frameSkipRate} 
                setFrameSkipRate={setFrameSkipRate}
                voiceVolume={voiceVolume} 
                setVoiceVolume={setVoiceVolume}
                voiceRate={voiceRate} 
                setVoiceRate={setVoiceRate}
                lowVisionTheme={lowVisionTheme} 
                setLowVisionTheme={setLowVisionTheme}
                quantizedEnabled={quantizedEnabled} 
                setQuantizedEnabled={setQuantizedEnabled}
              />
            </div>
          ) : (
            <div style={{ flexGrow: 1, height: '100%' }}>
              <ArchitectureDocs />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
