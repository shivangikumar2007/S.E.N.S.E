import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TabView, FloorZone, AnomalyAlert, WhatIfScenario, UserSession, Building, AppNotification } from './types/sense';
import { INITIAL_ZONES, INITIAL_ALERTS, generate24HourHistory, AnomalyPreset } from './services/telemetryEngine';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { DigitalTwinView } from './components/DigitalTwinView';
import { AiEngineView } from './components/AiEngineView';
import { AlertsCenter } from './components/AlertsCenter';
import { ControlsView } from './components/ControlsView';
import { AnomalyTriggerModal } from './components/AnomalyTriggerModal';
import { LoginPage } from './components/LoginPage';
import { BuildingManagementView } from './components/BuildingManagementView';
import { Sparkles } from 'lucide-react';

const INITIAL_BUILDINGS: Building[] = [
  { id: 'tower-alpha', name: 'Tower Alpha', location: 'Bengaluru, Karnataka', areaSqM: 2230, floorCount: 4, ownerEmail: 'owner.thinksync@smartinfra.io' },
  { id: 'tower-bravo', name: 'Tower Bravo', location: 'Pune, Maharashtra', areaSqM: 1800, floorCount: 3, ownerEmail: 'bravo.owner@smartinfra.io' },
  { id: 'tower-charlie', name: 'Tower Charlie', location: 'Hyderabad, Telangana', areaSqM: 2900, floorCount: 5, ownerEmail: 'charlie.owner@smartinfra.io' },
];

const createZonesForBuilding = (building: Building): FloorZone[] =>
  Array.from({ length: building.floorCount }, (_, index) => {
    const floor = index + 1;
    const template = INITIAL_ZONES[index % INITIAL_ZONES.length];
    return {
      ...template,
      id: `${building.id}-floor-${floor}`,
      name: `Floor ${floor} · ${building.name}`,
      floor,
      areaSqM: Math.round(building.areaSqM / building.floorCount),
      alertCount: 0,
      buildingId: building.id,
    };
  });

const createAlertsForBuilding = (buildingId: string): AnomalyAlert[] =>
  INITIAL_ALERTS.map((alert) => ({ ...alert, id: `${buildingId}-${alert.id}`, buildingId }));

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const App: React.FC = () => {
  // Login Pipeline: Starts on the Login Page by default
  const [session, setSession] = useState<UserSession | null>(null);

  const [currentTab, setCurrentTab] = useState<TabView>('dashboard');
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [selectedBuildingId, setSelectedBuildingId] = useState(INITIAL_BUILDINGS[0].id);
  const [zones, setZones] = useState<FloorZone[]>(() => INITIAL_BUILDINGS.flatMap(createZonesForBuilding));
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(() => INITIAL_BUILDINGS.flatMap((building) => createAlertsForBuilding(building.id)));
  const [history24h, setHistory24h] = useState(generate24HourHistory());
  const [selectedFloorForTwin, setSelectedFloorForTwin] = useState<number>(3);
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
  const [solarBessOffsetsKW, setSolarBessOffsetsKW] = useState<Record<string, number>>({});

  // Global notification list (scoped per-building when rendering)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const canManageBuilding = session?.role === 'administrator' || session?.role === 'owner';
  const canResolveAnomalies = session?.role === 'owner' || session?.role === 'administrator';
  const activeBuilding = buildings.find((building) => building.id === selectedBuildingId) ?? buildings[0];
  const activeZones = useMemo(() => zones.filter((zone) => zone.buildingId === activeBuilding?.id), [zones, activeBuilding?.id]);
  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.buildingId === activeBuilding?.id), [alerts, activeBuilding?.id]);
  const solarBessOffsetKW = solarBessOffsetsKW[activeBuilding?.id ?? ''] ?? 0;

  // Notifications scoped to the active building
  const activeNotifications = useMemo(
    () => notifications.filter((n) => n.buildingId === activeBuilding?.id),
    [notifications, activeBuilding?.id]
  );
  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  // Helper: push a new notification
  const pushNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read'>) => {
    const newNotif: AppNotification = { ...notif, id: `notif-${Date.now()}`, read: false };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]); // keep max 50
  }, []);

  const handleDismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.buildingId === activeBuilding?.id ? { ...n, read: true } : n))
    );
  }, [activeBuilding?.id]);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  // Live telemetry pulse simulation (every 3.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setZones((prevZones) =>
        prevZones.map((z) => {
          // If valve is closed or breaker off, reflect strictly in readings
          if (z.valveStatus === 'closed') {
            return { ...z, waterFlowLpm: 0 };
          }
          if (z.breakerStatus === 'off') {
            return { ...z, powerDrawKW: 0 };
          }

          // Small natural live sensor jitter
          const powerJitter = (Math.random() - 0.5) * 0.4;
          const waterJitter = (Math.random() - 0.5) * 0.2;
          return {
            ...z,
            powerDrawKW: Math.max(1.0, Math.round((z.powerDrawKW + powerJitter) * 10) / 10),
            waterFlowLpm: Math.max(0, Math.round((z.waterFlowLpm + waterJitter) * 10) / 10),
          };
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Sync 24H history with live totals
  useEffect(() => {
    const totalPower = activeZones.reduce((sum, z) => sum + (z.breakerStatus === 'on' ? z.powerDrawKW : 0), 0) - solarBessOffsetKW;
    const totalWater = activeZones.reduce((sum, z) => sum + (z.valveStatus === 'closed' ? 0 : z.waterFlowLpm), 0);
    setHistory24h(generate24HourHistory(Math.max(0, totalPower), totalWater));
  }, [activeZones, solarBessOffsetKW]);

  // Alert resolution handler — owner and administrator only
  const handleResolveAlert = (id: string) => {
    if (!canResolveAnomalies) return;
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
    // Notify on resolution
    const target = alerts.find((a) => a.id === id);
    if (target) {
      pushNotification({
        type: 'resolved',
        title: 'Anomaly Resolved',
        message: `"${target.title}" at ${target.location} has been marked as resolved.`,
        severity: target.severity,
        alertId: id,
        buildingId: target.buildingId ?? selectedBuildingId,
        timestamp: now(),
      });
    }
  };

  // Two-way interaction: Live Sync between Digital Twin and Main Platform Dashboard
  const handleLiveSyncScenario = useCallback((scenario: WhatIfScenario, targetFloor: number) => {
    if (!canManageBuilding) return;
    const targetTempC = Math.max(15, Math.min(50, scenario.targetTempC));
    // 1. Update BESS Battery offset across the platform
    setSolarBessOffsetsKW((previous) => ({ ...previous, [selectedBuildingId]: scenario.solarBatteryContributionKW }));

    // 2. Update Zone specific parameters (target temp, valve throttle, power)
    setZones((prev) =>
      prev.map((z) => {
        if (z.buildingId === selectedBuildingId && z.floor === targetFloor) {
          const clampedValvePct = Math.max(0, Math.min(100, scenario.waterValveThrottlePct));
          const isFullShutoff = clampedValvePct === 100;
          const throttleRatio = clampedValvePct / 100;

          let newFlow = z.waterFlowLpm;
          if (isFullShutoff) {
            newFlow = 0;
          } else if (throttleRatio > 0) {
            const baselineFlow = z.floor === 3 ? 28.4 : 5.0;
            newFlow = Math.max(0, Math.round(baselineFlow * (1 - throttleRatio) * 10) / 10);
          }

          return {
            ...z,
            targetTempC,
            hvacStatus: targetTempC > 26 ? 'eco' : targetTempC < 19 ? 'active' : z.hvacStatus,
            valveStatus: isFullShutoff ? 'closed' : clampedValvePct > 0 ? 'throttled' : 'open',
            waterFlowLpm: newFlow,
          };
        }
        return z;
      })
    );

    // 3. If Floor 3 water leak is throttled >= 35% or 100% shutoff, mitigate alert
    if (targetFloor === 3 && scenario.waterValveThrottlePct >= 35) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.category === 'water' && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: 'Anomaly Mitigated via Digital Twin',
              message: `"${a.title}" mitigated via solenoid throttling on Floor ${targetFloor}.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Mitigated via Digital Twin Solenoid Throttling' };
          }
          return a;
        })
      );
    }
  }, [canManageBuilding, selectedBuildingId, pushNotification]);

  // Applying Digital Twin scenario permanently to physical actuators
  const handleApplyChanges = (scenario: WhatIfScenario, targetFloor: number) => {
    handleLiveSyncScenario(scenario, targetFloor);
  };

  // Breaker Toggle in Actuators (directly alters Dashboard live power)
  const handleToggleBreaker = (floorId: string) => {
    if (!canManageBuilding) return;
    setZones((prev) =>
      prev.map((z) =>
        z.id === floorId
          ? {
              ...z,
              breakerStatus: z.breakerStatus === 'on' ? 'off' : 'on',
              powerDrawKW: z.breakerStatus === 'on' ? 0 : 15.2,
            }
          : z
      )
    );
  };

  // Valve Toggle in Actuators (directly alters Dashboard live water flow)
  const handleToggleValve = (floorId: string) => {
    if (!canManageBuilding) return;
    setZones((prev) =>
      prev.map((z) => {
        if (z.id === floorId) {
          const isNowClosed = z.valveStatus === 'open' || z.valveStatus === 'throttled';
          return {
            ...z,
            valveStatus: isNowClosed ? 'closed' : 'open',
            waterFlowLpm: isNowClosed ? 0 : (z.floor === 3 ? 12.0 : 5.4),
          };
        }
        return z;
      })
    );

    // If Floor 3 valve closed, resolve leak alert
    const target = activeZones.find((z) => z.id === floorId);
    if (target && target.floor === 3) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.category === 'water' && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: 'Anomaly Mitigated',
              message: `"${a.title}" mitigated via physical solenoid isolation on Floor ${target.floor}.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Mitigated via Physical Solenoid Isolation' };
          }
          return a;
        })
      );
    }
  };

  // Apply Anomaly Preset from extended library
  const handleApplyPreset = (preset: AnomalyPreset) => {
    if (!canManageBuilding) return;
    setZones((prev) =>
      prev.map((z) => (z.buildingId === selectedBuildingId && z.floor === preset.targetFloor ? preset.applyToZone(z) : z))
    );

    const newAlert: AnomalyAlert = {
      id: `alert-${Date.now()}`,
      title: preset.name,
      description: preset.description,
      severity: preset.severity,
      category: preset.category,
      location: `Floor ${preset.targetFloor} · Riser & Actuator Grid`,
      floor: preset.targetFloor,
      timestamp: 'Just now',
      resolved: false,
      rootCause: preset.rootCause,
      recommendedAction: preset.recommendedAction,
      potentialSavings: preset.potentialSavings,
      edgeConfirmed: true,
      buildingId: selectedBuildingId,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setSelectedFloorForTwin(preset.targetFloor);

    // Push notification for all roles in this building
    pushNotification({
      type: 'new_alert',
      title: `⚠ New Anomaly: ${preset.name}`,
      message: `${preset.description} — Floor ${preset.targetFloor}, ${activeBuilding?.name ?? ''}`,
      severity: preset.severity,
      alertId: newAlert.id,
      buildingId: selectedBuildingId,
      timestamp: now(),
    });
  };

  // Inject Custom Anomaly
  const handleInjectCustom = (floor: number, powerKW: number, waterLpm: number, title: string) => {
    if (!canManageBuilding) return;
    setZones((prev) =>
      prev.map((z) =>
        z.buildingId === selectedBuildingId && z.floor === floor
          ? {
              ...z,
              powerDrawKW: powerKW > 0 ? powerKW : z.powerDrawKW,
              waterFlowLpm: waterLpm > 0 ? waterLpm : z.waterFlowLpm,
              alertCount: z.alertCount + 1,
            }
          : z
      )
    );

    const newAlert: AnomalyAlert = {
      id: `custom-${Date.now()}`,
      title: `Custom Anomaly: ${title}`,
      description: `Custom telemetry injection on Floor ${floor}: ${powerKW} kW power, ${waterLpm} L/min flow.`,
      severity: powerKW > 30 || waterLpm > 30 ? 'critical' : 'warning',
      category: waterLpm > powerKW ? 'water' : 'energy',
      location: `Floor ${floor} · User Injected`,
      floor,
      timestamp: 'Just now',
      resolved: false,
      rootCause: 'Operator injected live fault mode via Telemetry Console.',
      recommendedAction: 'Simulate throttling or setpoint adjustment in Digital Twin.',
      potentialSavings: 'Variable depending on containment strategy',
      edgeConfirmed: true,
      buildingId: selectedBuildingId,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setSelectedFloorForTwin(floor);

    // Push notification for new custom anomaly
    pushNotification({
      type: 'new_alert',
      title: `⚠ Custom Anomaly: ${title}`,
      message: `Telemetry injection on Floor ${floor} — ${powerKW} kW / ${waterLpm} L/min at ${activeBuilding?.name ?? ''}.`,
      severity: newAlert.severity,
      alertId: newAlert.id,
      buildingId: selectedBuildingId,
      timestamp: now(),
    });
  };

  const handleResetBaseline = () => {
    if (!canManageBuilding) return;
    setZones((previous) => previous.map((zone) => zone.buildingId === selectedBuildingId ? createZonesForBuilding(activeBuilding).find((baseline) => baseline.id === zone.id) ?? zone : zone));
    setAlerts((previous) => previous.map((alert) => alert.buildingId === selectedBuildingId ? { ...alert, resolved: true } : alert));
    setSolarBessOffsetsKW((previous) => ({ ...previous, [selectedBuildingId]: 0 }));
  };

  const handleSelectBuilding = (buildingId: string) => {
    const isAdministrator = session?.role === 'administrator';
    const allowedBuildingId = isAdministrator ? buildingId : session?.buildingId ?? 'tower-alpha';
    if (!buildings.some((building) => building.id === allowedBuildingId)) return;
    setSelectedBuildingId(allowedBuildingId);
    setSelectedFloorForTwin(1);
  };

  const handleAddBuilding = (buildingInput: Omit<Building, 'id'>) => {
    if (session?.role !== 'administrator') return;
    if (buildings.some((building) => building.ownerEmail.toLowerCase() === buildingInput.ownerEmail.toLowerCase())) return;
    const id = `building-${Date.now()}`;
    const building = { ...buildingInput, id };
    setBuildings((previous) => [...previous, building]);
    setZones((previous) => [...previous, ...createZonesForBuilding(building)]);
    setSelectedBuildingId(id);
    setSelectedFloorForTwin(1);
  };

  const handleDeleteBuilding = (buildingId: string) => {
    if (session?.role !== 'administrator' || buildings.length <= 1) return;
    const nextBuilding = buildings.find((building) => building.id !== buildingId);
    setBuildings((previous) => previous.filter((building) => building.id !== buildingId));
    setZones((previous) => previous.filter((zone) => zone.buildingId !== buildingId));
    setAlerts((previous) => previous.filter((alert) => alert.buildingId !== buildingId));
    setNotifications((previous) => previous.filter((n) => n.buildingId !== buildingId));
    setSolarBessOffsetsKW((previous) => {
      const { [buildingId]: _, ...remaining } = previous;
      return remaining;
    });
    if (selectedBuildingId === buildingId && nextBuilding) handleSelectBuilding(nextBuilding.id);
  };

  // Login Pipeline: if no active session, render the Login Page
  if (!session) {
    return <LoginPage buildings={buildings} onLogin={(user) => {
      setSession(user);
      if (user.buildingId) setSelectedBuildingId(user.buildingId);
    }} />;
  }

  const activeAlertsCount = activeAlerts.filter((a) => !a.resolved).length;

  return (
    <div className="app-container">
      {/* Background ambient mesh */}
      <div className="bg-mesh" />

      {/* Primary Navigation & Header with User Profile */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        onLogout={() => setSession(null)}
        activeAlertsCount={activeAlertsCount}
        openAnomalyModal={() => setIsAnomalyModalOpen(true)}
        buildings={session.role === 'administrator' ? buildings : buildings.filter((building) => building.id === (session.buildingId ?? 'tower-alpha'))}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={handleSelectBuilding}
        notifications={activeNotifications}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onMarkNotificationRead={handleMarkNotificationRead}
        onDismissNotification={handleDismissNotification}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {currentTab === 'dashboard' && (
          <DashboardOverview
            userRole={session.role}
            zones={activeZones}
            alerts={activeAlerts}
            history24h={history24h}
            solarBessOffsetKW={solarBessOffsetKW}
            setCurrentTab={setCurrentTab}
            setSelectedFloorForTwin={setSelectedFloorForTwin}
          />
        )}

        {currentTab === 'digital_twin' && (
          <DigitalTwinView
            userRole={session.role}
            zones={activeZones}
            alerts={activeAlerts}
            selectedFloor={selectedFloorForTwin}
            setSelectedFloor={setSelectedFloorForTwin}
            onApplyChanges={handleApplyChanges}
            onLiveSyncScenario={handleLiveSyncScenario}
          />
        )}

        {currentTab === 'analytics' && <AiEngineView userRole={session.role} />}

        {currentTab === 'alerts' && (
          <AlertsCenter
            userRole={session.role}
            alerts={activeAlerts}
            onResolveAlert={handleResolveAlert}
            setCurrentTab={setCurrentTab}
            setSelectedFloorForTwin={setSelectedFloorForTwin}
          />
        )}

        {currentTab === 'controls' && (
          <ControlsView
            userRole={session.role}
            zones={activeZones}
            onToggleBreaker={handleToggleBreaker}
            onToggleValve={handleToggleValve}
          />
        )}

        {currentTab === 'settings' && session.role === 'administrator' && (
          <BuildingManagementView
            buildings={buildings}
            selectedBuildingId={selectedBuildingId}
            onSelectBuilding={handleSelectBuilding}
            onAddBuilding={handleAddBuilding}
            onDeleteBuilding={handleDeleteBuilding}
          />
        )}
      </main>

      {/* Floating Anomaly Injection Trigger Button (for admin/owner) */}
      {session.role !== 'user' && (
        <button
          id="btn-floating-test"
          className="floating-test-btn"
          onClick={() => setIsAnomalyModalOpen(true)}
          title="Test closed-loop Edge AI anomaly detection"
        >
          <Sparkles size={16} />
          Simulate Anomaly
        </button>
      )}

      {/* Anomaly Testing Modal */}
      {canManageBuilding && (
        <AnomalyTriggerModal
          isOpen={isAnomalyModalOpen}
          onClose={() => setIsAnomalyModalOpen(false)}
          onApplyPreset={handleApplyPreset}
          onInjectCustom={handleInjectCustom}
          onResetBaseline={handleResetBaseline}
        />
      )}
    </div>
  );
};
