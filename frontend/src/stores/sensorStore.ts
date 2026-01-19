import { create } from 'zustand';

export type SensorStatus = 'optimal' | 'caution' | 'danger';

export interface SensorReading {
  turbidity: number;
  ph: number;
  tds: number;
  timestamp: Date;
}

export interface SystemMetrics {
  flowRate: number;
  temperature: number;
  chlorine: number;
}

export interface DosingEvent {
  timestamp: Date;
  durationMs: number;
  doseMl: number;
  chemical: string;
}

interface SensorStore {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Current readings
  currentReading: SensorReading;
  metrics: SystemMetrics;
  currentPhase: string;
  phaseNumber: number;
  totalPhases: number;
  
  // History
  readingHistory: SensorReading[];
  dosingEvents: DosingEvent[];
  
  // Pump state
  isPumpActive: boolean;
  dosingAmount: number;
  
  // Actions
  setConnection: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  updateReading: (reading: Partial<SensorReading>) => void;
  updateMetrics: (metrics: Partial<SystemMetrics>) => void;
  setPhase: (phase: string, number: number) => void;
  togglePump: () => void;
  setDosingAmount: (amount: number) => void;
  addDosingEvent: (event: DosingEvent) => void;
  simulateData: () => void;
}

// Threshold configurations
export const THRESHOLDS = {
  turbidity: { optimal: 1, caution: 5 },
  ph: { optimalMin: 6.5, optimalMax: 8.5, cautionMin: 5.5, cautionMax: 9.5 },
  tds: { optimal: 500, caution: 1000 },
};

export const getStatus = (metric: 'turbidity' | 'ph' | 'tds', value: number): SensorStatus => {
  switch (metric) {
    case 'turbidity':
      if (value <= THRESHOLDS.turbidity.optimal) return 'optimal';
      if (value <= THRESHOLDS.turbidity.caution) return 'caution';
      return 'danger';
    case 'ph':
      if (value >= THRESHOLDS.ph.optimalMin && value <= THRESHOLDS.ph.optimalMax) return 'optimal';
      if (value >= THRESHOLDS.ph.cautionMin && value <= THRESHOLDS.ph.cautionMax) return 'caution';
      return 'danger';
    case 'tds':
      if (value <= THRESHOLDS.tds.optimal) return 'optimal';
      if (value <= THRESHOLDS.tds.caution) return 'caution';
      return 'danger';
    default:
      return 'optimal';
  }
};

export const useSensorStore = create<SensorStore>((set, get) => ({
  // Initial state
  isConnected: false,
  connectionStatus: 'disconnected',
  
  currentReading: {
    turbidity: 0.42,
    ph: 7.1,
    tds: 186,
    timestamp: new Date(),
  },
  
  metrics: {
    flowRate: 1240,
    temperature: 18.4,
    chlorine: 0.8,
  },
  
  currentPhase: 'Membrane Filtration',
  phaseNumber: 4,
  totalPhases: 6,
  
  readingHistory: [],
  dosingEvents: [],
  
  isPumpActive: false,
  dosingAmount: 25,
  
  // Actions
  setConnection: (status) => set({ 
    connectionStatus: status,
    isConnected: status === 'connected'
  }),
  
  updateReading: (reading) => set((state) => {
    const newReading = {
      ...state.currentReading,
      ...reading,
      timestamp: new Date(),
    };
    return {
      currentReading: newReading,
      readingHistory: [...state.readingHistory.slice(-3600), newReading], // Keep last hour at 1/s
    };
  }),
  
  updateMetrics: (metrics) => set((state) => ({
    metrics: { ...state.metrics, ...metrics },
  })),
  
  setPhase: (phase, number) => set({ currentPhase: phase, phaseNumber: number }),
  
  togglePump: () => set((state) => ({ isPumpActive: !state.isPumpActive })),
  
  setDosingAmount: (amount) => set({ dosingAmount: amount }),
  
  addDosingEvent: (event) => set((state) => ({
    dosingEvents: [...state.dosingEvents, event],
  })),
  
  simulateData: () => {
    const state = get();
    const variance = () => (Math.random() - 0.5) * 0.1;
    
    set({
      currentReading: {
        turbidity: Math.max(0, state.currentReading.turbidity + variance() * 0.2),
        ph: Math.max(0, Math.min(14, state.currentReading.ph + variance() * 0.3)),
        tds: Math.max(0, state.currentReading.tds + Math.round(variance() * 10)),
        timestamp: new Date(),
      },
      metrics: {
        flowRate: Math.max(0, state.metrics.flowRate + Math.round(variance() * 20)),
        temperature: state.metrics.temperature + variance() * 0.2,
        chlorine: Math.max(0, state.metrics.chlorine + variance() * 0.05),
      },
    });
  },
}));
