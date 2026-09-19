import { DrlWeights, FederatedBuildingNode } from '../types/sense';

export interface DrlPolicyOutput {
  suggestedHvacSetpointC: number;
  suggestedChillerRampPct: number;
  suggestedValvePressurePct: number;
  expectedReward: number;
  status: 'converged' | 'optimizing' | 'exploring';
  actionExplanation: string;
}

export function computeDrlPolicy(weights: DrlWeights, outdoorTempC: number = 29.5): DrlPolicyOutput {
  // Normalize weights so they sum to 100
  const total = (weights.comfort + weights.cost + weights.carbon) || 1;
  const wComfort = weights.comfort / total;
  const wCost = weights.cost / total;
  const wCarbon = weights.carbon / total;

  // DRL Target Setpoint calculation based on objective priorities and outdoor climate
  const thermalOffset = Math.max(0, (outdoorTempC - 24) * 0.08);
  let targetTemp = 22.0 + thermalOffset; // neutral comfort baseline
  
  if (wCost > 0.45 || wCarbon > 0.45) {
    // If prioritising cost/carbon, float temperature upwards in summer
    targetTemp += 1.8 * (wCost + wCarbon);
  } else if (wComfort > 0.6) {
    // If prioritising occupant comfort
    targetTemp = 21.8;
  }

  // Chiller ramp percentage (0-100%)
  const chillerRamp = Math.round(Math.max(40, Math.min(95, 80 - (wCost * 30) - (wCarbon * 20))));
  const valvePressure = Math.round(Math.max(50, Math.min(100, 100 - (wCost * 25))));

  const expectedReward = Math.round((wComfort * 0.88 + wCost * 0.94 + wCarbon * 0.91) * 100) / 100;

  let explanation = 'Balancing indoor thermal comfort against peak-hour grid carbon intensity.';
  if (wCost > 0.5) {
    explanation = 'Aggressive demand response mode: Setpoints floating upwards to curtail peak electricity tariffs.';
  } else if (wComfort > 0.5) {
    explanation = 'Premium comfort mode: Actuators configured for tight 21.8°C thermal envelope and maximum fresh air delivery.';
  } else if (wCarbon > 0.5) {
    explanation = 'Zero-carbon alignment mode: Scheduling HVAC thermal pre-cooling to coincide with midday solar generation peaks.';
  }

  return {
    suggestedHvacSetpointC: Math.round(targetTemp * 10) / 10,
    suggestedChillerRampPct: chillerRamp,
    suggestedValvePressurePct: valvePressure,
    expectedReward,
    status: 'converged',
    actionExplanation: explanation,
  };
}

export const FEDERATED_NODES: FederatedBuildingNode[] = [
  {
    id: 'node-01',
    name: 'S.E.N.S.E. Alpha Tower (Local Edge Node)',
    location: 'Sector 42, Bengaluru',
    unitsCount: 24,
    modelAccuracyPct: 96.4,
    roundNumber: 42,
    lastWeightSync: '2 mins ago',
    encryptionStatus: 'AES-256 GCM',
    dataLeakageRate: '0.00% (Strict Edge)',
  },
  {
    id: 'node-02',
    name: 'Greenfield Residences',
    location: 'Whitefield, Bengaluru',
    unitsCount: 48,
    modelAccuracyPct: 95.8,
    roundNumber: 42,
    lastWeightSync: '4 mins ago',
    encryptionStatus: 'Homomorphic',
    dataLeakageRate: '0.00% (Strict Edge)',
  },
  {
    id: 'node-03',
    name: 'EcoNexus Commercial Complex',
    location: 'Cyber City, Gurugram',
    unitsCount: 72,
    modelAccuracyPct: 97.1,
    roundNumber: 42,
    lastWeightSync: '1 min ago',
    encryptionStatus: 'AES-256 GCM',
    dataLeakageRate: '0.00% (Strict Edge)',
  },
  {
    id: 'node-04',
    name: 'Apex Park View Tower C',
    location: 'Bandra-Kurla, Mumbai',
    unitsCount: 36,
    modelAccuracyPct: 94.9,
    roundNumber: 41,
    lastWeightSync: '8 mins ago',
    encryptionStatus: 'Homomorphic',
    dataLeakageRate: '0.00% (Strict Edge)',
  },
];
