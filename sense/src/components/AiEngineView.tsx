import React, { useState } from 'react';
import { DrlWeights, UserRole } from '../types/sense';
import { computeDrlPolicy, FEDERATED_NODES } from '../services/drlOptimizer';
import {
  Cpu,
  TrendingDown,
  Sparkles,
  Lock,
  RefreshCw,
  CheckCircle2,
  Server,
  Zap,
} from 'lucide-react';

interface AiEngineViewProps {
  userRole: UserRole;
}

export const AiEngineView: React.FC<AiEngineViewProps> = ({ userRole }) => {
  const isAdministrator = userRole === 'administrator';
  const [weights, setWeights] = useState<DrlWeights>({
    comfort: 40,
    cost: 35,
    carbon: 25,
  });

  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const policy = computeDrlPolicy(weights);

  const handleSyncWeights = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3500);
    }, 1500);
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>AI Engine · DRL Optimizer & Federated Learning</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          Continuous closed-loop control via Deep Reinforcement Learning with privacy-preserving cross-building federated intelligence.
        </p>
      </div>

      <div className="panels-grid">
        {/* Left: DRL Multi-Objective Optimizer */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Cpu size={18} color="var(--accent-cyan)" />
              Deep Reinforcement Learning (DRL) Tuner
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                background: 'rgba(56, 189, 248, 0.1)',
                color: 'var(--accent-cyan)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              PPO-Continuous v3
            </span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            Adjust the multi-objective reward function. The DRL agent recalculates optimal actuator policies against predicted weather and spot tariff pricing in real-time.
          </p>

          {/* Slider 1: Comfort */}
          <div className="sandbox-control-group">
            <div className="sandbox-control-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="var(--accent-cyan)" />
                Occupant Comfort Priority
              </span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                {weights.comfort}%
              </strong>
            </div>
            <input
              id="slider-drl-comfort"
              type="range"
              min="10"
              max="90"
              value={weights.comfort}
              onChange={(e) => setWeights({ ...weights, comfort: parseInt(e.target.value, 10) })}
              className="slider-input"
              style={{ accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Slider 2: Cost */}
          <div className="sandbox-control-group">
            <div className="sandbox-control-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingDown size={14} color="var(--accent-emerald)" />
                Energy & Tariff Cost Curtailment
              </span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                {weights.cost}%
              </strong>
            </div>
            <input
              id="slider-drl-cost"
              type="range"
              min="10"
              max="90"
              value={weights.cost}
              onChange={(e) => setWeights({ ...weights, cost: parseInt(e.target.value, 10) })}
              className="slider-input"
              style={{ accentColor: 'var(--accent-emerald)' }}
            />
          </div>

          {/* Slider 3: Carbon */}
          <div className="sandbox-control-group">
            <div className="sandbox-control-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color="var(--accent-amber)" />
                Grid Carbon Abatement Weight
              </span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                {weights.carbon}%
              </strong>
            </div>
            <input
              id="slider-drl-carbon"
              type="range"
              min="10"
              max="90"
              value={weights.carbon}
              onChange={(e) => setWeights({ ...weights, carbon: parseInt(e.target.value, 10) })}
              className="slider-input"
              style={{ accentColor: 'var(--accent-amber)' }}
            />
          </div>

          {/* DRL Policy Outputs Box */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              marginTop: 20,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
              Dynamic DRL Setpoint Recommendations
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target HVAC Temp</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {policy.suggestedHvacSetpointC}°C
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chiller Ramp</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                  {policy.suggestedChillerRampPct}%
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Policy Reward</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                  {policy.expectedReward}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: 10,
              }}
            >
              <strong>Policy Strategy:</strong> {policy.actionExplanation}
            </div>
          </div>
        </div>

        {/* The portfolio mesh exposes cross-building data and is administrator-only. */}
        {isAdministrator && <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Server size={18} color="var(--accent-emerald)" />
              Federated Learning Portfolio Mesh
            </div>
            <button
              id="btn-sync-federated"
              className="panel-btn"
              onClick={handleSyncWeights}
              disabled={syncing}
            >
              <RefreshCw
                size={12}
                style={{
                  display: 'inline',
                  marginRight: 4,
                  animation: syncing ? 'spin 1s linear infinite' : 'none',
                }}
              />
              {syncing ? 'Aggregating...' : 'Sync Weights'}
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Privacy-preserving parameter aggregation. Buildings exchange encrypted gradient vectors without ever exposing raw resident or sensor data.
          </p>

          {/* Privacy Guarantee Pill */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
            }}
          >
            <Lock size={18} color="var(--accent-emerald)" />
            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
              <strong>Zero Raw-Data Leakage Guaranteed:</strong> Only differential privacy-noised weights are synchronized across buildings.
            </div>
          </div>

          {syncSuccess && (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckCircle2 size={14} />
              <span>Federated Round #43 completed. Global model updated across 4 building sites!</span>
            </div>
          )}

          {/* List of Federated Nodes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEDERATED_NODES.map((node) => (
              <div
                key={node.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{node.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {node.location} · {node.unitsCount} Units · {node.encryptionStatus}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {node.modelAccuracyPct}% Acc.
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Synced {node.lastWeightSync}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}
      </div>
    </div>
  );
};
