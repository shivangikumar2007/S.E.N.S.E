import { describe, it, expect } from 'vitest';
import { computeDrlPolicy, FEDERATED_NODES } from '../services/drlOptimizer';

describe('drlOptimizer', () => {
  it('should adjust HVAC setpoint upwards when cost/carbon are prioritized', () => {
    const ecoWeights = { comfort: 10, cost: 60, carbon: 30 };
    const policy = computeDrlPolicy(ecoWeights, 30);

    expect(policy.suggestedHvacSetpointC).toBeGreaterThan(22.0);
    expect(policy.status).toBe('converged');
    expect(policy.expectedReward).toBeGreaterThan(0);
    expect(policy.actionExplanation).toContain('Aggressive demand response');
  });

  it('should keep HVAC setpoint tighter when comfort is highest priority', () => {
    const comfortWeights = { comfort: 80, cost: 10, carbon: 10 };
    const policy = computeDrlPolicy(comfortWeights, 24);

    expect(policy.suggestedHvacSetpointC).toBeLessThanOrEqual(22.5);
    expect(policy.actionExplanation).toContain('Premium comfort');
  });

  it('should list federated nodes with 0% data leakage guarantee', () => {
    expect(FEDERATED_NODES.length).toBeGreaterThanOrEqual(4);
    for (const node of FEDERATED_NODES) {
      expect(node.dataLeakageRate).toBe('0.00% (Strict Edge)');
      expect(node.modelAccuracyPct).toBeGreaterThan(90);
    }
  });
});
