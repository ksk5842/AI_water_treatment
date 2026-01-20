import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Gauge } from '@/components/dashboard/Gauge';
import { StatusFooter } from '@/components/dashboard/StatusFooter';
import { ControlsPanel } from '@/components/dashboard/ControlsPanel';
import { PredictionPanel } from '@/components/dashboard/PredictionPanel';
import { SensorChart } from '@/components/dashboard/SensorChart';
import { useSensorStore, getStatus, THRESHOLDS } from '@/stores/sensorStore';
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection';
import { Activity, Droplets, Thermometer } from 'lucide-react';

const Index = () => {
  // Auto-connect to WebSocket for real-time sensor data
  useWebSocketConnection();

  const { currentReading, metrics, connectionStatus } = useSensorStore();

  // Calculate gauge percentages
  const turbidityPercent = (currentReading.turbidity / THRESHOLDS.turbidity.caution) * 100;
  const phPercent = (currentReading.ph / 14) * 100;
  const tdsPercent = (currentReading.tds / THRESHOLDS.tds.caution) * 100;

  const isConnected = connectionStatus === 'connected';

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5">
      <Sidebar />

      <main className="flex-1 ml-16 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Header />

          {/* Main Stats Banner */}
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Activity className={`w-5 h-5 ${isConnected ? 'text-optimal animate-pulse' : 'text-muted-foreground'}`} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Live Data Stream' : 'Offline Mode'}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Flow: </span>
                  <span className="font-medium text-foreground">{metrics.flowRate.toFixed(0)} L/h</span>
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-amber-400" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Temp: </span>
                  <span className="font-medium text-foreground">{metrics.temperature.toFixed(1)}°C</span>
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Last update: {currentReading.timestamp.toLocaleTimeString()}
            </div>
          </div>

          {/* Gauges Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Gauge
              value={currentReading.turbidity}
              unit="NTU"
              label="Turbidity"
              status={getStatus('turbidity', currentReading.turbidity)}
              maxValue={THRESHOLDS.turbidity.caution}
              decimals={2}
            />
            <Gauge
              value={currentReading.ph}
              unit=""
              label="pH Level"
              status={getStatus('ph', currentReading.ph)}
              maxValue={14}
              decimals={1}
            />
            <Gauge
              value={currentReading.tds}
              unit="mg/L"
              label="TDS"
              status={getStatus('tds', currentReading.tds)}
              maxValue={THRESHOLDS.tds.caution}
              decimals={0}
            />
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Prediction Panel */}
            <PredictionPanel />

            {/* Sensor Chart */}
            <SensorChart />
          </div>

          {/* Controls Panel */}
          <ControlsPanel />

          {/* Status Footer */}
          <StatusFooter />
        </div>
      </main>
    </div>
  );
};

export default Index;
