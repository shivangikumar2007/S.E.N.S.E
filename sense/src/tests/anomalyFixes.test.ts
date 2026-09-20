import { describe, it, expect } from 'vitest';
import {
  INITIAL_ZONES,
  ANOMALY_PRESETS,
  restoreZoneBaseline,
  getZoneBaseline,
} from '../services/telemetryEngine';

describe('Anomaly Fixes and Baseline Restoration', () => {
  it('should verify all anomaly presets can be applied to zones', () => {
    expect(ANOMALY_PRESETS.length).toBeGreaterThanOrEqual(8);

    for (const preset of ANOMALY_PRESETS) {
      const targetZone = INITIAL_ZONES.find((z) => z.floor === preset.targetFloor) || INITIAL_ZONES[0];
      const corruptedZone = preset.applyToZone(targetZone);

      // Verify that the anomaly changed the zone metrics or alert count
      expect(corruptedZone.alertCount).toBeGreaterThan(0);

      if (preset.category === 'water') {
        expect(corruptedZone.waterFlowLpm).toBeGreaterThanOrEqual(0);
      } else if (preset.category === 'air') {
        expect(corruptedZone.airQualityScore).toBeLessThanOrEqual(80);
      } else if (preset.category === 'energy') {
        expect(corruptedZone.powerDrawKW).toBeGreaterThan(0);
      }
    }
  });

  it('should restore zone baseline when water leak anomaly is fixed', () => {
    const floor3 = INITIAL_ZONES.find((z) => z.floor === 3)!;
    const leakPreset = ANOMALY_PRESETS.find((p) => p.id === 'preset-pipe-burst')!;
    const corrupted = leakPreset.applyToZone(floor3);

    expect(corrupted.waterFlowLpm).toBe(44.5);
    expect(corrupted.alertCount).toBeGreaterThan(0);

    const restored = restoreZoneBaseline(corrupted, 'water');
    expect(restored.waterFlowLpm).toBeLessThanOrEqual(6.0);
    expect(restored.valveStatus).toBe('open');
    expect(restored.alertCount).toBe(corrupted.alertCount - 1);
  });

  it('should restore zone baseline when air quality anomaly is fixed', () => {
    const floor2 = INITIAL_ZONES.find((z) => z.floor === 2)!;
    const co2Preset = ANOMALY_PRESETS.find((p) => p.id === 'preset-co2-hazard')!;
    const corrupted = co2Preset.applyToZone(floor2);

    expect(corrupted.airQualityScore).toBe(48);

    const restored = restoreZoneBaseline(corrupted, 'air');
    expect(restored.airQualityScore).toBeGreaterThanOrEqual(89);
    expect(restored.temperatureC).toBeLessThanOrEqual(23.5);
    expect(restored.alertCount).toBe(corrupted.alertCount - 1);
  });

  it('should restore zone baseline when energy surge anomaly is fixed', () => {
    const floor1 = INITIAL_ZONES.find((z) => z.floor === 1)!;
    const surgePreset = ANOMALY_PRESETS.find((p) => p.id === 'preset-chiller-surge')!;
    const corrupted = surgePreset.applyToZone(floor1);

    expect(corrupted.powerDrawKW).toBe(42.8);

    const restored = restoreZoneBaseline(corrupted, 'energy');
    expect(restored.powerDrawKW).toBeLessThanOrEqual(18.5);
    expect(restored.alertCount).toBe(corrupted.alertCount - 1);
  });

  it('should completely reset all telemetry metrics when category is omitted', () => {
    const floor2 = INITIAL_ZONES.find((z) => z.floor === 2)!;
    const heatwavePreset = ANOMALY_PRESETS.find((p) => p.id === 'preset-heatwave')!;
    const corrupted = heatwavePreset.applyToZone(floor2);

    expect(corrupted.temperatureC).toBe(31.5);
    expect(corrupted.powerDrawKW).toBe(26.5);

    const restored = restoreZoneBaseline(corrupted);
    const nominal = getZoneBaseline(2);

    expect(restored.temperatureC).toBe(nominal.temperatureC);
    expect(restored.powerDrawKW).toBe(nominal.powerDrawKW);
    expect(restored.alertCount).toBe(0);
  });
});
