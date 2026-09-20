import { describe, it, expect } from 'vitest';
import { runWhatIfSimulation } from '../services/digitalTwin';
import { INITIAL_ZONES } from '../services/telemetryEngine';
import { WhatIfScenario } from '../types/sense';

describe('digitalTwin simulation', () => {
  it('should calculate projected savings when setpoint is floated', () => {
    const scenario: WhatIfScenario = {
      targetTempC: 23.5,
      tempSetpointDelta: 1.5,
      waterValveThrottlePct: 0,
      solarBatteryContributionKW: 10,
      peakTariffMode: true,
      livePlatformSync: true,
      airQualityControlPct: 30,
    };

    const result = runWhatIfSimulation(scenario, INITIAL_ZONES);
    expect(result.projectedCostSavingsPct).toBeGreaterThan(0);
    expect(result.projectedEnergyReductionKWh).toBeGreaterThan(0);
    expect(result.projectedCarbonSavedKg).toBeGreaterThan(0);
    expect(result.comfortImpactScore).toBeGreaterThanOrEqual(10);
    expect(result.comfortImpactScore).toBeLessThanOrEqual(100);
    expect(result.feasible).toBe(true);
  });

  it('derives the HVAC delta from target temperature rather than a stale UI value', () => {
    const baseline: WhatIfScenario = {
      targetTempC: 22,
      tempSetpointDelta: 0,
      waterValveThrottlePct: 0,
      solarBatteryContributionKW: 0,
      peakTariffMode: false,
      livePlatformSync: false,
      airQualityControlPct: 30,
    };
    const staleDeltaScenario: WhatIfScenario = {
      ...baseline,
      targetTempC: 24,
      tempSetpointDelta: 0,
    };

    expect(runWhatIfSimulation(staleDeltaScenario, INITIAL_ZONES).projectedEnergyReductionKWh)
      .toBeGreaterThan(runWhatIfSimulation(baseline, INITIAL_ZONES).projectedEnergyReductionKWh);
  });

  it('should accurately reflect 100% water shutoff when solenoid valve is throttled', () => {
    const scenario: WhatIfScenario = {
      targetTempC: 22.0,
      tempSetpointDelta: 0,
      waterValveThrottlePct: 100, // 100% total isolation
      solarBatteryContributionKW: 0,
      peakTariffMode: false,
      livePlatformSync: true,
      airQualityControlPct: 30,
    };

    const result = runWhatIfSimulation(scenario, INITIAL_ZONES);
    expect(result.projectedWaterSavedKL).toBeGreaterThan(0);
    expect(result.recommendation).toContain('100% solenoid shutoff');
  });

  it('should support up to 500 kW solar BESS battery dispatch', () => {
    const scenario: WhatIfScenario = {
      targetTempC: 22.0,
      tempSetpointDelta: 0,
      waterValveThrottlePct: 0,
      solarBatteryContributionKW: 500, // 500 kW BESS
      peakTariffMode: true,
      livePlatformSync: true,
      airQualityControlPct: 30,
    };

    const result = runWhatIfSimulation(scenario, INITIAL_ZONES);
    expect(result.projectedEnergyReductionKWh).toBeGreaterThan(0);
    expect(result.recommendation).toContain('High-capacity BESS');
  });

  it('should handle up to 50°C target temperature and warn of heat stress', () => {
    const highTempScenario: WhatIfScenario = {
      targetTempC: 50.0, // 50°C industrial limit
      tempSetpointDelta: 28.0,
      waterValveThrottlePct: 0,
      solarBatteryContributionKW: 0,
      peakTariffMode: false,
      livePlatformSync: false,
      airQualityControlPct: 30,
    };

    const result = runWhatIfSimulation(highTempScenario, INITIAL_ZONES);
    expect(result.feasible).toBe(false);
    expect(result.recommendation).toContain('50°C');
  });

  it('should support 0-100% air quality ventilation and trigger IAQ flush mode', () => {
    const flushScenario: WhatIfScenario = {
      targetTempC: 22.0,
      tempSetpointDelta: 0,
      waterValveThrottlePct: 0,
      solarBatteryContributionKW: 0,
      peakTariffMode: false,
      livePlatformSync: true,
      airQualityControlPct: 100, // 100% Emergency IAQ Economizer Purge
    };

    const result = runWhatIfSimulation(flushScenario, INITIAL_ZONES);
    expect(result.comfortImpactScore).toBeGreaterThanOrEqual(50);
    expect(result.recommendation).toContain('Emergency IAQ Flush');
  });

  it('should penalize comfort when air quality ventilation is below minimum threshold', () => {
    const poorVentScenario: WhatIfScenario = {
      targetTempC: 22.0,
      tempSetpointDelta: 0,
      waterValveThrottlePct: 0,
      solarBatteryContributionKW: 0,
      peakTariffMode: false,
      livePlatformSync: false,
      airQualityControlPct: 10, // Inadequate fresh air
    };

    const standardVentScenario: WhatIfScenario = {
      ...poorVentScenario,
      airQualityControlPct: 50, // Standard healthy ventilation
    };

    const poorResult = runWhatIfSimulation(poorVentScenario, INITIAL_ZONES);
    const standardResult = runWhatIfSimulation(standardVentScenario, INITIAL_ZONES);
    expect(poorResult.comfortImpactScore).toBeLessThan(standardResult.comfortImpactScore);
  });
});
