import { describe, it, expect } from 'vitest';
import {
  generate24HourHistory,
  computeBuildingMetrics,
  INITIAL_ZONES,
  ANOMALY_PRESETS,
} from '../services/telemetryEngine';

describe('telemetryEngine', () => {
  it('should generate 24 data points for historical consumption trend', () => {
    const history = generate24HourHistory(55, 20);
    expect(history).toHaveLength(24);
    expect(history[0]).toHaveProperty('hour');
    expect(history[0]).toHaveProperty('energyKW');
    expect(history[0]).toHaveProperty('waterFlowLpm');
    expect(history[0]).toHaveProperty('baselineKW');
    // Ensure current hour matches the live input
    expect(history[23].energyKW).toBe(55);
    expect(history[23].waterFlowLpm).toBe(20);
  });

  it('should dynamically compute building metrics and health index', () => {
    const metrics = computeBuildingMetrics(INITIAL_ZONES, 0);
    expect(metrics.healthScore).toBeGreaterThanOrEqual(35);
    expect(metrics.healthScore).toBeLessThanOrEqual(100);
    expect(metrics.grossPowerKW).toBeGreaterThan(0);
    expect(metrics.totalWaterLpm).toBeGreaterThan(0);
    expect(metrics.totalOccupants).toBe(86);
  });

  it('should offset net grid power when solar BESS battery is active', () => {
    const standardMetrics = computeBuildingMetrics(INITIAL_ZONES, 0);
    const bessMetrics = computeBuildingMetrics(INITIAL_ZONES, 30);
    expect(bessMetrics.netGridPowerKW).toBeLessThan(standardMetrics.netGridPowerKW);
    expect(bessMetrics.energyTodayKWh).toBeLessThan(standardMetrics.energyTodayKWh);
  });

  it('should zero out power or water when breakers or valves are isolated', () => {
    const isolatedZones = INITIAL_ZONES.map((z) => ({
      ...z,
      breakerStatus: 'off' as const,
      valveStatus: 'closed' as const,
    }));

    const metrics = computeBuildingMetrics(isolatedZones, 0);
    expect(metrics.netGridPowerKW).toBe(0);
    expect(metrics.totalWaterLpm).toBe(0);
  });

  it('should have a rich library of at least 8 anomaly presets across categories', () => {
    expect(ANOMALY_PRESETS.length).toBeGreaterThanOrEqual(8);
    const categories = new Set(ANOMALY_PRESETS.map((p) => p.category));
    expect(categories.has('water')).toBe(true);
    expect(categories.has('energy')).toBe(true);
    expect(categories.has('air')).toBe(true);
  });
});
