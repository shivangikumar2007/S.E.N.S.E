import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TabView, FloorZone, AnomalyAlert, WhatIfScenario, UserSession, Building, AppNotification } from './types/sense';
import { INITIAL_ZONES, INITIAL_ALERTS, generate24HourHistory, AnomalyPreset, restoreZoneBaseline, getZoneBaseline } from './services/telemetryEngine';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { DigitalTwinView } from './components/DigitalTwinView';
import { AiEngineView } from './components/AiEngineView';
import { AlertsCenter } from './components/AlertsCenter';
import { ControlsView } from './components/ControlsView';
import { AnomalyTriggerModal } from './components/AnomalyTriggerModal';
import { LoginPage } from './components/LoginPage';
import { BuildingManagementView } from './components/BuildingManagementView';
import { FirewallDatabase } from './components/FirewallDatabase';
import { Sparkles, AlertTriangle, CheckCircle2, X } from 'lucide-react';

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
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(() => {
    try {
      const saved = localStorage.getItem('sense_alerts');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_BUILDINGS.flatMap((building) => createAlertsForBuilding(building.id));
  });
  const alertsRef = useRef(alerts);
  const latestLocalReadingRef = useRef<string | null>(null);
  const [history24h, setHistory24h] = useState(generate24HourHistory());
  const [selectedFloorForTwin, setSelectedFloorForTwin] = useState<number>(3);
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
  const [solarBessOffsetsKW, setSolarBessOffsetsKW] = useState<Record<string, number>>({});

  // Global notification list (scoped per-building when rendering)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('sense_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Floating real-time toast alert state (visible across all views / user dashboard)
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'new_alert' | 'resolved' | 'sensor_update';
  } | null>(null);

  // Sync alerts and notifications with local storage for seamless role switching
  useEffect(() => {
    alertsRef.current = alerts;
    try {
      localStorage.setItem('sense_alerts', JSON.stringify(alerts));
    } catch {
      // ignore
    }
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem('sense_notifications', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Auto-dismiss active toast after 5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const canManageBuilding = session?.role === 'administrator' || session?.role === 'owner';
  const canResolveAnomalies = session?.role === 'owner' || session?.role === 'administrator';
  const activeBuilding = buildings.find((building) => building.id === selectedBuildingId) ?? buildings[0];
  const activeZones = useMemo(() => zones.filter((zone) => zone.buildingId === activeBuilding?.id), [zones, activeBuilding?.id]);
  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.buildingId === activeBuilding?.id), [alerts, activeBuilding?.id]);
  const solarBessOffsetKW = solarBessOffsetsKW[activeBuilding?.id ?? ''] ?? 0;

  // Security and sensor notices are intentionally resident/user-facing only.
  // Administrators manage incidents in the Alert Center and do not receive
  // notification toasts or bell items for those incidents.
  const activeNotifications = useMemo(
    () => session?.role === 'user'
      ? notifications.filter((n) => n.buildingId === activeBuilding?.id && n.audience === 'user')
      : [],
    [notifications, activeBuilding?.id, session?.role]
  );
  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  // Store notifications for residents. A toast is only shown to an active user
  // session, never to an administrator or owner resolving the incident.
  const pushNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read' | 'audience'>) => {
    const newNotif: AppNotification = { ...notif, id: `notif-${Date.now()}`, audience: 'user', read: false };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]); // keep max 50
    if (session?.role === 'user') {
      setActiveToast({
        id: newNotif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
      });
    }
  }, [session?.role]);

  // Receives readings from the Anomaly Input service. Its values are absolute
  // live readings, so they replace the local preset/simulation values.
  const processExternalReading = useCallback((reading: {
    power: number;
    water: number;
    air: number;
    floor?: number;
    buildingId?: string;
    timestamp?: string;
  }) => {
    const buildingId = buildings.some((building) => building.id === reading.buildingId)
      ? reading.buildingId!
      : selectedBuildingId;
    const floor = Math.max(1, Math.round(reading.floor || 2));
    const power = Math.max(0, Number(reading.power) || 0);
    const water = Math.max(0, Number(reading.water) || 0);
    const aqi = Math.max(0, Math.min(500, Number(reading.air) || 0));
    // S.E.N.S.E. displays air health (100 = best); the input service reports AQI (0 = best).
    const airQualityScore = Math.max(0, Math.round(100 - aqi / 5));

    // A resident is notified for every sensor submission, including normal
    // readings, so they know the live monitoring pipeline is receiving data.
    pushNotification({
      type: 'sensor_update',
      title: 'Sensor data received',
      message: `Floor ${floor}: ${power} kW, ${water} L/min, ${aqi} AQI recorded from the sensor node.`,
      severity: 'info',
      alertId: `sensor-reading-${buildingId}-${floor}-${Date.now()}`,
      buildingId,
      timestamp: reading.timestamp ?? now(),
    });

    setZones((previous) => previous.map((zone) =>
      zone.buildingId === buildingId && zone.floor === floor
        ? {
            ...zone,
            powerDrawKW: power,
            waterFlowLpm: water,
            airQualityScore,
            alertCount: Math.max(zone.alertCount, Number(power > 300) + Number(water > 10) + Number(aqi > 100)),
          }
        : zone
    ));

    const conditions = [
      { active: power > 300, category: 'energy' as const, title: 'High Power Usage', value: `${power} kW`, limit: '300 kW' },
      { active: water > 10, category: 'water' as const, title: 'Water Spike Alert', value: `${water} L/min`, limit: '10 L/min' },
      { active: aqi > 100, category: 'air' as const, title: 'Poor Air Quality Alert', value: `${aqi} AQI`, limit: '100 AQI' },
    ];

    conditions.filter((condition) => condition.active).forEach((condition) => {
      const id = `sensor-${buildingId}-${floor}-${condition.category}`;
      setAlerts((previous) => {
        const existing = previous.find((item) => item.id === id);
        const alert: AnomalyAlert = {
          id,
          title: condition.title,
          description: `${condition.value} received from Anomaly Input, above the configured ${condition.limit} limit.`,
          severity: condition.category === 'air' ? 'warning' : 'critical',
          category: condition.category,
          location: `Floor ${floor} · External sensor node`,
          floor,
          timestamp: reading.timestamp ?? now(),
          resolved: false,
          rootCause: 'Live external sensor reading exceeded its configured anomaly threshold.',
          recommendedAction: condition.category === 'air'
            ? 'Increase fresh-air ventilation and run an IAQ flush in the Digital Twin.'
            : 'Review the live reading and apply the relevant Digital Twin control.',
          potentialSavings: 'Pending Digital Twin containment',
          edgeConfirmed: true,
          buildingId,
        };
        return existing
          ? previous.map((item) => item.id === id ? alert : item)
          : [alert, ...previous];
      });
      const alreadyActive = alertsRef.current.some((alert) => alert.id === id && !alert.resolved);
      if (!alreadyActive) {
        pushNotification({
          type: 'new_alert',
          title: condition.title,
          message: `${condition.value} on Floor ${floor} exceeds the ${condition.limit} anomaly threshold.`,
          severity: condition.category === 'air' ? 'warning' : 'critical',
          alertId: id,
          buildingId,
          timestamp: reading.timestamp ?? now(),
        });
      }
    });
    setSelectedFloorForTwin(floor);
  }, [buildings, selectedBuildingId, pushNotification]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'SENSOR_READING' && payload.data) processExternalReading(payload.data);
      } catch {
        // Keep the dashboard usable if an external client sends malformed JSON.
      }
    };
    return () => socket.close();
  }, [processExternalReading]);

  // Allows the input page to work directly from the Vite server when the
  // optional Express/WebSocket service is not running.
  useEffect(() => {
    const readStoredTelemetry = (event?: StorageEvent) => {
      if (event?.key === 'sense_alerts' && event.newValue) {
        try { setAlerts(JSON.parse(event.newValue)); } catch { /* ignore invalid stored alerts */ }
        return;
      }
      if (event?.key === 'sense_notifications' && event.newValue) {
        try { setNotifications(JSON.parse(event.newValue)); } catch { /* ignore invalid stored notifications */ }
        return;
      }
      if (event?.key && event.key !== 'sense_external_reading') return;
      const raw = event?.newValue ?? localStorage.getItem('sense_external_reading');
      if (!raw || raw === latestLocalReadingRef.current) return;
      try {
        processExternalReading(JSON.parse(raw));
        latestLocalReadingRef.current = raw;
      } catch {
        // Ignore incomplete browser storage data.
      }
    };
    readStoredTelemetry();
    window.addEventListener('storage', readStoredTelemetry);
    return () => window.removeEventListener('storage', readStoredTelemetry);
  }, [processExternalReading]);

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

  // Alert resolution handler — owner and administrator
  const handleResolveAlert = (id: string) => {
    if (!canResolveAnomalies) return;
    const target = alerts.find((a) => a.id === id);
    if (!target) return;

    // 1. Mark alert resolved
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );

    // 2. Physically restore the affected zone baseline (flow, power, air quality, temp, alertCount)
    setZones((prev) =>
      prev.map((z) => {
        if (z.buildingId === (target.buildingId ?? selectedBuildingId) && z.floor === target.floor) {
          return restoreZoneBaseline(z, target.category);
        }
        return z;
      })
    );

    // 3. Notify all users on resolution
    pushNotification({
      type: 'resolved',
      title: `✓ Anomaly Fixed: ${target.title}`,
      message: `"${target.title}" at ${target.location} has been successfully remediated and restored to healthy baseline.`,
      severity: target.severity,
      alertId: id,
      buildingId: target.buildingId ?? selectedBuildingId,
      timestamp: now(),
    });
  };

  // Two-way interaction: Live Sync between Digital Twin and Main Platform Dashboard
  const handleLiveSyncScenario = useCallback((scenario: WhatIfScenario, targetFloor: number) => {
    if (!canManageBuilding) return;
    const targetTempC = Math.max(15, Math.min(50, scenario.targetTempC));
    const airQualityPct = Math.max(0, Math.min(100, scenario.airQualityControlPct ?? 30));

    // 1. Update BESS Battery offset across the platform
    setSolarBessOffsetsKW((previous) => ({ ...previous, [selectedBuildingId]: scenario.solarBatteryContributionKW }));

    // 2. Update Zone specific parameters (target temp, valve throttle, power, air quality)
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
            const baselineFlow = z.floor === 3 ? 5.8 : 5.0;
            newFlow = Math.max(0, Math.round(baselineFlow * (1 - throttleRatio) * 10) / 10);
          }

          // Dynamic IAQ recovery based on Air Quality ventilation actuator slider
          let newAqi = z.airQualityScore;
          if (airQualityPct >= 50) {
            // Fresh air economizer flush brings score back to healthy 90 - 96
            newAqi = Math.max(z.airQualityScore, Math.min(96, Math.round(48 + (airQualityPct / 100) * 48)));
          }

          // Power adjustments based on temperature setpoint and BESS
          let newPower = z.powerDrawKW;
          if (targetTempC >= 24 && z.powerDrawKW > 25) {
            newPower = 18.2;
          }

          // Temperature adjustment for heatwave mitigation
          let newTemp = z.temperatureC;
          if (targetTempC <= 23 && z.temperatureC > 28) {
            newTemp = 22.5;
          }

          return {
            ...z,
            targetTempC,
            temperatureC: newTemp,
            hvacStatus: targetTempC > 26 ? 'eco' : targetTempC < 19 ? 'active' : z.hvacStatus,
            valveStatus: isFullShutoff ? 'closed' : clampedValvePct > 0 ? 'throttled' : 'open',
            waterFlowLpm: newFlow,
            airQualityScore: newAqi,
            powerDrawKW: newPower,
          };
        }
        return z;
      })
    );

    // A high-power alert from Anomaly Input is resolved when the Digital Twin
    // lowers the floor's HVAC load beneath its 300 kW input threshold. This is
    // intentionally evaluated for every floor, not only the preset floor 1.
    const targetZone = activeZones.find((zone) => zone.floor === targetFloor);
    const limitedPowerKW = targetTempC >= 24 && (targetZone?.powerDrawKW ?? 0) > 25
      ? 18.2
      : (targetZone?.powerDrawKW ?? 0);
    const effectiveGridPowerKW = Math.max(0, limitedPowerKW - scenario.solarBatteryContributionKW);
    if ((targetZone?.powerDrawKW ?? 0) > 300 && effectiveGridPowerKW <= 300) {
      setAlerts((prev) =>
        prev.map((alert) => {
          const isHighPowerInputAlert = alert.buildingId === selectedBuildingId
            && alert.floor === targetFloor
            && alert.category === 'energy'
            && alert.title === 'High Power Usage'
            && !alert.resolved;
          if (!isHighPowerInputAlert) return alert;

          pushNotification({
            type: 'resolved',
            title: `✓ High Power Usage Fixed: ${alert.title}`,
            message: `Floor ${targetFloor} load reduced to ${effectiveGridPowerKW.toFixed(1)} kW by the Digital Twin actuator limits.`,
            severity: alert.severity,
            alertId: alert.id,
            buildingId: selectedBuildingId,
            timestamp: now(),
          });
          return { ...alert, resolved: true, potentialSavings: 'Contained through Digital Twin power-limit control' };
        })
      );
    }

    // 3. Check and mitigate anomalies across all categories:

    // A. Water leak anomalies (Floor 3 pipe burst, Floor 4 micro leak, custom leaks)
    if (scenario.waterValveThrottlePct >= 35) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === targetFloor && a.category === 'water' && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Water Anomaly Fixed: ${a.title}`,
              message: `"${a.title}" mitigated via solenoid throttling (${scenario.waterValveThrottlePct}%) on Floor ${targetFloor}. Flow normalized.`,
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

    // B. Air Quality anomalies (Floor 2 CO2 hazard or any air alert on targetFloor)
    if (airQualityPct >= 50) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === targetFloor && a.category === 'air' && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Air Quality Hazard Fixed: ${a.title}`,
              message: `"${a.title}" resolved via Digital Twin Fresh Air Economizer (${airQualityPct}%). CO2 purged to safe levels.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Purged via Fresh Air Damper Economizer Flush' };
          }
          return a;
        })
      );
    }

    // C. Energy surges (Chiller surge, Night lighting waste, Solar drop, Heatwave overload, Grid islanding, custom spikes)
    // 1. Chiller Surge on Floor 1
    if (targetFloor === 1 && (targetTempC >= 24 || scenario.solarBatteryContributionKW >= 150 || scenario.peakTariffMode)) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === 1 && a.category === 'energy' && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Energy Surge Fixed: ${a.title}`,
              message: `"${a.title}" curtailed via thermal floating & BESS clean power injection.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Mitigated via BESS Clean Dispatch & HVAC Setpoint Float' };
          }
          return a;
        })
      );
    }

    // 2. Solar PV Drop on Floor 4
    if (targetFloor === 4 && scenario.solarBatteryContributionKW >= 50) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === 4 && a.category === 'energy' && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Solar Deficit Fixed: ${a.title}`,
              message: `"${a.title}" bridged with ${scenario.solarBatteryContributionKW} kW BESS auxiliary clean power.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Deficit bridged via Rooftop BESS injection' };
          }
          return a;
        })
      );
    }

    // 3. Heatwave Overload on Floor 2
    if (targetFloor === 2 && targetTempC <= 23 && airQualityPct >= 40) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === 2 && (a.title.includes('Heatwave') || a.category === 'energy') && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Thermal Overload Fixed: ${a.title}`,
              message: `"${a.title}" mitigated via pre-cooling and economizer ventilation. Temperature normalized.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Thermal overload contained via pre-cooling' };
          }
          return a;
        })
      );
    }

    // 4. Night Waste on Floor 1
    if (targetFloor === 1 && (scenario.peakTariffMode || scenario.solarBatteryContributionKW >= 50)) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === 1 && a.title.includes('Night') && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Unscheduled Waste Fixed: ${a.title}`,
              message: `"${a.title}" curtailed via automated off-schedule power dispatch.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Curtailed via load shedding' };
          }
          return a;
        })
      );
    }

    // 5. Grid Islanding on Floor 1
    if (targetFloor === 1 && scenario.solarBatteryContributionKW >= 250) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === 1 && a.title.includes('Grid') && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Microgrid Islanding Active: ${a.title}`,
              message: `"${a.title}" contained: utility tie isolated, BESS dispatched at ${scenario.solarBatteryContributionKW} kW.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Zero downtime achieved via clean islanding' };
          }
          return a;
        })
      );
    }
  }, [activeZones, canManageBuilding, selectedBuildingId, pushNotification]);

  // Applying Digital Twin scenario permanently to physical actuators
  const handleApplyChanges = (scenario: WhatIfScenario, targetFloor: number) => {
    handleLiveSyncScenario(scenario, targetFloor);
  };

  // Breaker Toggle in Actuators (directly alters Dashboard live power)
  const handleToggleBreaker = (floorId: string) => {
    if (!canManageBuilding) return;
    const target = activeZones.find((z) => z.id === floorId);
    const willBeOff = target?.breakerStatus === 'on';

    setZones((prev) =>
      prev.map((z) =>
        z.id === floorId
          ? {
              ...z,
              breakerStatus: willBeOff ? 'off' : 'on',
              powerDrawKW: willBeOff ? 0 : (getZoneBaseline(z.floor).powerDrawKW ?? 15.2),
            }
          : z
      )
    );

    if (target && willBeOff) {
      // If breaker turned off, resolve any active energy alert on this floor
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === target.floor && a.category === 'energy' && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Circuit Isolated: ${a.title}`,
              message: `"${a.title}" contained via sub-panel breaker isolation on Floor ${target.floor}.`,
              severity: a.severity,
              alertId: a.id,
              buildingId: selectedBuildingId,
              timestamp: now(),
            });
            return { ...a, resolved: true, potentialSavings: 'Contained via Breaker Isolation' };
          }
          return a;
        })
      );
    }
  };

  // Valve Toggle in Actuators (directly alters Dashboard live water flow)
  const handleToggleValve = (floorId: string) => {
    if (!canManageBuilding) return;
    const target = activeZones.find((z) => z.id === floorId);
    const isNowClosed = target ? (target.valveStatus === 'open' || target.valveStatus === 'throttled') : false;

    setZones((prev) =>
      prev.map((z) => {
        if (z.id === floorId) {
          return {
            ...z,
            valveStatus: isNowClosed ? 'closed' : 'open',
            waterFlowLpm: isNowClosed ? 0 : (getZoneBaseline(z.floor).waterFlowLpm ?? 5.4),
          };
        }
        return z;
      })
    );

    // If valve closed on any floor, resolve active water alerts on that floor
    if (target && isNowClosed) {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.buildingId === selectedBuildingId && a.floor === target.floor && a.category === 'water' && !a.resolved) {
            pushNotification({
              type: 'resolved',
              title: `✓ Water Flow Isolated: ${a.title}`,
              message: `"${a.title}" mitigated via physical solenoid isolation on Floor ${target.floor}. Flow safely contained.`,
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
    pushNotification({
      type: 'resolved',
      title: '✓ Building Systems Reset to Baseline',
      message: `All telemetry zones and actuators across ${activeBuilding?.name ?? 'building'} restored to nominal baseline.`,
      severity: 'info',
      alertId: `reset-${Date.now()}`,
      buildingId: selectedBuildingId,
      timestamp: now(),
    });
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

        {currentTab === 'firewall' && session.role === 'administrator' && <FirewallDatabase />}
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

      {/* Real-time Floating Toast Alert (Received immediately across all views & resident dashboard) */}
      {activeToast && (
        <aside
          id="realtime-alert-toast"
          aria-live="polite"
          className={`live-toast ${activeToast.type}`}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '14px 18px',
            background: 'var(--bg-surface-elevated)',
            border: `1px solid ${activeToast.type === 'resolved' ? 'var(--accent-emerald)' : activeToast.type === 'sensor_update' ? 'var(--accent-cyan)' : 'var(--accent-rose)'}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(16px)',
            maxWidth: 440,
            animation: 'toast-slide-in 0.25s ease-out',
          }}
        >
          <div style={{ marginTop: 2, flexShrink: 0 }}>
            {activeToast.type === 'resolved' ? (
              <CheckCircle2 size={20} color="var(--accent-emerald)" />
            ) : activeToast.type === 'sensor_update' ? (
              <Sparkles size={20} color="var(--accent-cyan)" />
            ) : (
              <AlertTriangle size={20} color="var(--accent-rose)" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
              {activeToast.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {activeToast.message}
            </div>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            title="Dismiss notification"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              marginLeft: 4,
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </aside>
      )}
    </div>
  );
};
