import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Play, Square, Download, ChevronDown, ChevronUp, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSensorStore } from '@/stores/sensorStore';
import { checkHealth, sensorSocket, getPrediction } from '@/lib/api';
import { cn } from '@/lib/utils';

export const ControlsPanel = () => {
  const {
    connectionStatus,
    setConnection,
    isPumpActive,
    togglePump,
    dosingAmount,
    setDosingAmount,
    currentReading,
    updateReading,
    readingHistory,
    simulateData
  } = useSensorStore();

  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [lastPrediction, setLastPrediction] = useState<{ purolite: number; alum: number } | null>(null);

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const health = await checkHealth();
        setBackendStatus(health.status === 'healthy' ? 'online' : 'offline');
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Backend: ${health.status}, ML Model: ${health.model_loaded ? 'loaded' : 'not loaded'}`]);
      } catch {
        setBackendStatus('offline');
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠ Backend offline - start it with: python main.py`]);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle WebSocket connection
  const handleConnect = useCallback(async () => {
    if (connectionStatus === 'connected') {
      sensorSocket.disconnect();
      setConnection('disconnected');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Disconnected from backend`]);
    } else {
      setConnection('connecting');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connecting to WebSocket...`]);

      try {
        sensorSocket.connect();

        // Subscribe to events
        sensorSocket.on('connected', () => {
          setConnection('connected');
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ WebSocket connected!`]);
        });

        sensorSocket.on('prediction', (data: any) => {
          updateReading({
            turbidity: data.turbidity,
            ph: data.ph,
            tds: data.tds,
          });
          setLastPrediction({
            purolite: data.purolite_dose,
            alum: data.alum_dose,
          });
          setLogs(prev => {
            const newLog = `[${new Date().toLocaleTimeString()}] Turb=${data.turbidity?.toFixed(2)}, pH=${data.ph?.toFixed(2)}, TDS=${data.tds?.toFixed(0)} → Alum=${data.alum_dose?.toFixed(2)}mg/L`;
            return [...prev.slice(-100), newLog];
          });
        });

        sensorSocket.on('sensor_update', (data: any) => {
          updateReading({
            turbidity: data.turbidity,
            ph: data.ph,
            tds: data.tds,
          });
        });

        sensorSocket.on('error', () => {
          setConnection('error');
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✗ WebSocket error`]);
        });

        sensorSocket.on('disconnected', () => {
          setConnection('disconnected');
        });

        // Give it time to connect
        setTimeout(() => {
          if (sensorSocket.isConnected) {
            setConnection('connected');
          }
        }, 2000);
      } catch (error) {
        setConnection('error');
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connection failed: ${error}`]);
      }
    }
  }, [connectionStatus, setConnection, updateReading]);

  // Simulate data when connected (for demo mode)
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const interval = setInterval(async () => {
      // If we're getting real data from WebSocket, don't simulate
      if (sensorSocket.isConnected) {
        // Fetch prediction for current reading
        try {
          const pred = await getPrediction(currentReading);
          setLastPrediction({
            purolite: pred.purolite_dose,
            alum: pred.alum_dose,
          });
        } catch {
          // Silent fail
        }
      } else {
        // Fallback: simulate data
        simulateData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionStatus, simulateData, currentReading]);

  const handleExport = () => {
    const headers = 'timestamp,turbidity,ph,tds\n';
    const data = readingHistory.map(r =>
      `${r.timestamp.toISOString()},${r.turbidity},${r.ph},${r.tds}`
    ).join('\n');

    const csv = headers + data;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquaflow-data-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Exported ${readingHistory.length} readings to CSV`]);
  };

  const handleDose = async () => {
    if (!isPumpActive) {
      togglePump();
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 💧 Pump activated - dosing ${dosingAmount}ml`]);

      // Simulate pump duration based on dose
      const duration = dosingAmount * 200; // 200ms per ml
      setTimeout(() => {
        togglePump();
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Dosing complete`]);
      }, duration);
    } else {
      togglePump();
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏹ Pump stopped manually`]);
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">System Controls</h3>

        {/* Backend Status */}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          backendStatus === 'online'
            ? "bg-optimal/10 text-optimal"
            : backendStatus === 'offline'
              ? "bg-danger/10 text-danger"
              : "bg-muted text-muted-foreground"
        )}>
          {backendStatus === 'online' ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>Backend Online</span>
            </>
          ) : backendStatus === 'offline' ? (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>Backend Offline</span>
            </>
          ) : (
            <span>Checking...</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Connection Button */}
        <Button
          variant={isConnected ? "destructive" : "default"}
          onClick={handleConnect}
          disabled={isConnecting || backendStatus === 'offline'}
          className={cn(
            "gap-2",
            !isConnected && !isConnecting && "bg-primary hover:bg-primary/90"
          )}
        >
          {isConnecting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isConnected ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
          {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
        </Button>

        {/* Pump Toggle */}
        <Button
          variant={isPumpActive ? "destructive" : "outline"}
          onClick={handleDose}
          disabled={!isConnected}
          className="gap-2"
        >
          {isPumpActive ? <Square className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          {isPumpActive ? 'Stop Pump' : 'Activate Pump'}
        </Button>

        {/* Dosing Slider */}
        <div className="col-span-2 flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Dose:</span>
          <Slider
            value={[dosingAmount]}
            onValueChange={([val]) => setDosingAmount(val)}
            max={50}
            step={1}
            disabled={!isConnected}
            className="flex-1"
          />
          <span className="text-sm font-medium text-foreground w-12">{dosingAmount}ml</span>
        </div>
      </div>

      {/* Last Prediction Display */}
      {lastPrediction && isConnected && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-amber-500/10 border border-primary/20">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">AI Recommends: Purolite</p>
            <p className="text-lg font-bold text-blue-400">{lastPrediction.purolite.toFixed(2)} mg/L</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">AI Recommends: Alum</p>
            <p className="text-lg font-bold text-amber-400">{lastPrediction.alum.toFixed(2)} mg/L</p>
          </div>
        </div>
      )}

      {/* Export Button */}
      <Button variant="outline" onClick={handleExport} className="w-full gap-2">
        <Download className="w-4 h-4" />
        Export CSV Data ({readingHistory.length} readings)
      </Button>

      {/* Serial Logs */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium">Serial Monitor</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{logs.length} messages</span>
            {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showLogs && (
          <div className="p-3 bg-background/50 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet. Connect to start.</p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className={cn(
                  "text-muted-foreground",
                  log.includes('✓') && "text-optimal",
                  log.includes('✗') && "text-danger",
                  log.includes('⚠') && "text-caution",
                  log.includes('💧') && "text-primary"
                )}>{log}</p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
