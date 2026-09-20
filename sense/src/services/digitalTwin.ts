import { WhatIfScenario, SimulationResult, FloorZone } from '../types/sense';

export function runWhatIfSimulation(
  scenario: WhatIfScenario,
  zones: FloorZone[]
): SimulationResult {
  // The target is the source of truth.  Do not rely on a caller-provided delta,
  // which can be left over after the selected floor or slider value changes.
  const targetTempC = Math.max(15, Math.min(50, scenario.targetTempC));
  const delta = Math.round((targetTempC - 22) * 10) / 10;
  const currentTotalPowerKW = zones.reduce((sum, z) => sum + z.powerDrawKW, 0);
  const currentTotalWaterLpm = zones.reduce((sum, z) => sum + z.waterFlowLpm, 0);

  // 1. Energy reduction from thermostat adjustment
  // Baseline is ~22°C. For every 1°C delta above baseline in cooling mode, ~7% savings.
  const hvacSavingsFactor = delta > 0 ? Math.min(0.65, delta * 0.07) : Math.max(-0.4, delta * 0.08);
  let energySavedKW = currentTotalPowerKW * 0.45 * hvacSavingsFactor;

  // Add solar / BESS battery injection (scaled from 0 to 500 kW)
  // BESS battery offsets grid draw directly
  energySavedKW += Math.min(currentTotalPowerKW * 0.95, scenario.solarBatteryContributionKW);

  // Peak tariff load shedding multiplier
  if (scenario.peakTariffMode) {
    energySavedKW += currentTotalPowerKW * 0.12;
  }

  // 2. Water savings from throttling (0 to 100%)
  const throttleFraction = Math.max(0, Math.min(1.0, scenario.waterValveThrottlePct / 100));
  const waterSavedLpm = currentTotalWaterLpm * throttleFraction;
  const waterSavedKLPerDay = (waterSavedLpm * 60 * 24) / 1000;

  // 3. 24H accumulated projections
  const projectedEnergyReductionKWh = Math.round(Math.max(0, energySavedKW * 24) * 10) / 10;
  const standardKWhRate = scenario.peakTariffMode ? 0.38 : 0.22;
  const costSavingsDollars = (projectedEnergyReductionKWh * standardKWhRate) + (waterSavedKLPerDay * 3.80);
  const baselineDayCost = (currentTotalPowerKW * 24 * 0.24) + ((currentTotalWaterLpm * 60 * 24 / 1000) * 3.80);

  const projectedCostSavingsPct = Math.min(95, Math.max(0, Math.round((costSavingsDollars / (baselineDayCost || 1)) * 100)));

  // 4. Carbon savings (0.82 kg CO2 per kWh grid average)
  const projectedCarbonSavedKg = Math.round(projectedEnergyReductionKWh * 0.82 * 10) / 10;

  // 5. Comfort impact score (100 is ideal)
  let comfortScore = 100;
  // If target temperature exceeds 26°C or is set up to 50°C
  if (targetTempC > 24) {
    comfortScore -= (targetTempC - 24) * 3.2;
  } else if (targetTempC < 20) {
    comfortScore -= (20 - targetTempC) * 5;
  }

  // If water is throttled excessively
  if (scenario.waterValveThrottlePct > 60) {
    comfortScore -= (scenario.waterValveThrottlePct - 60) * 0.75;
  }

  // Air Quality & Ventilation impact on comfort
  const airQualityPct = Math.max(0, Math.min(100, scenario.airQualityControlPct ?? 30));
  if (airQualityPct < 20) {
    comfortScore -= 8; // Inadequate fresh air intake / drowsiness penalty
  } else if (airQualityPct >= 50) {
    comfortScore += 5; // Clean air / ASHRAE 62.1 comfort bonus
  }
  comfortScore = Math.max(5, Math.min(100, Math.round(comfortScore)));

  // 6. Feasibility validation
  const feasible = comfortScore >= 30 && targetTempC <= 42;

  let recommendation = 'Optimal balance between resource conservation, air quality, and tenant satisfaction.';
  if (targetTempC > 38) {
    recommendation = 'Critical Warning: 50°C thermal setpoint induces extreme heat stress. Suitable only for industrial kiln or bake-out mode.';
  } else if (scenario.waterValveThrottlePct === 100) {
    recommendation = 'Emergency Water Isolation: 100% solenoid shutoff engaged. Complete leak containment achieved.';
  } else if (airQualityPct === 100) {
    recommendation = 'Emergency IAQ Flush: 100% fresh air economizer purge active, CO2 hazard flushed to safe levels.';
  } else if (scenario.solarBatteryContributionKW >= 250) {
    recommendation = 'Grid-Independence: High-capacity BESS injecting massive clean power, achieving near-zero utility reliance.';
  } else if (airQualityPct >= 70) {
    recommendation = 'Enhanced Ventilation: High economizer flush engaged, delivering rapid contaminant extraction and ASHRAE 62.1 compliance.';
  } else if (comfortScore < 60) {
    recommendation = 'Warning: Predicted indoor temperature deviates significantly from ASHRAE 55 standard.';
  } else if (projectedCostSavingsPct > 35) {
    recommendation = 'High efficiency capture: Substantial cost reduction achieved with resilient comfort bounds.';
  }

  return {
    projectedCostSavingsPct,
    projectedEnergyReductionKWh,
    projectedWaterSavedKL: Math.round(waterSavedKLPerDay * 10) / 10,
    projectedCarbonSavedKg,
    comfortImpactScore: comfortScore,
    feasible,
    recommendation,
  };
}
