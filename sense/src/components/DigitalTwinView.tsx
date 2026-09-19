import React, { useState, useEffect } from 'react';
import { AnomalyAlert, FloorZone, WhatIfScenario, UserRole } from '../types/sense';
import { runWhatIfSimulation } from '../services/digitalTwin';
import {
  Layers,
  Thermometer,
  Droplets,
  Zap,
  Play,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Sun,
  ShieldCheck,
  RotateCcw,
  Radio,
} from 'lucide-react';

interface DigitalTwinViewProps {
  userRole: UserRole;
  zones: FloorZone[];
  alerts: AnomalyAlert[];
  selectedFloor: number;
  setSelectedFloor: (floor: number) => void;
  onApplyChanges: (scenario: WhatIfScenario, targetFloor: number) => void;
  onLiveSyncScenario?: (scenario: WhatIfScenario, targetFloor: number) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  userRole,
  zones,
  alerts,
  selectedFloor,
  setSelectedFloor,
  onApplyChanges,
  onLiveSyncScenario,
}) => {
  const isReadOnly = userRole === 'user';
  const activeZone = zones.find((z) => z.floor === selectedFloor) || zones[0];
  const [scenarioFloor, setScenarioFloor] = useState(selectedFloor);

  const [scenario, setScenario] = useState<WhatIfScenario>({
    targetTempC: activeZone.targetTempC || 23.0,
    tempSetpointDelta: (activeZone.targetTempC || 23.0) - 22.0,
    waterValveThrottlePct: selectedFloor === 3 ? 40 : 0,
    solarBatteryContributionKW: 45,
    peakTariffMode: true,
    livePlatformSync: true, // Interacts with main platform in real-time
  });

  const [appliedNotice, setAppliedNotice] = useState(false);

  // When floor changes, sync target temperature to that floor.
  // Clamp to actuator limits [15, 50] so the slider thumb stays in range
  // even if the zone received an out-of-bounds value (e.g. from anomaly injection).
  useEffect(() => {
    setScenarioFloor(selectedFloor);
    const clampedTemp = Math.max(15, Math.min(50, activeZone.targetTempC));
    setScenario((prev) => ({
      ...prev,
      targetTempC: clampedTemp,
      tempSetpointDelta: Math.round((clampedTemp - 22.0) * 10) / 10,
    }));
  }, [selectedFloor, activeZone.targetTempC]);

  // Live platform interaction: whenever scenario changes and livePlatformSync is true, broadcast to main platform!
  useEffect(() => {
    // Switching floors first renders the previous scenario. Wait until that
    // scenario is re-bound to the newly selected floor before synchronizing.
    if (!isReadOnly && scenarioFloor === selectedFloor && scenario.livePlatformSync && onLiveSyncScenario) {
      onLiveSyncScenario(scenario, selectedFloor);
    }
  }, [scenario, scenarioFloor, selectedFloor, isReadOnly, onLiveSyncScenario]);

  const simResult = runWhatIfSimulation(scenario, zones);

  const handleTempChange = (newTemp: number) => {
    if (isReadOnly) return;
    // Clamp to declared actuator limits so the scenario value always stays
    // within the physical range the slider advertises (15 – 50 °C).
    const clampedTemp = Math.max(15, Math.min(50, newTemp));
    const delta = Math.round((clampedTemp - 22.0) * 10) / 10;
    setScenario({
      ...scenario,
      targetTempC: clampedTemp,
      tempSetpointDelta: delta,
    });
  };

  const handleApply = () => {
    if (isReadOnly) return;
    onApplyChanges(scenario, selectedFloor);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 4000);
  };

  const handleReset = () => {
    if (isReadOnly) return;
    // Restore the floor's actual HVAC setpoint (clamped to actuator limits)
    // instead of always snapping back to the hard-coded 22°C baseline.
    const clampedTemp = Math.max(15, Math.min(50, activeZone.targetTempC));
    setScenario({
      targetTempC: clampedTemp,
      tempSetpointDelta: Math.round((clampedTemp - 22.0) * 10) / 10,
      waterValveThrottlePct: 0,
      solarBatteryContributionKW: 0,
      peakTariffMode: false,
      livePlatformSync: true,
    });
  };

  return (
    <div>
      {/* Top Title Banner */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Digital Twin Simulation Sandbox</h2>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                background: 'rgba(0, 242, 254, 0.1)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Interactive Physics Model v3.0
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Pre-deployment verification engine with continuous two-way interaction with the live building platform.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live Platform Interaction Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: scenario.livePlatformSync ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${scenario.livePlatformSync ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 12,
              color: scenario.livePlatformSync ? 'var(--accent-emerald)' : 'var(--text-muted)',
            }}
          >
            <Radio size={14} className={scenario.livePlatformSync ? 'edge-pulse' : ''} />
            <span>Live Platform Interaction: <strong>{scenario.livePlatformSync ? 'ACTIVE' : 'OFFLINE'}</strong></span>
            <label className="toggle-switch" style={{ width: 34, height: 18, marginLeft: 4 }}>
              <input
                id="toggle-live-sync"
                type="checkbox"
                checked={scenario.livePlatformSync}
                disabled={isReadOnly}
                onChange={(e) => setScenario({ ...scenario, livePlatformSync: e.target.checked })}
              />
              <span className="toggle-slider" style={{ borderRadius: 18 }}></span>
            </label>
          </div>

          <button id="btn-reset-sim" className="panel-btn" onClick={handleReset} disabled={isReadOnly}>
            <RotateCcw size={13} style={{ display: 'inline', marginRight: 4 }} />
            Reset
          </button>
        </div>
      </div>

      {appliedNotice && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--accent-emerald)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--accent-emerald)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} />
          <span>
            Simulation settings committed! Actuator commands broadcasted to live Gateway for Floor {selectedFloor} and reflected across the entire platform.
          </span>
        </div>
      )}

      {/* Main Grid: Building Model vs Simulation Controls */}
      <div className="twin-container">
        {/* Left Column: Interactive Building Stack Visualizer */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Layers size={18} color="var(--accent-cyan)" />
              Building Spatial Model
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click floor to select zone</span>
          </div>

          <div className="building-stack">
            {/* Rooftop Solar & BESS Array badge */}
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(2, 132, 199, 0.15))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-amber)', fontWeight: 600 }}>
                <Sun size={16} />
                Rooftop Solar & Utility BESS (Up to 500 kW Injection)
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                {scenario.solarBatteryContributionKW} kW Dispatched
              </span>
            </div>

            {/* Slices for floors (4 down to 1) */}
            {[...zones].reverse().map((zone) => {
              const isSelected = zone.floor === selectedFloor;
              // Use live, unresolved alerts as the source of truth so resolved
              // anomalies immediately disappear from their floor.
              const floorAlerts = alerts.filter((alert) => alert.floor === zone.floor && !alert.resolved);
              const hasAlert = floorAlerts.length > 0;

              return (
                <div
                  key={zone.id}
                  id={`floor-slice-${zone.floor}`}
                  className={`floor-slice ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedFloor(zone.floor)}
                  style={{
                    borderColor: hasAlert ? 'rgba(245, 158, 11, 0.6)' : undefined,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: hasAlert ? 10 : 0,
                  }}
                >
                  {floorAlerts.map((alert) => {
                    const accentColor = alert.severity === 'critical'
                      ? 'var(--accent-rose)'
                      : alert.severity === 'warning'
                        ? 'var(--accent-amber)'
                        : 'var(--accent-cyan)';
                    const background = alert.severity === 'critical'
                      ? 'rgba(244, 63, 94, 0.14)'
                      : alert.severity === 'warning'
                        ? 'rgba(245, 158, 11, 0.14)'
                        : 'rgba(0, 242, 254, 0.1)';

                    return (
                      <div
                        key={alert.id}
                        role="alert"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 9px',
                          borderRadius: 'var(--radius-sm)',
                          background,
                          border: `1px solid ${accentColor}`,
                          color: accentColor,
                          fontSize: 11,
                        }}
                      >
                        <AlertTriangle size={14} aria-hidden="true" />
                        <span><strong>{alert.title}</strong>{alert.description ? ` — ${alert.description}` : ''}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      className="floor-badge"
                      style={{
                        background: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#000' : '#fff',
                      }}
                    >
                      L{zone.floor}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{zone.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {zone.occupants} Occupants · Area: {zone.areaSqM} m²
                      </div>
                    </div>
                  </div>

                  <div className="floor-metrics-row">
                    <span className="floor-metric-tag" title="Temperature">
                      <Thermometer size={13} color="var(--accent-amber)" />
                      {zone.temperatureC}°C
                    </span>
                    <span className="floor-metric-tag" title="Power Draw">
                      <Zap size={13} color="var(--accent-cyan)" />
                      {zone.powerDrawKW} kW
                    </span>
                    <span
                      className="floor-metric-tag"
                      title="Water Flow"
                      style={{ color: hasAlert ? 'var(--accent-rose)' : 'var(--text-secondary)' }}
                    >
                      <Droplets size={13} color={hasAlert ? 'var(--accent-rose)' : 'var(--accent-blue)'} />
                      {zone.waterFlowLpm} L/m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Zone Deep Dive */}
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', marginBottom: 8 }}>
              Selected Zone Telemetry: {activeZone.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>HVAC Setpoint:</span>{' '}
                <strong style={{ color: '#fff' }}>{activeZone.targetTempC}°C</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Water Valve:</span>{' '}
                <strong style={{ color: activeZone.valveStatus === 'closed' ? 'var(--accent-rose)' : activeZone.valveStatus === 'throttled' ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                  {activeZone.valveStatus.toUpperCase()}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Breaker:</span>{' '}
                <strong style={{ color: activeZone.breakerStatus === 'on' ? 'var(--accent-cyan)' : 'var(--accent-rose)' }}>
                  {activeZone.breakerStatus.toUpperCase()}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: What-If Scenario Sandbox */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Sliders size={18} color="var(--accent-cyan)" />
              What-If Parameters & Actuator Limits
            </div>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--accent-emerald)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isReadOnly ? 'Read-only' : 'Interactive Controls'}
            </span>
          </div>

          {/* Control 1: Temperature Bar (Increased Range to 50°C) */}
          <div className="sandbox-control-group">
            <div className="sandbox-control-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Thermometer size={15} color="var(--accent-amber)" />
                Target Temperature (Floor {selectedFloor})
              </span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: scenario.targetTempC > 35 ? 'var(--accent-rose)' : 'var(--accent-cyan)', fontSize: 14 }}>
                {scenario.targetTempC}°C{' '}
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ({scenario.tempSetpointDelta >= 0 ? `+${scenario.tempSetpointDelta}` : scenario.tempSetpointDelta}°C vs 22°C baseline)
                </span>
              </strong>
            </div>
            <input
              id="slider-temp-50c"
              type="range"
              min="15"
              max="50"
              step="0.5"
              value={scenario.targetTempC}
              disabled={isReadOnly}
              onChange={(e) => handleTempChange(parseFloat(e.target.value))}
              className="slider-input"
              style={{
                accentColor: scenario.targetTempC > 35 ? 'var(--accent-rose)' : 'var(--accent-cyan)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>15.0°C (Deep Chill)</span>
              <span>22.0°C (Comfort Baseline)</span>
              <span>35.0°C (Eco Float)</span>
              <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>50.0°C (Max Industrial)</span>
            </div>
          </div>

          {/* Control 2: Solenoid Valve Throttling (Increased Range to 100%) */}
          <div className="sandbox-control-group">
            <div className="sandbox-control-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Droplets size={15} color="var(--accent-blue)" />
                Solenoid Valve Throttling (Floor {selectedFloor})
              </span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: scenario.waterValveThrottlePct === 100 ? 'var(--accent-rose)' : 'var(--accent-blue)', fontSize: 14 }}>
                {scenario.waterValveThrottlePct}% {scenario.waterValveThrottlePct === 100 ? '(TOTAL SHUTOFF)' : 'Throttled'}
              </strong>
            </div>
            <input
              id="slider-valve-throttle-100"
              type="range"
              min="0"
              max="100"
              step="1"
              value={scenario.waterValveThrottlePct}
              disabled={isReadOnly}
              onChange={(e) => setScenario({ ...scenario, waterValveThrottlePct: parseInt(e.target.value, 10) })}
              className="slider-input"
              style={{
                accentColor: scenario.waterValveThrottlePct === 100 ? 'var(--accent-rose)' : 'var(--accent-blue)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0% (Full Flow)</span>
              <span>50% (Half Pressure)</span>
              <span>80% (Restrictor)</span>
              <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>100% (Complete Isolation)</span>
            </div>
          </div>

          {/* Control 3: Solar BESS Battery Injection (Increased Range to 500 kW) */}
          <div className="sandbox-control-group">
            <div className="sandbox-control-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sun size={15} color="var(--accent-amber)" />
                Solar BESS Battery Injection
              </span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontSize: 14 }}>
                {scenario.solarBatteryContributionKW} kW Utility Power
              </strong>
            </div>
            <input
              id="slider-solar-dispatch-500kw"
              type="range"
              min="0"
              max="500"
              step="5"
              value={scenario.solarBatteryContributionKW}
              disabled={isReadOnly}
              onChange={(e) => setScenario({ ...scenario, solarBatteryContributionKW: parseInt(e.target.value, 10) })}
              className="slider-input"
              style={{ accentColor: 'var(--accent-amber)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0 kW</span>
              <span>125 kW</span>
              <span>250 kW</span>
              <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>500 kW (Max BESS)</span>
            </div>
          </div>

          {/* Control 4: Peak Tariff Mode */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.04)',
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Peak-Tariff Demand Response</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Auto-curtail non-essential circuits when grid spot price quadruples
              </div>
            </div>
            <label className="toggle-switch">
              <input
                id="toggle-peak-tariff"
                type="checkbox"
                checked={scenario.peakTariffMode}
                disabled={isReadOnly}
                onChange={(e) => setScenario({ ...scenario, peakTariffMode: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Projected Simulation Results */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
              Projected 24H Simulation Impact
            </div>

            <div className="impact-preview-grid">
              <div className="impact-chip">
                <div className="impact-chip-label">Cost Reduction</div>
                <div className="impact-chip-val" style={{ color: 'var(--accent-emerald)' }}>
                  -{simResult.projectedCostSavingsPct}%
                </div>
              </div>

              <div className="impact-chip">
                <div className="impact-chip-label">Energy Avoided</div>
                <div className="impact-chip-val" style={{ color: 'var(--accent-cyan)' }}>
                  {simResult.projectedEnergyReductionKWh} kWh
                </div>
              </div>

              <div className="impact-chip">
                <div className="impact-chip-label">Water Conserved</div>
                <div className="impact-chip-val" style={{ color: 'var(--accent-blue)' }}>
                  {simResult.projectedWaterSavedKL} kL
                </div>
              </div>

              <div className="impact-chip">
                <div className="impact-chip-label">Comfort Index</div>
                <div
                  className="impact-chip-val"
                  style={{
                    color: simResult.comfortImpactScore >= 70 ? 'var(--accent-emerald)' : simResult.comfortImpactScore >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                  }}
                >
                  {simResult.comfortImpactScore} / 100
                </div>
              </div>
            </div>

            {/* Recommendation note */}
            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: simResult.feasible ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${simResult.feasible ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                fontSize: 12,
                color: simResult.feasible ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {simResult.feasible ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
              <span>{simResult.recommendation}</span>
            </div>

            {/* Action button */}
            <button
              id="btn-apply-simulation"
              className="btn-primary"
              style={{ width: '100%', marginTop: 18, justifyContent: 'center' }}
              onClick={handleApply}
              disabled={isReadOnly}
              title={isReadOnly ? 'View-only access' : undefined}
            >
              <Play size={14} />
              Deploy Validated Settings to Physical Actuators
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
