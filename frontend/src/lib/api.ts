/**
 * API Service for AquaFlow AI Backend
 * Handles REST and WebSocket communication with the backend server.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export interface SensorReading {
  turbidity: number;
  ph: number;
  tds: number;
  bod?: number;
  nitrate?: number;
}

export interface PredictionResponse {
  purolite_dose: number;
  alum_dose: number;
  model_loaded: boolean;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  timestamp: string;
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error('API health check failed');
  }
  return response.json();
}

/**
 * Get dosage prediction from ML model
 */
export async function getPrediction(reading: SensorReading): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      turbidity: reading.turbidity,
      ph: reading.ph,
      tds: reading.tds,
      bod: reading.bod ?? 25.0,
      nitrate: reading.nitrate ?? 10.0,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get prediction');
  }

  return response.json();
}

/**
 * WebSocket connection manager for real-time sensor updates
 */
export class SensorWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.listeners.set('connected', new Set());
    this.listeners.set('prediction', new Set());
    this.listeners.set('sensor_update', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('disconnected', new Set());
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(`${WS_BASE_URL}/ws/sensors`);

      this.ws.onopen = () => {
        console.log('✓ WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const type = message.type;
          const handlers = this.listeners.get(type);
          
          if (handlers) {
            handlers.forEach(handler => handler(message.data || message));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('✗ WebSocket disconnected');
        this.emit('disconnected', {});
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  /**
   * Send sensor reading to the server
   */
  sendReading(reading: SensorReading): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'sensor_reading',
        data: reading,
      }));
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const sensorSocket = new SensorWebSocket();
