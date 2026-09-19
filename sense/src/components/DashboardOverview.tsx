import React, { useState } from 'react';
import { UserRole, FloorZone, AnomalyAlert, TabView } from '../types/sense';
import { computeBuildingMetrics } from '../services/telemetryEngine';
import {
  Zap,
  Droplets,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Wind,
  Users,
  ShieldAlert,
  CheckCircle2,
  Maximize2,
  Sun,
} from 'lucide-react';

interface DashboardOverviewProps {
  userRole: UserRole;
  zones: FloorZone[];
  alerts: AnomalyAlert[];
  history24h: Array<{
    hour: string;
    energyKW: number;
    waterFlowLpm: number;
    baselineKW: number;
    costRate: number;
  }>;
  solarBessOffsetKW?: number;
  setCurrentTab: (tab: TabView) => void;
  setSelectedFloorForTwin: (floor: number) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  userRole,
  zones,
  alerts,
  history24h,
  solarBessOffsetKW = 0,
  setCurrentTab,
  setSelectedFloorForTwin,
}) => {
  const [chartMetric, setChartMetric] = useState<'energy' | 'water'>('energy');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);

  // Filter or scale based on RBAC
  const isUser = userRole === 'user';
  const isAdmin = userRole === 'administrator';
  const displayZones = isUser ? zones.filter((z) => z.floor === 4) : zones;

  // DYNAMIC COMPUTATION FROM LIVE ZONES & ACTUATORS
  const buildingMetrics = computeBuildingMetrics(displayZones, isUser ? 0 : solarBessOffsetKW);

  const totalPower = buildingMetrics.netGridPowerKW;
  const totalWater = buildingMetrics.totalWaterLpm;
  const energyToday = buildingMetrics.energyTodayKWh;
  const waterUsageToday = buildingMetrics.waterUsageTodayKL;
  const healthScore = buildingMetrics.healthScore;
  const activeAlerts = isUser ? alerts.filter((a) => a.floor === 4 && !a.resolved) : alerts.filter((a) => !a.resolved);

  const primaryAlert = activeAlerts[0];

  const handleSimulateInTwin = (floor: number) => {
    setSelectedFloorForTwin(floor);
    setCurrentTab('digital_twin');
  };

  // SVG Chart calculation - binds current hour dynamically to live platform load
  const svgWidth = 800;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 25;

  const chartPoints = history24h.map((d, index) => {
    // If last point (current live hour), bind directly to live totalPower / totalWater!
    let liveVal = chartMetric === 'energy' ? (isUser ? d.energyKW * 0.15 : d.energyKW) : (isUser ? d.waterFlowLpm * 0.15 : d.waterFlowLpm);
    if (index === history24h.length - 1) {
      liveVal = chartMetric === 'energy' ? totalPower : totalWater;
    }

    const maxVal = chartMetric === 'energy' ? (isUser ? 15 : 90) : (isUser ? 8 : 50);
    const x = paddingX + (index / (history24h.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (Math.min(maxVal, Math.max(0, liveVal)) / maxVal) * (svgHeight - paddingY * 2);
    return { x, y, val: Math.round(liveVal * 10) / 10, hour: d.hour };
  });

  const pathD = chartPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${chartPoints[chartPoints.length - 1].x} ${svgHeight - paddingY} L ${chartPoints[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div>
      {/* Top Welcome & Context Banner */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isUser
                ? 'Unit 402 · Penthouse Suite'
                : isAdmin
                ? 'Central Command · Administrator Root Console'
                : 'Community Tower Alpha · Portfolio Overview'}
            </h2>
            {solarBessOffsetKW > 0 && !isUser && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-amber)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sun size={12} /> BESS Active: -{solarBessOffsetKW} kW
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            {isUser
              ? 'Resident view · Local edge telemetry isolated to Unit 402'
              : isAdmin
              ? 'Full root telemetry · 4 Floors · 24 Units · Direct Actuator Dispatch & Edge Diagnostic Mode'
              : 'Portfolio-wide telemetry · 4 Floors · 24 Units · Central HVAC & Solar Storage'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={14} color="var(--accent-cyan)" />
            {isUser ? '3 Occupants' : `${buildingMetrics.totalOccupants} Building Occupants`}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wind size={14} color="var(--accent-emerald)" />
            Avg AQI: {buildingMetrics.avgAqi} ({buildingMetrics.avgAqi >= 85 ? 'Good' : 'Moderate'})
          </span>
        </div>
      </div>

      {/* Edge Anomaly Alert Banner (Section 05 of S.E.N.S.E spec) */}
      {primaryAlert && (
        <div className="alert-banner" role="alert">
          <div className="alert-banner-content">
            <div className="alert-icon-wrap">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="alert-title">
                ⚠ Anomaly detected — {primaryAlert.title}
              </div>
              <div className="alert-desc">
                {primaryAlert.description} — <strong>Root cause:</strong> {primaryAlert.rootCause}
              </div>
            </div>
          </div>
          {!isUser && (
            <button
              id="btn-simulate-fix"
              className="alert-action-btn"
              onClick={() => handleSimulateInTwin(primaryAlert.floor)}
            >
              Simulate Fix in Digital Twin
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* 4 Load-Bearing Metric Cards (Dynamically responsive to Digital Twin and Actuators) */}
      <div className="metrics-grid">
        {/* Metric 1: Resource Health */}
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-label">Resource Health</span>
            <div className="health-ring-container">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="23" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  stroke={healthScore >= 80 ? 'var(--accent-emerald)' : healthScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)'}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="144.5"
                  strokeDashoffset={144.5 - (144.5 * healthScore) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 28 28)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: healthScore >= 80 ? 'var(--accent-emerald)' : healthScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                }}
              >
                {healthScore}
              </div>
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-val" style={{ color: healthScore >= 80 ? 'var(--accent-emerald)' : healthScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
              {healthScore}
            </span>
            <span className="metric-unit">/ 100</span>
          </div>
          <div className="metric-sub">
            <CheckCircle2 size={13} color={healthScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
            {healthScore >= 85
              ? 'Predictive efficiency optimal'
              : healthScore >= 70
              ? 'Hydraulic or thermal load active'
              : 'Critical deviation detected'}
          </div>
        </div>

        {/* Metric 2: Energy Today */}
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-label">Energy Today</span>
            <div className="metric-icon-box" style={{ color: 'var(--accent-cyan)' }}>
              <Zap size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-val" style={{ color: 'var(--accent-cyan)' }}>
              {energyToday}
            </span>
            <span className="metric-unit">kWh</span>
          </div>
          <div className="metric-sub">
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {totalPower} kW
            </span>{' '}
            live load {solarBessOffsetKW > 0 ? `(-${solarBessOffsetKW} kW BESS)` : '· Real-time'}
          </div>
        </div>

        {/* Metric 3: Water Usage */}
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-label">Water Usage</span>
            <div className="metric-icon-box" style={{ color: 'var(--accent-blue)' }}>
              <Droplets size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-val" style={{ color: 'var(--accent-blue)' }}>
              {waterUsageToday}
            </span>
            <span className="metric-unit">kL</span>
          </div>
          <div className="metric-sub">
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
              {totalWater} L/min
            </span>{' '}
            flow · {totalWater === 0 ? 'Valves Isolated' : totalWater > 30 ? 'Elevated Flow' : 'Normal'}
          </div>
        </div>

        {/* Metric 4: Active Alerts */}
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-label">Active Alerts</span>
            <div
              className="metric-icon-box"
              style={{
                color: activeAlerts.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                background: activeAlerts.length > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              }}
            >
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <span
              className="metric-val"
              style={{
                color: activeAlerts.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              }}
            >
              {activeAlerts.length}
            </span>
            <span className="metric-unit">unresolved</span>
          </div>
          <div className="metric-sub">
            {activeAlerts.length > 0 ? 'Edge AI flag pending mitigation' : 'All systems baseline stable'}
          </div>
        </div>
      </div>

      {/* 24H Live Consumption Trend & Building Zones Panel */}
      <div className="panels-grid">
        {/* Main Chart Panel */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <TrendingUp size={18} color="var(--accent-cyan)" />
              24H Live Consumption Trend
            </div>
            <div className="panel-actions">
              <button
                id="btn-metric-energy"
                className={`panel-btn ${chartMetric === 'energy' ? 'active' : ''}`}
                onClick={() => setChartMetric('energy')}
              >
                Electricity ({totalPower} kW)
              </button>
              <button
                id="btn-metric-water"
                className={`panel-btn ${chartMetric === 'water' ? 'active' : ''}`}
                onClick={() => setChartMetric('water')}
              >
                Water ({totalWater} L/m)
              </button>
            </div>
          </div>

          <div className="chart-container">
            <svg
              className="chart-svg"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={chartMetric === 'energy' ? 'rgba(0, 242, 254, 0.4)' : 'rgba(59, 130, 246, 0.4)'}
                  />
                  <stop
                    offset="100%"
                    stopColor={chartMetric === 'energy' ? 'rgba(0, 242, 254, 0.0)' : 'rgba(59, 130, 246, 0.0)'}
                  />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0.25, 0.5, 0.75].map((factor, i) => {
                const y = paddingY + factor * (svgHeight - paddingY * 2);
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Shaded Area */}
              <path d={areaD} fill="url(#chartGradient)" />

              {/* Main Trend Line */}
              <path
                d={pathD}
                fill="none"
                stroke={chartMetric === 'energy' ? 'var(--accent-cyan)' : 'var(--accent-blue)'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              {chartPoints.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredDataPoint === i ? 6 : i === chartPoints.length - 1 ? 5 : 3}
                  fill={hoveredDataPoint === i ? '#fff' : (chartMetric === 'energy' ? 'var(--accent-cyan)' : 'var(--accent-blue)')}
                  stroke="var(--bg-base)"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  onMouseEnter={() => setHoveredDataPoint(i)}
                  onMouseLeave={() => setHoveredDataPoint(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip display */}
            {hoveredDataPoint !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 20,
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-focus)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                Time: <strong>{chartPoints[hoveredDataPoint].hour}</strong> | Value:{' '}
                <strong style={{ color: 'var(--accent-cyan)' }}>
                  {chartPoints[hoveredDataPoint].val}{' '}
                  {chartMetric === 'energy' ? 'kW' : 'L/min'}
                </strong>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 16px 0 16px',
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>24h ago</span>
            <span>12h ago</span>
            <span>6h ago</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Now (Direct Live Tick: {chartMetric === 'energy' ? `${totalPower} kW` : `${totalWater} L/m`})</span>
          </div>
        </div>

        {/* Side Floor / Zone Quick Status */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">Floor Health Status</div>
            <button
              id="btn-inspect-twin"
              className="panel-btn"
              onClick={() => setCurrentTab('digital_twin')}
            >
              <Maximize2 size={13} style={{ display: 'inline', marginRight: 4 }} />
              Open Twin
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayZones.map((z) => (
              <div
                key={z.id}
                className="floor-slice"
                style={{ padding: 12 }}
                onClick={() => handleSimulateInTwin(z.floor)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{z.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {z.occupants} occupants · {z.temperatureC}°C (Target {z.targetTempC}°C)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: z.waterFlowLpm > 20 ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                    }}
                  >
                    {z.breakerStatus === 'off' ? '0.0 kW (OFF)' : `${z.powerDrawKW} kW`} ·{' '}
                    {z.valveStatus === 'closed' ? '0.0 L/m (SHUT)' : `${z.waterFlowLpm} L/m`}
                  </div>
                  <div style={{ fontSize: 10, color: z.alertCount > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                    {z.alertCount > 0 ? `⚠ ${z.alertCount} Edge Flag` : 'Normal'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
