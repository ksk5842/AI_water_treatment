/**
 * WebSocket Connection Hook
 * Auto-connects to the backend WebSocket and syncs sensor updates to the store.
 */

import { useEffect, useRef } from 'react';
import { useSensorStore } from '@/stores/sensorStore';
import { sensorSocket } from '@/lib/api';

interface SensorUpdateData {
    turbidity: number;
    ph: number;
    tds: number;
    purolite_dose?: number;
    alum_dose?: number;
    timestamp: string;
}

export const useWebSocketConnection = () => {
    const { setConnection, updateReading } = useSensorStore();
    const reconnectAttempts = useRef(0);
    const maxReconnects = 10;

    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;

        const connect = () => {
            // Clean up any existing connection
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }

            setConnection('connecting');

            try {
                ws = new WebSocket('ws://localhost:8000/ws/sensors');

                ws.onopen = () => {
                    console.log('✓ WebSocket connected');
                    setConnection('connected');
                    reconnectAttempts.current = 0;
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);

                        // Handle sensor update broadcasts from serial bridge
                        if (message.type === 'sensor_update' || message.type === 'prediction') {
                            const data = message.data as SensorUpdateData;
                            updateReading({
                                turbidity: data.turbidity,
                                ph: data.ph,
                                tds: data.tds,
                            });
                        }

                        // Handle initial connection confirmation
                        if (message.type === 'connected') {
                            console.log('✓ Backend confirmed connection, model loaded:', message.model_loaded);
                        }
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };

                ws.onclose = () => {
                    console.log('✗ WebSocket disconnected');
                    setConnection('disconnected');

                    // Attempt to reconnect
                    if (reconnectAttempts.current < maxReconnects) {
                        reconnectAttempts.current++;
                        const delay = Math.min(1000 * reconnectAttempts.current, 5000);
                        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnects})`);
                        reconnectTimeout = setTimeout(connect, delay);
                    }
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setConnection('error');
                };
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                setConnection('error');
            }
        };

        // Start connection
        connect();

        // Cleanup
        return () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (ws) {
                ws.close();
            }
        };
    }, [setConnection, updateReading]);
};
