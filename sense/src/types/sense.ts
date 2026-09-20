export type UserRole = 'administrator' | 'owner' | 'user';

export type TabView = 'dashboard' | 'digital_twin' | 'analytics' | 'alerts' | 'controls' | 'settings' | 'firewall';

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  unitId?: string;
  avatar?: string;
  buildingId?: string;
}

export interface Building {
  id: string;
  name: string;
  location: string;
  areaSqM: number;
  floorCount: number;
  ownerEmail: string;
}

export interface SensorReading {
  timestamp: string;
  energyKW: number;        // Real-time power in kW
  waterFlowLpm: number;    // Water flow in Litres per minute
  temperatureC: number;    // Ambient temp in °C
  humidityPct: number;     // Relative humidity %
  co2Ppm: number;          // Air quality CO2 in ppm
  occupancyCount: number;  // Detected occupants
}

export interface AnomalyAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'water' | 'energy' | 'air' | 'occupancy';
  location: string;
  unitId?: string;
  floor: number;
  timestamp: string;
  resolved: boolean;
  rootCause: string;
  recommendedAction: string;
  potentialSavings: string;
  edgeConfirmed: boolean;
  buildingId?: string;
}

export interface AppNotification {
  id: string;
  type: 'new_alert' | 'resolved' | 'sensor_update';
  audience: 'user';
  title: string;
  message: string;
  severity?: 'critical' | 'warning' | 'info';
  alertId: string;
  buildingId: string;
  timestamp: string;
  read: boolean;
}

export interface FloorZone {
  id: string;
  name: string;
  floor: number;
  areaSqM: number;
  occupants: number;
  temperatureC: number;
  targetTempC: number;
  powerDrawKW: number;
  waterFlowLpm: number;
  airQualityScore: number; // 0-100
  hvacStatus: 'active' | 'eco' | 'off';
  valveStatus: 'open' | 'throttled' | 'closed';
  breakerStatus: 'on' | 'off';
  alertCount: number;
  buildingId?: string;
}

export interface WhatIfScenario {
  targetTempC: number;                // Absolute target temp, up to 50°C
  tempSetpointDelta: number;          // Delta from baseline, calculated
  waterValveThrottlePct: number;      // 0 - 100%
  solarBatteryContributionKW: number; // 0 - 500 kW BESS
  peakTariffMode: boolean;
  livePlatformSync: boolean;          // Instant two-way interaction with main platform
  airQualityControlPct: number;       // 0 - 100% Fresh Air Ventilation & Economizer Flush
}

export interface SimulationResult {
  projectedCostSavingsPct: number;
  projectedEnergyReductionKWh: number;
  projectedWaterSavedKL: number;
  projectedCarbonSavedKg: number;
  comfortImpactScore: number; // 0 (poor) - 100 (optimal)
  feasible: boolean;
  recommendation: string;
}

export interface DrlWeights {
  comfort: number;  // 0 - 100
  cost: number;     // 0 - 100
  carbon: number;   // 0 - 100
}

export interface FederatedBuildingNode {
  id: string;
  name: string;
  location: string;
  unitsCount: number;
  modelAccuracyPct: number;
  roundNumber: number;
  lastWeightSync: string;
  encryptionStatus: 'AES-256 GCM' | 'Homomorphic';
  dataLeakageRate: '0.00% (Strict Edge)';
}
