import { AnomalyAlert, FloorZone } from '../types/sense';

// Initial default zones representing the 4-layer building
export const INITIAL_ZONES: FloorZone[] = [
  {
    id: 'floor-1',
    name: 'Floor 1 · Commercial & Lobby',
    floor: 1,
    areaSqM: 650,
    occupants: 34,
    temperatureC: 22.4,
    targetTempC: 22.0,
    powerDrawKW: 18.2,
    waterFlowLpm: 6.4,
    airQualityScore: 92,
    hvacStatus: 'active',
    valveStatus: 'open',
    breakerStatus: 'on',
    alertCount: 0,
  },
  {
    id: 'floor-2',
    name: 'Floor 2 · Residential Units 201-208',
    floor: 2,
    areaSqM: 580,
    occupants: 22,
    temperatureC: 23.1,
    targetTempC: 22.5,
    powerDrawKW: 14.8,
    waterFlowLpm: 5.1,
    airQualityScore: 89,
    hvacStatus: 'eco',
    valveStatus: 'open',
    breakerStatus: 'on',
    alertCount: 0,
  },
  {
    id: 'floor-3',
    name: 'Floor 3 · Residential Units 301-308',
    floor: 3,
    areaSqM: 580,
    occupants: 19,
    temperatureC: 23.8,
    targetTempC: 22.5,
    powerDrawKW: 16.5,
    waterFlowLpm: 28.4, // elevated flow indicating initial leak
    airQualityScore: 86,
    hvacStatus: 'active',
    valveStatus: 'open',
    breakerStatus: 'on',
    alertCount: 1,
  },
  {
    id: 'floor-4',
    name: 'Floor 4 · Suites 401-404 & Rooftop',
    floor: 4,
    areaSqM: 420,
    occupants: 11,
    temperatureC: 21.9,
    targetTempC: 21.5,
    powerDrawKW: 11.2,
    waterFlowLpm: 3.8,
    airQualityScore: 95,
    hvacStatus: 'eco',
    valveStatus: 'open',
    breakerStatus: 'on',
    alertCount: 0,
  },
];

export const INITIAL_ALERTS: AnomalyAlert[] = [
  {
    id: 'alt-101',
    title: 'Water flow spike — Floor 3 Riser',
    description: 'Continuous flow of 28.4 L/min detected on Floor 3 with only 19 occupants. Deviation +140% above baseline.',
    severity: 'critical',
    category: 'water',
    location: 'Floor 3 · Residential Riser B',
    unitId: 'Unit 304',
    floor: 3,
    timestamp: '12 mins ago',
    resolved: false,
    rootCause: 'Probable solenoid seal degradation or fixture leak in Unit 304 bathroom pipe.',
    recommendedAction: 'Simulate valve throttling in Digital Twin or throttle Solenoid Valve 3B by 60% (or 100% shutoff).',
    potentialSavings: '1,450 Litres / day ($24.80/day)',
    edgeConfirmed: true,
  },
  {
    id: 'alt-102',
    title: 'Peak Tariff Pre-Warning & Demand Surge',
    description: 'Commercial grid entering 4x peak tariff rate in 35 mins. Chiller load currently at 82% capacity.',
    severity: 'warning',
    category: 'energy',
    location: 'Central Chiller Plant · Basement',
    floor: 1,
    timestamp: '28 mins ago',
    resolved: false,
    rootCause: 'HVAC setpoint at 21.5°C pulling 18.2 kW prior to thermal storage cycle.',
    recommendedAction: 'DRL recommends pre-cooling building by 0.8°C now and dispatching BESS battery.',
    potentialSavings: '48.5 kWh ($38.20 during peak)',
    edgeConfirmed: true,
  },
];

// Rich Library of Diverse Simulated Anomalies across Water, Energy, Air Quality, and Grid Systems
export interface AnomalyPreset {
  id: string;
  name: string;
  category: 'water' | 'energy' | 'air' | 'occupancy';
  severity: 'critical' | 'warning' | 'info';
  targetFloor: number;
  description: string;
  rootCause: string;
  recommendedAction: string;
  potentialSavings: string;
  applyToZone: (zone: FloorZone) => FloorZone;
}

export const ANOMALY_PRESETS: AnomalyPreset[] = [
  {
    id: 'preset-pipe-burst',
    name: 'Floor 3 Solenoid Pipe Rupture (Critical Leak)',
    category: 'water',
    severity: 'critical',
    targetFloor: 3,
    description: 'High-velocity water flow spike jumping to 44.5 L/min on Floor 3 secondary line.',
    rootCause: 'Mechanical pipe joint rupture or stuck open bypass valve.',
    recommendedAction: 'Engage 100% Solenoid Valve Shutoff in Digital Twin or Actuators panel.',
    potentialSavings: '3,200 Litres / day ($48.00/day)',
    applyToZone: (z) => ({ ...z, waterFlowLpm: 44.5, valveStatus: 'open', alertCount: z.alertCount + 1 }),
  },
  {
    id: 'preset-chiller-surge',
    name: 'Central Chiller Compressor Surge & Thermal Cycling',
    category: 'energy',
    severity: 'critical',
    targetFloor: 1,
    description: 'Commercial chiller drawing 42.8 kW (+135% above rated baseline) as spot tariff spikes.',
    rootCause: 'Low evaporator refrigerant delta-T causing continuous high-speed compressor lockup.',
    recommendedAction: 'Float HVAC setpoint up to 24.5°C and dispatch 200 kW BESS clean battery.',
    potentialSavings: '95 kWh / peak cycle ($82.00)',
    applyToZone: (z) => ({ ...z, powerDrawKW: 42.8, hvacStatus: 'active', alertCount: z.alertCount + 1 }),
  },
  {
    id: 'preset-co2-hazard',
    name: 'Floor 2 Indoor Air Quality (IAQ) / CO2 Spike Hazard',
    category: 'air',
    severity: 'warning',
    targetFloor: 2,
    description: 'CO2 levels reached 2,250 ppm on Floor 2. Occupant drowsiness risk flagged.',
    rootCause: 'Fresh air intake damper jammed shut at 10% minimum position.',
    recommendedAction: 'Override HVAC to 100% Economizer fresh air flush mode in Digital Twin.',
    potentialSavings: 'Prevents productivity loss and satisfies ASHRAE 62.1 ventilation standards.',
    applyToZone: (z) => ({ ...z, airQualityScore: 48, temperatureC: 25.2, alertCount: z.alertCount + 1 }),
  },
  {
    id: 'preset-micro-leak',
    name: 'Micro Flapper Water Leak (Silent Cumulative Drain)',
    category: 'water',
    severity: 'info',
    targetFloor: 4,
    description: 'Continuous persistent 3.2 L/min flow detected on Floor 4 during zero-occupancy night window.',
    rootCause: 'Degraded toilet solenoid seal or slow cistern overflow siphon.',
    recommendedAction: 'Throttle Unit 402 Solenoid Valve by 40% until maintenance inspection.',
    potentialSavings: '460 Litres / day ($12.50/day)',
    applyToZone: (z) => ({ ...z, waterFlowLpm: 8.5, alertCount: z.alertCount + 1 }),
  },
  {
    id: 'preset-night-waste',
    name: 'Ghost Occupancy / Unscheduled Lighting Waste',
    category: 'energy',
    severity: 'warning',
    targetFloor: 1,
    description: 'Continuous 12.5 kW lighting draw detected in Floor 1 lobby during scheduled dark hours.',
    rootCause: 'Lobby astronomical timeclock overridden to manual ON after maintenance.',
    recommendedAction: 'Send automated off-schedule curtailment signal to lighting sub-panel.',
    potentialSavings: '28.0 kWh ($19.60/night)',
    applyToZone: (z) => ({ ...z, powerDrawKW: z.powerDrawKW + 12.5, alertCount: z.alertCount + 1 }),
  },
  {
    id: 'preset-solar-drop',
    name: 'Rooftop Solar Inverter Phase Drop & Ground Fault',
    category: 'energy',
    severity: 'warning',
    targetFloor: 4,
    description: 'Solar PV generation collapsed from 24 kW to 4.2 kW during peak solar irradiance.',
    rootCause: 'Phase B inverter ground fault or string disconnect in array 2.',
    recommendedAction: 'Dispatch auxiliary BESS battery bank to bridge midday solar deficit.',
    potentialSavings: '120 kWh clean solar energy recovered ($26.40/day)',
    applyToZone: (z) => ({ ...z, powerDrawKW: z.powerDrawKW + 8.0, alertCount: z.alertCount + 1 }),
  },
  {
    id: 'preset-heatwave',
    name: 'Extreme Heatwave / Thermal Overload (45°C Ambience)',
    category: 'energy',
    severity: 'critical',
    targetFloor: 2,
    description: 'Severe ambient heatwave causing indoor temperatures to climb rapidly toward 32°C.',
    rootCause: 'Solar heat gain exceeding design envelope; thermal lag saturation.',
    recommendedAction: 'Engage DRL multi-objective pre-cooling and roll out dynamic solar shading.',
    potentialSavings: 'Protects critical equipment and prevents thermal tripouts.',
    applyToZone: (z) => ({ ...z, temperatureC: 31.5, powerDrawKW: 26.5, alertCount: z.alertCount + 1 }),
  },
  {
    id: 'preset-grid-islanding',
    name: 'Grid Frequency Instability / Islanding Switchover',
    category: 'energy',
    severity: 'critical',
    targetFloor: 1,
    description: 'Utility grid frequency dropped to 48.8 Hz. Risk of brownout across commercial feeder.',
    rootCause: 'Regional grid substation transformer trip.',
    recommendedAction: 'Initiate microgrid islanding mode: disconnect utility tie, ramp BESS to 350 kW.',
    potentialSavings: 'Zero downtime for residential life-safety and refrigeration circuits.',
    applyToZone: (z) => ({ ...z, breakerStatus: 'on', alertCount: z.alertCount + 1 }),
  },
];

// Returns nominal baseline telemetry values for each floor
export function getZoneBaseline(floor: number): Partial<FloorZone> {
  switch (floor) {
    case 1:
      return { powerDrawKW: 18.2, waterFlowLpm: 6.4, airQualityScore: 92, temperatureC: 22.4, targetTempC: 22.0, hvacStatus: 'active', valveStatus: 'open', breakerStatus: 'on' };
    case 2:
      return { powerDrawKW: 14.8, waterFlowLpm: 5.1, airQualityScore: 89, temperatureC: 23.1, targetTempC: 22.5, hvacStatus: 'eco', valveStatus: 'open', breakerStatus: 'on' };
    case 3:
      return { powerDrawKW: 16.5, waterFlowLpm: 5.8, airQualityScore: 90, temperatureC: 22.5, targetTempC: 22.5, hvacStatus: 'active', valveStatus: 'open', breakerStatus: 'on' };
    case 4:
    default:
      return { powerDrawKW: 11.2, waterFlowLpm: 3.8, airQualityScore: 95, temperatureC: 21.9, targetTempC: 21.5, hvacStatus: 'eco', valveStatus: 'open', breakerStatus: 'on' };
  }
}

// Restores healthy telemetry baselines when an anomaly is resolved or mitigated
export function restoreZoneBaseline(zone: FloorZone, category?: 'water' | 'energy' | 'air' | 'occupancy'): FloorZone {
  const base = getZoneBaseline(zone.floor);
  const updated = { ...zone, alertCount: Math.max(0, zone.alertCount - 1) };
  if (!category) {
    return {
      ...zone,
      powerDrawKW: base.powerDrawKW ?? zone.powerDrawKW,
      waterFlowLpm: base.waterFlowLpm ?? zone.waterFlowLpm,
      airQualityScore: base.airQualityScore ?? zone.airQualityScore,
      temperatureC: base.temperatureC ?? zone.temperatureC,
      valveStatus: 'open',
      breakerStatus: 'on',
      alertCount: 0,
    };
  }

  if (category === 'water') {
    updated.waterFlowLpm = base.waterFlowLpm ?? 5.0;
    updated.valveStatus = 'open';
  } else if (category === 'energy') {
    updated.powerDrawKW = base.powerDrawKW ?? 14.0;
    updated.temperatureC = base.temperatureC ?? 22.5;
    updated.breakerStatus = 'on';
  } else if (category === 'air') {
    updated.airQualityScore = base.airQualityScore ?? 92;
    updated.temperatureC = base.temperatureC ?? 22.5;
  }
  return updated;
}

// Generate 24 data points representing the last 24 hours of building consumption
export function generate24HourHistory(currentPowerKW: number = 60.7, currentWaterLpm: number = 43.7): Array<{
  hour: string;
  energyKW: number;
  waterFlowLpm: number;
  baselineKW: number;
  costRate: number;
}> {
  const data = [];
  const currentHour = new Date().getHours();

  for (let i = 23; i >= 0; i--) {
    const h = (currentHour - i + 24) % 24;
    const timeLabel = `${h.toString().padStart(2, '0')}:00`;

    // Diurnal curve
    let baseLoad = 18;
    if (h >= 6 && h <= 9) baseLoad = 38;
    else if (h > 9 && h <= 17) baseLoad = 52;
    else if (h > 17 && h <= 21) baseLoad = 62;
    else if (h > 21 || h < 6) baseLoad = 14;

    let energy = Math.round((baseLoad + (Math.sin(h * 0.5) * 4)) * 10) / 10;
    let water = Math.round((baseLoad * 0.45 + (Math.cos(h * 0.4) * 3)) * 10) / 10;

    // For the most recent hour (Now), bind directly to live platform totals!
    if (i === 0) {
      energy = Math.round(currentPowerKW * 10) / 10;
      water = Math.round(currentWaterLpm * 10) / 10;
    }

    const baseline = Math.round((baseLoad * 1.15) * 10) / 10;
    const costRate = (h >= 17 && h <= 20) ? 0.45 : 0.18;

    data.push({
      hour: timeLabel,
      energyKW: Math.max(1, energy),
      waterFlowLpm: Math.max(0, water),
      baselineKW: baseline,
      costRate,
    });
  }

  return data;
}

// Compute live dynamic building metrics directly derived from zones and actuators
export function computeBuildingMetrics(zones: FloorZone[], solarBessOffsetKW: number = 0) {
  // Real-time grid power draw: sum of all active breakers minus solar/BESS injection
  const grossPowerKW = zones.reduce((sum, z) => sum + (z.breakerStatus === 'on' ? z.powerDrawKW : 0), 0);
  const netGridPowerKW = Math.max(0, Math.round((grossPowerKW - solarBessOffsetKW) * 10) / 10);

  // Real-time water flow: sum of all active valves (closed = 0)
  const totalWaterLpm = zones.reduce((sum, z) => sum + (z.valveStatus === 'closed' ? 0 : z.waterFlowLpm), 0);
  const roundedWaterLpm = Math.round(totalWaterLpm * 10) / 10;

  const totalOccupants = zones.reduce((sum, z) => sum + z.occupants, 0);
  const avgAqi = Math.round(zones.reduce((sum, z) => sum + z.airQualityScore, 0) / (zones.length || 1));

  // Dynamic Energy Today (kWh): dynamically scales with current net grid draw
  // Typical daily multiplier ~ 5.2x current active load
  const energyTodayKWh = Math.round(netGridPowerKW * 5.2 * 10) / 10;

  // Dynamic Water Today (kL): dynamically scales with current flow
  // 1 L/min running continuously is ~ 0.08 kL/hr
  const waterUsageTodayKL = Math.round((roundedWaterLpm * 60 * 14 / 1000) * 10) / 10;

  // Dynamic Health Score (0 - 100)
  let health = 95;
  if (roundedWaterLpm > 30) health -= 12; // leak penalty
  else if (roundedWaterLpm === 0) health += 2;
  if (netGridPowerKW > 70) health -= 8;   // power overload penalty
  if (avgAqi < 80) health -= 6;           // IAQ penalty
  if (solarBessOffsetKW > 50) health += 4;// green energy bonus
  health = Math.max(35, Math.min(100, Math.round(health)));

  return {
    healthScore: health,
    netGridPowerKW,
    grossPowerKW: Math.round(grossPowerKW * 10) / 10,
    totalWaterLpm: roundedWaterLpm,
    totalOccupants,
    avgAqi,
    energyTodayKWh,
    waterUsageTodayKL,
  };
}
