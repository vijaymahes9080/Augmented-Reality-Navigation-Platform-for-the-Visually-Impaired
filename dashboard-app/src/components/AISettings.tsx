import React from 'react';

interface AISettingsProps {
  activeModel: string;
  setActiveModel: (m: string) => void;
  frameSkipRate: number;
  setFrameSkipRate: (r: number) => void;
  voiceVolume: number;
  setVoiceVolume: (v: number) => void;
  voiceRate: number;
  setVoiceRate: (r: number) => void;
  lowVisionTheme: boolean;
  setLowVisionTheme: (t: boolean) => void;
  quantizedEnabled: boolean;
  setQuantizedEnabled: (q: boolean) => void;
}

export const AISettings: React.FC<AISettingsProps> = ({
  activeModel,
  setActiveModel,
  frameSkipRate,
  setFrameSkipRate,
  voiceVolume,
  setVoiceVolume,
  voiceRate,
  setVoiceRate,
  lowVisionTheme,
  setLowVisionTheme,
  quantizedEnabled,
  setQuantizedEnabled
}) => {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
        AI ENGINE & ACCESSIBILITY SETTINGS
      </h3>

      {/* Model Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <label style={{ color: '#9ca3af', fontFamily: 'monospace' }}>Active AI Network Model:</label>
        <select 
          value={activeModel}
          onChange={(e) => setActiveModel(e.target.value)}
          style={{
            padding: '6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-glass)',
            color: '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <option value="yolo_nano">YOLOv8 Nano (Fastest Obstacles)</option>
          <option value="mobilenet_ssd">MobileNetV3 SSD (General Object Detection)</option>
          <option value="depth_anything">DepthAnything-Lite (Monocular Depth Estimator)</option>
        </select>
      </div>

      {/* Optimization Toggles */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '3px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input 
            type="checkbox"
            checked={quantizedEnabled}
            onChange={(e) => setQuantizedEnabled(e.target.checked)}
            style={{ width: '14px', height: '14px', accentColor: 'var(--accent-cyan)' }}
          />
          <span style={{ fontFamily: 'monospace' }}>INT8 Quantization (Quantized)</span>
        </label>
      </div>

      {/* Frame Skipping slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
          <label style={{ color: '#9ca3af' }}>Frame Inference Interval:</label>
          <span style={{ color: 'var(--accent-cyan)' }}>Every {frameSkipRate} frames</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="5" 
          value={frameSkipRate}
          onChange={(e) => setFrameSkipRate(parseInt(e.target.value))}
          style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', outline: 'none', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '0.65rem', color: '#6b7280', fontFamily: 'monospace' }}>
          Increases inference speed by {frameSkipRate > 1 ? `${(frameSkipRate - 1) * 100}%` : '0%'} using optical flow tracking cache.
        </span>
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />

      {/* Accessibility Configs */}
      <h4 style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontFamily: 'monospace' }}>
        SPEECH CUES & LOW-VISION MODES
      </h4>

      {/* Low Vision Mode Theme Switcher */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input 
            type="checkbox"
            checked={lowVisionTheme}
            onChange={(e) => {
              setLowVisionTheme(e.target.checked);
              if (e.target.checked) {
                document.body.classList.add('high-contrast');
              } else {
                document.body.classList.remove('high-contrast');
              }
            }}
            style={{ width: '14px', height: '14px', accentColor: 'var(--accent-indigo)' }}
          />
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>Yellow/Black High Contrast</span>
        </label>
      </div>

      {/* Volume slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
          <label style={{ color: '#9ca3af' }}>Voice Alert Volume:</label>
          <span style={{ color: 'var(--accent-indigo)' }}>{Math.round(voiceVolume * 100)}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={voiceVolume}
          onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
          style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', outline: 'none', cursor: 'pointer' }}
        />
      </div>

      {/* Speech speed rate slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
          <label style={{ color: '#9ca3af' }}>Speech Synthesis Speed:</label>
          <span style={{ color: 'var(--accent-indigo)' }}>{voiceRate}x</span>
        </div>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1" 
          value={voiceRate}
          onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
          style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', outline: 'none', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};
