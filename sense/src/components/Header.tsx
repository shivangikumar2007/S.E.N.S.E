import React, { useState, useRef, useEffect } from 'react';
import { Building, TabView, UserSession, AppNotification } from '../types/sense';
import {
  Activity,
  Layers,
  Cpu,
  Bell,
  Sliders,
  Sparkles,
  Shield,
  Building2,
  User,
  LogOut,
  Settings,
  CheckCircle2,
  AlertTriangle,
  X,
  CheckCheck,
} from 'lucide-react';

interface HeaderProps {
  currentTab: TabView;
  setCurrentTab: (tab: TabView) => void;
  session: UserSession;
  onLogout: () => void;
  activeAlertsCount: number;
  openAnomalyModal: () => void;
  buildings: Building[];
  selectedBuildingId: string;
  onSelectBuilding: (buildingId: string) => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkNotificationRead: (id: string) => void;
  onDismissNotification: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  session,
  onLogout,
  activeAlertsCount,
  openAnomalyModal,
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkNotificationRead,
  onDismissNotification,
}) => {
  const isAdmin = session.role === 'administrator';
  const isOwner = session.role === 'owner';
  const [notifTrayOpen, setNotifTrayOpen] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);

  // Close tray on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setNotifTrayOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="header-bar">
      {/* Brand & Identity */}
      <div className="header-brand">
        <div className="brand-badge">S.E.N.S.E.</div>
        <div>
          <h1 className="brand-title">Smart Resource Dashboard</h1>
          <span className="brand-sub">ThinkSync · Smart Infrastructure · UDGAM</span>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className="header-center" aria-label="Primary Navigation">
        <button
          id="nav-dashboard"
          className={`nav-pill ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <Activity size={15} />
          Overview
        </button>
        <button
          id="nav-digital-twin"
          className={`nav-pill ${currentTab === 'digital_twin' ? 'active' : ''}`}
          onClick={() => setCurrentTab('digital_twin')}
        >
          <Layers size={15} />
          Digital Twin
        </button>
        <button
          id="nav-ai-engine"
          className={`nav-pill ${currentTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setCurrentTab('analytics')}
        >
          <Cpu size={15} />
          DRL & Federated
        </button>
        <button
          id="nav-alerts"
          className={`nav-pill ${currentTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setCurrentTab('alerts')}
        >
          <Bell size={15} />
          Alerts
          {activeAlertsCount > 0 && (
            <span
              style={{
                background: 'var(--accent-amber)',
                color: '#000',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: '9999px',
                padding: '1px 6px',
                marginLeft: 4,
              }}
            >
              {activeAlertsCount}
            </span>
          )}
        </button>
        <button
          id="nav-controls"
          className={`nav-pill ${currentTab === 'controls' ? 'active' : ''}`}
          onClick={() => setCurrentTab('controls')}
        >
          <Sliders size={15} />
          Actuators
        </button>
        {isAdmin && (
          <button id="nav-buildings" className={`nav-pill ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => setCurrentTab('settings')}>
            <Settings size={15} /> Buildings
          </button>
        )}
      </nav>

      {/* Right controls: Edge status, Test trigger, Notification Bell, User Profile, Logout */}
      <div className="header-right">
        {isAdmin && (
          <select
            id="building-switcher"
            value={selectedBuildingId}
            onChange={(event) => onSelectBuilding(event.target.value)}
            aria-label="Switch active building"
            style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', padding: '7px 9px', maxWidth: 180 }}
          >
            {buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
          </select>
        )}
        {/* Edge AI Status Badge */}
        <div className="edge-status-badge" title="Edge node running Raspberry Pi-class inference locally">
          <div className="edge-pulse" />
          <span>Edge AI · 0ms Latency</span>
        </div>

        {/* Anomaly Test Trigger (Visible for Admin and Owner) */}
        {(isAdmin || isOwner) && (
          <button
            id="btn-inject-anomaly"
            className="panel-btn"
            style={{
              borderColor: 'rgba(236, 72, 153, 0.4)',
              color: '#f472b6',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={openAnomalyModal}
          >
            <Sparkles size={13} />
            Inject Anomaly
          </button>
        )}

        {/* ── Notification Bell ── */}
        <div ref={trayRef} style={{ position: 'relative' }}>
          <button
            id="btn-notif-bell"
            onClick={() => {
              setNotifTrayOpen((o) => !o);
              if (!notifTrayOpen && unreadCount > 0) onMarkAllRead();
            }}
            title="Notifications"
            style={{
              position: 'relative',
              background: notifTrayOpen ? 'rgba(56,189,248,0.12)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${notifTrayOpen ? 'rgba(56,189,248,0.4)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              color: unreadCount > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <Bell size={15} className={unreadCount > 0 ? 'notif-bell-ring' : ''} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* Notification Tray Dropdown */}
          {notifTrayOpen && (
            <div className="notif-tray">
              <div className="notif-tray-header">
                <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>
                  Notifications
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {notifications.length > 0 && (
                    <button
                      className="notif-mark-all"
                      onClick={onMarkAllRead}
                      title="Mark all as read"
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={28} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                    <div>No notifications yet</div>
                    <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>
                      Alerts and resolutions will appear here.
                    </div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => onMarkNotificationRead(n.id)}
                    >
                      <div className="notif-item-icon">
                        {n.type === 'resolved' ? (
                          <CheckCircle2 size={16} color="var(--accent-emerald)" />
                        ) : (
                          <AlertTriangle
                            size={16}
                            color={n.severity === 'critical' ? 'var(--accent-rose)' : 'var(--accent-amber)'}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-time">{n.timestamp}</div>
                      </div>
                      <button
                        className="notif-dismiss"
                        onClick={(e) => { e.stopPropagation(); onDismissNotification(n.id); }}
                        title="Dismiss"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-pill)',
            padding: '4px 12px 4px 6px',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: isAdmin
                ? 'linear-gradient(135deg, #0284c7, #8b5cf6)'
                : isOwner
                ? 'linear-gradient(135deg, #10b981, #0284c7)'
                : 'linear-gradient(135deg, #64748b, #334155)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            {isAdmin ? <Shield size={14} /> : isOwner ? <Building2 size={14} /> : <User size={14} />}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
              {session.name}
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: isAdmin ? 'var(--accent-cyan)' : isOwner ? 'var(--accent-emerald)' : 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              {session.role} {session.unitId ? `(${session.unitId})` : ''}
            </div>
          </div>

          {/* Logout Button */}
          <button
            id="btn-logout"
            onClick={onLogout}
            title="Log Out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              marginLeft: 6,
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
