import React from 'react';
import type { SpeechLog } from '../hooks/useVoiceAssistant';

interface VoiceAssistantProps {
  isListening: boolean;
  speechLogs: SpeechLog[];
  startListening: () => void;
  stopListening: () => void;
  recognitionAvailable: boolean;
  onSimulateCommand: (cmd: string) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isListening,
  speechLogs,
  startListening,
  stopListening,
  recognitionAvailable,
  onSimulateCommand
}) => {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
          VOICE ASSISTANCE LAYER
        </h3>
        
        {/* Dynamic Voice Waves */}
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="voice-bar"></span>
            <span className="voice-bar"></span>
            <span className="voice-bar"></span>
            <span className="voice-bar"></span>
            <span className="voice-bar"></span>
            <span className="voice-bar"></span>
          </div>
        )}
      </div>

      {/* Manual microphone button */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={isListening ? stopListening : startListening}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: isListening ? 'var(--color-danger)' : 'var(--accent-indigo)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            boxShadow: isListening ? 'none' : 'var(--glow-indigo)'
          }}
        >
          {isListening ? 'STOP LISTENING' : 'ACTIVATE VOICE COMMANDS'}
        </button>
      </div>

      {!recognitionAvailable && (
        <span style={{ fontSize: '0.65rem', color: '#ef4444', fontFamily: 'monospace', textAlign: 'center' }}>
          Voice Dictation unavailable (HTTPS required in some browsers). Use shortcuts below.
        </span>
      )}

      {/* Click shortcuts to make testing easy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontFamily: 'monospace' }}>
          SIMULATOR SHORTCUT CUES:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <button 
            onClick={() => onSimulateCommand('Guide me home')}
            className="tab-btn" 
            style={{ fontSize: '0.7rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)' }}
          >
            "Guide me home"
          </button>
          <button 
            onClick={() => onSimulateCommand('Find nearest entrance')}
            className="tab-btn" 
            style={{ fontSize: '0.7rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)' }}
          >
            "Find entrance"
          </button>
          <button 
            onClick={() => onSimulateCommand('Avoid stairs')}
            className="tab-btn" 
            style={{ fontSize: '0.7rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)' }}
          >
            "Avoid stairs"
          </button>
          <button 
            onClick={() => onSimulateCommand('Take safest route')}
            className="tab-btn" 
            style={{ fontSize: '0.7rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)' }}
          >
            "Take safest route"
          </button>
        </div>
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />

      {/* Speech dialogue log history */}
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        maxHeight: '140px',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '6px',
        background: 'rgba(0,0,0,0.2)',
        padding: '6px',
        borderRadius: '4px',
        border: '1px solid var(--border-glass)'
      }}>
        {speechLogs.length === 0 ? (
          <span style={{ fontSize: '0.7rem', color: '#6b7280', textAlign: 'center', margin: 'auto 0', fontFamily: 'monospace' }}>
            Awaiting voice inputs or system alerts...
          </span>
        ) : (
          speechLogs.map(log => (
            <div 
              key={log.id} 
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                padding: '4px 6px',
                borderRadius: '4px',
                alignSelf: log.sender === 'user' ? 'flex-end' : 'flex-start',
                background: log.sender === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(6,182,212,0.1)',
                borderLeft: log.sender === 'user' ? 'none' : '2px solid var(--accent-cyan)',
                borderRight: log.sender === 'user' ? '2px solid var(--accent-indigo)' : 'none',
                maxWidth: '85%'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.6rem', color: '#9ca3af', marginBottom: '2px' }}>
                <span>{log.sender === 'user' ? 'USER VOICE' : 'SPATIAL CUE'}</span>
                <span>{log.timestamp}</span>
              </div>
              <p style={{ color: '#fff' }}>{log.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
