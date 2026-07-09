import React from 'react';
import type { LocationGPS } from '../hooks/useSensorFusion';

interface EmergencySOSProps {
  gps: LocationGPS;
  isAlerting: boolean;
  countdown: number;
  triggerSimulatedFall: () => void;
  dismissFallAlert: () => void;
  sosBroadcastActive: boolean;
  setSosBroadcastActive: (a: boolean) => void;
}

export const EmergencySOS: React.FC<EmergencySOSProps> = ({
  gps,
  isAlerting,
  countdown,
  triggerSimulatedFall,
  dismissFallAlert,
  sosBroadcastActive,
  setSosBroadcastActive
}) => {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
          EMERGENCY ASSISTANCE SYSTEM
        </h3>
        {sosBroadcastActive && (
          <span className="status-badge status-badge-danger pulsing-alert-glow">
            SOS ACTIVE
          </span>
        )}
      </div>

      {/* Flashing countdown interface during simulated fall alert */}
      {isAlerting && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid var(--color-danger)',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
          animation: 'pulse-ring 1.5s infinite ease-in-out'
        }}>
          <h4 style={{ color: 'var(--color-danger)', fontSize: '0.9rem', marginBottom: '4px', fontFamily: 'monospace' }}>
            FALL DETECTED / IMPACT DETECTED
          </h4>
          <p style={{ fontSize: '0.75rem', color: '#f3f4f6', marginBottom: '8px' }}>
            Broadcasting SOS coordinates in <strong style={{ fontSize: '1.2rem', color: 'var(--color-danger)', fontFamily: 'monospace' }}>{countdown}</strong> seconds.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button 
              onClick={dismissFallAlert}
              style={{
                padding: '6px 12px',
                background: 'var(--color-safe)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              DISMISS (I am safe)
            </button>
          </div>
        </div>
      )}

      {/* SOS manual controls and GPS broadcasting */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setSosBroadcastActive(!sosBroadcastActive)}
          style={{
            flex: 1,
            padding: '8px',
            background: sosBroadcastActive ? '#374151' : 'var(--color-danger)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            textAlign: 'center',
            boxShadow: sosBroadcastActive ? 'none' : '0 0 10px rgba(239, 68, 68, 0.4)'
          }}
        >
          {sosBroadcastActive ? 'CANCEL ACTIVE SOS' : 'MANUAL SOS (ONE-TOUCH)'}
        </button>

        <button
          onClick={triggerSimulatedFall}
          disabled={isAlerting}
          style={{
            flex: 1,
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            color: '#9ca3af',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}
        >
          SIMULATE IMU FALL
        </button>
      </div>

      {/* GPS Coordinate broadcast summary */}
      {sosBroadcastActive && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '0.75rem',
          fontFamily: 'monospace'
        }}>
          <p style={{ color: 'var(--color-danger)', fontWeight: 'bold', marginBottom: '3px' }}>
            BROADCASTING LOCALIZATION DATA:
          </p>
          <p>Coordinates: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</p>
          <p>Emergency URL: maps.google.com/?q={gps.lat},{gps.lng}</p>
          <p style={{ color: '#9ca3af', marginTop: '3px' }}>Status: SMS/Email Sent to Emergency Contacts.</p>
        </div>
      )}

      {/* Emergency Contacts */}
      <div style={{ fontSize: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginBottom: '4px', fontFamily: 'monospace' }}>
          CONTACT NOTIFICATION TREE:
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px' }}>
            <span>Primary Caregiver (Sarah Doe)</span>
            <span style={{ color: '#06b6d4' }}>+1 (555) 019-2831</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px' }}>
            <span>Emergency Services (911 dispatcher)</span>
            <span style={{ color: '#ef4444' }}>Priority Broadcast</span>
          </div>
        </div>
      </div>
    </div>
  );
};
