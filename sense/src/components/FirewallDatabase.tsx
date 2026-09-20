import React, { useMemo, useState } from 'react';
import { Activity, Database, Filter, Globe2, LockKeyhole, RefreshCw, Search, ShieldCheck, ShieldX } from 'lucide-react';

type FirewallEvent = {
  id: string;
  timestamp: string;
  source: string;
  endpoint: string;
  rule: string;
  action: 'Allowed' | 'Blocked' | 'Monitored';
  detail: string;
};

const FIREWALL_EVENTS: FirewallEvent[] = [
  { id: 'FW-1048', timestamp: 'Today, 10:42:18', source: '10.20.4.18', endpoint: 'POST /api/sensor-data', rule: 'Sensor payload validation', action: 'Allowed', detail: 'Authenticated edge sensor payload accepted.' },
  { id: 'FW-1047', timestamp: 'Today, 10:40:03', source: '185.220.101.12', endpoint: 'POST /api/login', rule: 'Rate limit · 200 / 15 min', action: 'Blocked', detail: 'Request threshold exceeded; source temporarily limited.' },
  { id: 'FW-1046', timestamp: 'Today, 10:31:55', source: '10.20.4.22', endpoint: 'GET /api/latest-reading', rule: 'Helmet security headers', action: 'Allowed', detail: 'Secure response headers applied.' },
  { id: 'FW-1045', timestamp: 'Today, 10:20:41', source: '103.44.18.91', endpoint: 'GET /api/thresholds', rule: 'Suspicious request monitor', action: 'Monitored', detail: 'Unrecognised source recorded for review.' },
  { id: 'FW-1044', timestamp: 'Today, 09:58:09', source: '10.20.4.18', endpoint: 'POST /api/thresholds', rule: 'JWT access control', action: 'Allowed', detail: 'Administrator policy update accepted.' },
  { id: 'FW-1043', timestamp: 'Today, 09:46:26', source: '45.33.32.156', endpoint: 'POST /api/sensor-data', rule: 'Malformed payload guard', action: 'Blocked', detail: 'Request body did not pass schema validation.' },
];

export const FirewallDatabase: React.FC = () => {
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<'All' | FirewallEvent['action']>('All');
  const [lastRefresh, setLastRefresh] = useState('Just now');

  const records = useMemo(() => FIREWALL_EVENTS.filter((event) => {
    const text = `${event.id} ${event.source} ${event.endpoint} ${event.rule} ${event.detail}`.toLowerCase();
    return (action === 'All' || event.action === action) && text.includes(query.toLowerCase());
  }), [action, query]);

  const blocked = FIREWALL_EVENTS.filter((event) => event.action === 'Blocked').length;

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="eyebrow"><LockKeyhole size={13} /> SECURITY OPERATIONS</div>
          <h2 className="view-title">Firewall Database</h2>
          <p className="view-subtitle">Auditable request records from the S.E.N.S.E. API protection layer.</p>
        </div>
        <button className="panel-btn" onClick={() => setLastRefresh('Just now')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh records
        </button>
      </div>

      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <StatusCard icon={<ShieldCheck size={20} />} label="Firewall status" value="Active" color="var(--accent-emerald)" note="Helmet + API rate limiting enabled" />
        <StatusCard icon={<ShieldX size={20} />} label="Blocked today" value={String(blocked)} color="var(--accent-rose)" note="Requests denied by active rules" />
        <StatusCard icon={<Globe2 size={20} />} label="Protected routes" value="4" color="var(--accent-cyan)" note="Login, thresholds, telemetry and readings" />
        <StatusCard icon={<Activity size={20} />} label="Database sync" value="Live" color="var(--accent-purple)" note={`Last checked ${lastRefresh}`} />
      </div>

      <section className="dashboard-panel">
        <div className="panel-header" style={{ alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div className="panel-title"><Database size={18} color="var(--accent-cyan)" /> Firewall event ledger</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
            <label className="firewall-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search IP, route or rule" aria-label="Search firewall records" /></label>
            <label className="firewall-filter"><Filter size={13} /><select value={action} onChange={(e) => setAction(e.target.value as typeof action)} aria-label="Filter firewall action"><option>All</option><option>Allowed</option><option>Blocked</option><option>Monitored</option></select></label>
          </div>
        </div>
        <div className="firewall-table-wrap">
          <table className="firewall-table">
            <thead><tr><th>Record</th><th>Timestamp</th><th>Source</th><th>Route</th><th>Rule</th><th>Action</th><th>Event detail</th></tr></thead>
            <tbody>{records.map((event) => <tr key={event.id}>
              <td className="firewall-record">{event.id}</td><td>{event.timestamp}</td><td className="firewall-ip">{event.source}</td><td>{event.endpoint}</td><td>{event.rule}</td>
              <td><span className={`firewall-action ${event.action.toLowerCase()}`}>{event.action}</span></td><td>{event.detail}</td>
            </tr>)}</tbody>
          </table>
          {records.length === 0 && <div className="firewall-empty">No firewall records match this search.</div>}
        </div>
      </section>
    </div>
  );
};

const StatusCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; note: string }> = ({ icon, label, value, color, note }) => (
  <div className="metric-card">
    <div className="metric-card-top"><span className="metric-label">{label}</span><div className="metric-icon-box" style={{ color }}>{icon}</div></div>
    <div className="metric-value-row"><span className="metric-val" style={{ color }}>{value}</span></div>
    <div className="metric-sub">{note}</div>
  </div>
);
