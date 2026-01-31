
export interface VitalRecord {
  id: string;
  type: 'blood-pressure' | 'heart-rate' | 'blood-sugar';
  value: string;
  unit: string;
  timestamp: Date;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
}

export interface HealthSummary {
  status: 'excellent' | 'good' | 'fair' | 'requires-attention';
  message: string;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  MEDS = 'meds',
  VITALS = 'vitals',
  COMPANION = 'companion',
  CALL = 'call',
  NATURAL = 'natural',
  SOS = 'sos'
}
