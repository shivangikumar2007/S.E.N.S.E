import React, { useState } from 'react';
import { ANOMALY_PRESETS, AnomalyPreset } from '../services/telemetryEngine';
import {
  X,
  Droplets,
  Zap,
  Wind,
  ShieldAlert,
  RefreshCw,
  Sliders,
  Sparkles,
  Bot,
} from 'lucide-react';

interface AnomalyTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: AnomalyPreset) => void;
  onInjectCustom: (floor: number, powerKW: number, waterLpm: number, title: string) => void;
  onResetBaseline: () => void;
}

export const AnomalyTriggerModal: React.FC<AnomalyTriggerModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
  onInjectCustom,
  onResetBaseline,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'water' | 'energy' | 'air'>('all');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  // Custom anomaly builder state
  const [customFloor, setCustomFloor] = useState(3);
  const [customPowerKW, setCustomPowerKW] = useState(25);
  const [customWaterLpm, setCustomWaterLpm] = useState(35);
  const [customTitle, setCustomTitle] = useState('Custom High Flow & Power Surge');

  if (!isOpen) return null;

  const filteredPresets = ANOMALY_PRESETS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'water':
        return <Droplets size={18} color="var(--accent-blue)" />;
      case 'energy':
        return <Zap size={18} color="var(--accent-amber)" />;
      case 'air':
        return <Wind size={18} color="var(--accent-emerald)" />;
      default:
        return <ShieldAlert size={18} color="var(--accent-rose)" />;
    }
  };

  const handleApplyCustom = () => {
    onInjectCustom(customFloor, customPowerKW, customWaterLpm, customTitle);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #b47a62, #8b6545)',
                color: '#fff',
                padding: 7,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Telemetry Anomaly Injection Console</h3>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Gemini Telemetry Simulator · 8+ Real-world Fault Modes & Custom Event Generator
              </div>
            </div>
          </div>

          <button
            id="btn-close-modal"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action bar with Category Pills and Custom Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-pill)' }}>
            <button
              className={`panel-btn ${activeCategory === 'all' && !showCustomBuilder ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('all');
                setShowCustomBuilder(false);
              }}
            >
              All Scenarios ({ANOMALY_PRESETS.length})
            </button>
            <button
              className={`panel-btn ${activeCategory === 'water' && !showCustomBuilder ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('water');
                setShowCustomBuilder(false);
              }}
            >
              Water Leaks
            </button>
            <button
              className={`panel-btn ${activeCategory === 'energy' && !showCustomBuilder ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('energy');
                setShowCustomBuilder(false);
              }}
            >
              Energy Surges
            </button>
            <button
              className={`panel-btn ${activeCategory === 'air' && !showCustomBuilder ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('air');
                setShowCustomBuilder(false);
              }}
            >
              Air & Climate
            </button>
          </div>

          <button
            id="btn-toggle-custom"
            className="panel-btn"
            style={{
              borderColor: showCustomBuilder ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              color: showCustomBuilder ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => setShowCustomBuilder(!showCustomBuilder)}
          >
            <Sliders size={13} />
            {showCustomBuilder ? 'Preset Library' : 'Custom Builder'}
          </button>
        </div>

        {/* Custom Builder Mode */}
        {showCustomBuilder ? (
          <div
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 14, textTransform: 'uppercase' }}>
              Custom Telemetry Anomaly Generator
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Anomaly Description / Incident Name
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
              {/* Floor Selection */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Target Floor
                </label>
                <select
                  value={customFloor}
                  onChange={(e) => setCustomFloor(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: 12,
                  }}
                >
                  <option value={1} style={{ background: '#2d241d' }}>Floor 1 (Commercial)</option>
                  <option value={2} style={{ background: '#2d241d' }}>Floor 2 (Residential)</option>
                  <option value={3} style={{ background: '#2d241d' }}>Floor 3 (Residential)</option>
                  <option value={4} style={{ background: '#2d241d' }}>Floor 4 (Penthouse)</option>
                </select>
              </div>

              {/* Power Draw Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>Spike Power</span>
                  <strong style={{ color: 'var(--accent-amber)' }}>{customPowerKW} kW</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={customPowerKW}
                  onChange={(e) => setCustomPowerKW(parseInt(e.target.value, 10))}
                  className="slider-input"
                  style={{ accentColor: 'var(--accent-amber)' }}
                />
              </div>

              {/* Water Flow Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>Water Flow</span>
                  <strong style={{ color: 'var(--accent-blue)' }}>{customWaterLpm} L/min</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="1"
                  value={customWaterLpm}
                  onChange={(e) => setCustomWaterLpm(parseInt(e.target.value, 10))}
                  className="slider-input"
                  style={{ accentColor: 'var(--accent-blue)' }}
                />
              </div>
            </div>

            <button
              id="btn-inject-custom"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleApplyCustom}
            >
              <Sparkles size={14} />
              Inject Custom Fault into Live L1 Stream
            </button>
          </div>
        ) : (
          /* Presets List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {filteredPresets.map((preset) => {
              const isCrit = preset.severity === 'critical';
              const isWarn = preset.severity === 'warning';

              return (
                <div
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  className="floor-slice"
                  onClick={() => {
                    onApplyPreset(preset);
                    onClose();
                  }}
                  style={{
                    padding: '12px 16px',
                    borderColor: isCrit
                      ? 'rgba(244, 63, 94, 0.35)'
                      : isWarn
                      ? 'rgba(245, 158, 11, 0.35)'
                      : 'rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        padding: 8,
                        borderRadius: 'var(--radius-sm)',
                        background: isCrit
                          ? 'rgba(244, 63, 94, 0.15)'
                          : isWarn
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(56, 189, 248, 0.15)',
                      }}
                    >
                      {getCategoryIcon(preset.category)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{preset.name}</span>
                        <span
                          style={{
                            fontSize: 9,
                            fontFamily: 'var(--font-mono)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-pill)',
                            background: isCrit
                              ? 'rgba(244, 63, 94, 0.2)'
                              : isWarn
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(56, 189, 248, 0.2)',
                            color: isCrit ? 'var(--accent-rose)' : isWarn ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {preset.severity} · Floor {preset.targetFloor}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {preset.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                      {preset.potentialSavings.split('(')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reset Baseline Action */}
        <button
          id="btn-reset-baseline-modal"
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => {
            onResetBaseline();
            onClose();
          }}
        >
          <RefreshCw size={14} />
          Reset All Building Systems to Healthy Baseline
        </button>
      </div>
    </div>
  );
};
