import { useEffect, useRef } from 'react';
import { useSensorStore } from '@/stores/sensorStore';

interface DataPoint {
    time: string;
    turbidity: number;
    ph: number;
    tds: number;
}

export const SensorChart = () => {
    const { readingHistory, connectionStatus } = useSensorStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Convert history to chart data (last 30 points)
    const chartData: DataPoint[] = readingHistory.slice(-30).map((reading) => ({
        time: reading.timestamp.toLocaleTimeString(),
        turbidity: reading.turbidity,
        ph: reading.ph,
        tds: reading.tds / 100, // Scale TDS to fit with other values
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const width = rect.width;
        const height = rect.height;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.clearRect(0, 0, width, height);

        if (chartData.length < 2) {
            // Show message when no data
            ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Connect to Arduino to see live data', width / 2, height / 2);
            return;
        }

        // Draw grid
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Find max values for scaling
        const maxTurbidity = Math.max(...chartData.map(d => d.turbidity), 5);
        const maxPh = 14;
        const maxTdsScaled = Math.max(...chartData.map(d => d.tds), 10);

        // Draw lines
        const drawLine = (
            data: number[],
            color: string,
            maxVal: number,
            glowColor: string
        ) => {
            if (data.length < 2) return;

            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Add glow effect
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            data.forEach((value, i) => {
                const x = padding + (i / (data.length - 1)) * chartWidth;
                const y = padding + chartHeight - (value / maxVal) * chartHeight;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
        };

        // Draw each sensor line
        drawLine(
            chartData.map(d => d.turbidity),
            '#3b82f6', // blue
            maxTurbidity,
            'rgba(59, 130, 246, 0.5)'
        );

        drawLine(
            chartData.map(d => d.ph),
            '#22c55e', // green
            maxPh,
            'rgba(34, 197, 94, 0.5)'
        );

        drawLine(
            chartData.map(d => d.tds),
            '#f59e0b', // amber
            maxTdsScaled,
            'rgba(245, 158, 11, 0.5)'
        );

    }, [chartData]);

    const isConnected = connectionStatus === 'connected';

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-display font-semibold text-foreground">
                        Real-Time Sensor Data
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Live readings from Arduino sensors
                    </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Turbidity</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">pH</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">TDS (÷100)</span>
                    </div>
                </div>
            </div>

            <div className={`relative h-48 ${!isConnected ? 'opacity-50' : ''}`}>
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                />

                {!isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Waiting for sensor data...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {isConnected && chartData.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <p className="text-xl font-bold text-blue-400">
                            {chartData[chartData.length - 1]?.turbidity.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Turbidity NTU</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/10">
                        <p className="text-xl font-bold text-green-400">
                            {chartData[chartData.length - 1]?.ph.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">pH Level</p>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/10">
                        <p className="text-xl font-bold text-amber-400">
                            {(chartData[chartData.length - 1]?.tds * 100).toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">TDS mg/L</p>
                    </div>
                </div>
            )}
        </div>
    );
};
