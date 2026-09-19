import React, { useState } from 'react';
import { FloorZone, UserRole } from '../types/sense';
import {
  Zap,
  Droplets,
  Power,
  CheckCircle,
  AlertOctagon,
} from 'lucide-react';

interface ControlsViewProps {
  userRole: UserRole;
  zones: FloorZone[];
  onToggleBreaker: (floorId: string) => void;
  onToggleValve: (floorId: string) => void;
}

export const ControlsView: React.FC<ControlsViewProps> = ({
  userRole,
  zones,
  onToggleBreaker,
  onToggleValve,
}) => {
  const isUser = userRole === 'user';
  const displayZones = isUser ? zones.filter((z) => z.floor === 4) : zones;

  const [emergencyIsolation, setEmergencyIsolation] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleBreaker = (floorId: string, name: string) => {
    if (isUser) return;
    onToggleBreaker(floorId);
    triggerToast(`Breaker state toggled for ${name}. Signal delivered to local Edge Node.`);
  };

  const handleValve = (floorId: string, name: string) => {
    if (isUser) return;
    onToggleValve(floorId);
    triggerToast(`Solenoid valve state toggled for ${name}. Physical actuator engaged.`);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Actuator & Breaker Control Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Direct hardware command dispatch. Overrides transmitted directly to the local edge node gateway.
          </p>
        </div>

        {/* Emergency Kill Switch (Administrator and Owner only) */}
        {!isUser && (
          <button
            id="btn-emergency-kill"
            className="btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => {
              setEmergencyIsolation(!emergencyIsolation);
              triggerToast(emergencyIsolation ? 'Emergency isolation disengaged.' : 'CRITICAL: Building-wide emergency isolation engaged.');
            }}
          >
            <AlertOctagon size={16} />
            {emergencyIsolation ? 'Disengage Emergency Isolation' : 'Emergency Main Cutoff'}
          </button>
        )}
      </div>

      {successToast && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid var(--accent-cyan)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--accent-cyan)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Grid of Actuators */}
      <div className="controls-grid">
        {displayZones.map((zone) => {
          const isBreakerOn = zone.breakerStatus === 'on' && !emergencyIsolation;
          const isValveOpen = zone.valveStatus === 'open' && !emergencyIsolation;

          return (
            <div key={zone.id} className="control-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{zone.name}</h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      background: 'rgba(255,255,255,0.06)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Floor {zone.floor} Gateway
                  </span>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Active Load: <strong>{zone.powerDrawKW} kW</strong> · Water Flow:{' '}
                  <strong style={{ color: zone.waterFlowLpm > 20 ? 'var(--accent-amber)' : 'inherit' }}>
                    {zone.waterFlowLpm} L/min
                  </strong>
                </div>

                {/* Circuit Breaker Row */}
                <div className="control-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 'var(--radius-sm)',
                        background: isBreakerOn ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: isBreakerOn ? 'var(--accent-cyan)' : 'var(--accent-rose)',
                      }}
                    >
                      <Zap size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Power Sub-Panel Breaker</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Status: {isBreakerOn ? 'ENERGIZED' : 'OPEN / ISOLATED'}
                      </div>
                    </div>
                  </div>

                  <button
                    id={`toggle-breaker-${zone.id}`}
                    className={`panel-btn ${isBreakerOn ? 'active' : ''}`}
                    onClick={() => handleBreaker(zone.id, zone.name)}
                    disabled={isUser}
                    title={isUser ? 'View-only access' : undefined}
                    style={{
                      background: isBreakerOn ? 'rgba(56, 189, 248, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                      color: isBreakerOn ? 'var(--accent-cyan)' : 'var(--accent-rose)',
                      borderColor: isBreakerOn ? 'rgba(56, 189, 248, 0.4)' : 'rgba(244, 63, 94, 0.4)',
                    }}
                  >
                    {isUser ? 'View Only' : isBreakerOn ? 'Turn Off' : 'Turn On'}
                  </button>
                </div>

                {/* Smart Water Valve Row */}
                <div className="control-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 'var(--radius-sm)',
                        background: isValveOpen ? 'rgba(59, 130, 246, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: isValveOpen ? 'var(--accent-blue)' : 'var(--accent-rose)',
                      }}
                    >
                      <Droplets size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Solenoid Shutoff Valve</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Status: {isValveOpen ? 'OPEN (FLOWING)' : 'SHUT / RESTRICTED'}
                      </div>
                    </div>
                  </div>

                  <button
                    id={`toggle-valve-${zone.id}`}
                    className={`panel-btn ${isValveOpen ? 'active' : ''}`}
                    onClick={() => handleValve(zone.id, zone.name)}
                    disabled={isUser}
                    title={isUser ? 'View-only access' : undefined}
                    style={{
                      background: isValveOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                      color: isValveOpen ? 'var(--accent-blue)' : 'var(--accent-rose)',
                      borderColor: isValveOpen ? 'rgba(59, 130, 246, 0.4)' : 'rgba(244, 63, 94, 0.4)',
                    }}
                  >
                    {isUser ? 'View Only' : isValveOpen ? 'Close Valve' : 'Open Valve'}
                  </button>
                </div>

                {/* HVAC Thermal Target */}
                <div className="control-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--accent-emerald)',
                      }}
                    >
                      <Power size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Thermostat Setpoint</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Target: {zone.targetTempC}°C · Current: {zone.temperatureC}°C
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--accent-emerald)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {zone.hvacStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
