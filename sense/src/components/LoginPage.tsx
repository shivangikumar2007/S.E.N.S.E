import React, { useState } from 'react';
import { Building, UserRole, UserSession } from '../types/sense';
import {
  Shield,
  User,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  MapPin,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
  buildings: Building[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, buildings }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('administrator');
  const [email, setEmail] = useState('agrimaagnihotri10@gmail.com');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState<string | null>(null);
  const [selectedUserBuildingId, setSelectedUserBuildingId] = useState<string>(buildings[0]?.id ?? '');

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'administrator') {
      setEmail('agrimaagnihotri10@gmail.com');
      setPassword('1234');
    } else if (role === 'owner') {
      setEmail('owner.thinksync@smartinfra.io');
      setPassword('owner2026');
    } else {
      setEmail('resident.402@sense-tower.com');
      setPassword('resident402');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedRole === 'administrator') {
      if (email.trim().toLowerCase() !== 'agrimaagnihotri10@gmail.com' || password !== '1234') {
        setError('Invalid administrator credentials. Expected agrimaagnihotri10@gmail.com / 1234');
        return;
      }
      onLogin({
        email: 'agrimaagnihotri10@gmail.com',
        name: 'Agrima Agnihotri',
        role: 'administrator',
      });
    } else if (selectedRole === 'owner') {
      const ownerBuilding = buildings.find((building) => building.ownerEmail.toLowerCase() === email.trim().toLowerCase());
      if (!ownerBuilding || password !== 'owner2026') {
        setError('Owner access requires the email assigned to a building and the owner passkey.');
        return;
      }
      onLogin({
        email: ownerBuilding.ownerEmail,
        name: `${ownerBuilding.name} Owner`,
        role: 'owner',
        buildingId: ownerBuilding.id,
      });
    } else {
      // User (Resident)
      if (!email || !password) {
        setError('Please enter both email and password.');
        return;
      }
      if (!selectedUserBuildingId) {
        setError('Please select a building to access.');
        return;
      }
      onLogin({
        email,
        name: 'Alex Mercer',
        role: 'user',
        unitId: 'Unit 402',
        buildingId: selectedUserBuildingId,
      });
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    handleRoleTabChange(role);
    if (role === 'administrator') {
      onLogin({
        email: 'agrimaagnihotri10@gmail.com',
        name: 'Agrima Agnihotri',
        role: 'administrator',
      });
    } else if (role === 'owner') {
      const ownerBuilding = buildings.find((building) => building.ownerEmail === 'owner.thinksync@smartinfra.io') ?? buildings[0];
      onLogin({
        email: ownerBuilding.ownerEmail,
        name: `${ownerBuilding.name} Owner`,
        role: 'owner',
        buildingId: ownerBuilding.id,
      });
    } else {
      onLogin({
        email: 'resident.402@sense-tower.com',
        name: 'Alex Mercer',
        role: 'user',
        unitId: 'Unit 402',
        buildingId: buildings[0]?.id ?? '',
      });
    }
  };

  const chosenBuilding = buildings.find((b) => b.id === selectedUserBuildingId);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="bg-mesh" />

      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-focus)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-elevated)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #0284c7, #6366f1)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 14,
              color: '#fff',
              marginBottom: 12,
              boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Sparkles size={16} />
            S.E.N.S.E. PLATFORM
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
            Smart Resource Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            ThinkSync · Edge AI & Closed-Loop Building Intelligence
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.4)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            className={`role-btn ${selectedRole === 'administrator' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('administrator')}
            style={{ padding: '8px 4px', fontSize: 11 }}
          >
            <Shield size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
            Administrator
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'owner' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('owner')}
            style={{ padding: '8px 4px', fontSize: 11 }}
          >
            <Building2 size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
            Owner
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'user' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('user')}
            style={{ padding: '8px 4px', fontSize: 11 }}
          >
            <User size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
            User
          </button>
        </div>

        {/* Info box for active role */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--accent-cyan)',
          }}
        >
          {selectedRole === 'administrator' && (
            <>
              <Shield size={16} />
              <span>Full System Authority · Physical Actuator Overrides & Emergency Controls</span>
            </>
          )}
          {selectedRole === 'owner' && (
            <>
              <Building2 size={16} />
              <span>Building Owner Access · Limited to the building assigned to your email</span>
            </>
          )}
          {selectedRole === 'user' && (
            <>
              <User size={16} />
              <span>
                Resident Access · Select a building to view its alerts & telemetry
                {chosenBuilding ? ` — ${chosenBuilding.name}, ${chosenBuilding.location}` : ''}
              </span>
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid var(--accent-rose)',
              color: 'var(--accent-rose)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: 12, top: 12 }}
              />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px 10px 38px',
                  color: '#fff',
                  fontSize: 13,
                  fontFamily: 'var(--font-main)',
                  outline: 'none',
                }}
              />
            </div>
            {selectedRole === 'administrator' && (
              <span style={{ fontSize: 11, color: 'var(--accent-emerald)', marginTop: 4, display: 'inline-block' }}>
                ✓ Authorized Admin Account: agrimaagnihotri10@gmail.com
              </span>
            )}
            {selectedRole === 'owner' && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>
                Use the owner email configured by the administrator. Default passkey: <strong>owner2026</strong>
              </span>
            )}
          </div>

          <div style={{ marginBottom: selectedRole === 'user' ? 16 : 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: 12, top: 12 }}
              />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px 10px 38px',
                  color: '#fff',
                  fontSize: 13,
                  fontFamily: 'var(--font-main)',
                  outline: 'none',
                }}
              />
            </div>
            {selectedRole === 'administrator' && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>
                Default passkey: <strong>1234</strong>
              </span>
            )}
          </div>

          {/* Building selector — only shown for User role */}
          {selectedRole === 'user' && (
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Select Building
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                />
                <select
                  id="login-building-select"
                  value={selectedUserBuildingId}
                  onChange={(e) => setSelectedUserBuildingId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px 10px 38px',
                    color: '#fff',
                    fontSize: 13,
                    fontFamily: 'var(--font-main)',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id} style={{ background: '#1e293b' }}>
                      {b.name} — {b.location}
                    </option>
                  ))}
                </select>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>
                Your dashboard & alerts will be scoped to this building.
              </span>
            </div>
          )}

          <button
            id="btn-submit-login"
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px 18px',
              fontSize: 14,
            }}
          >
            <span>Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Bypass */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>
            Instant 1-Click Demo Login
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              id="quick-login-admin"
              className="panel-btn"
              onClick={() => handleQuickDemo('administrator')}
              style={{ fontSize: 11, padding: '6px 4px', textAlign: 'center', borderColor: 'rgba(56, 189, 248, 0.4)' }}
            >
              ⚡ Admin (1234)
            </button>
            <button
              type="button"
              id="quick-login-owner"
              className="panel-btn"
              onClick={() => handleQuickDemo('owner')}
              style={{ fontSize: 11, padding: '6px 4px', textAlign: 'center' }}
            >
              🏢 Owner
            </button>
            <button
              type="button"
              id="quick-login-user"
              className="panel-btn"
              onClick={() => handleQuickDemo('user')}
              style={{ fontSize: 11, padding: '6px 4px', textAlign: 'center' }}
            >
              👤 Resident
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
