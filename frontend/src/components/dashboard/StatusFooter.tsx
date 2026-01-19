import { Activity, Thermometer, FlaskConical, Loader2 } from 'lucide-react';
import { useSensorStore } from '@/stores/sensorStore';

export const StatusFooter = () => {
  const { metrics, currentPhase, phaseNumber, totalPhases, isConnected } = useSensorStore();

  return (
    <div className="glass-card p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Current Phase */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-optimal' : 'bg-danger'}`} />
            {isConnected && (
              <div className="absolute inset-0 rounded-full bg-optimal animate-ping opacity-75" />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Phase</p>
            <p className="font-display font-semibold text-foreground">
              {currentPhase}
              <span className="ml-2 text-sm text-muted-foreground">
                (Phase {String(phaseNumber).padStart(2, '0')}/{String(totalPhases).padStart(2, '0')})
              </span>
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 lg:gap-8">
          {/* Flow Rate */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Flow Rate</p>
              <p className="font-display font-semibold text-foreground">
                {(metrics.flowRate / 1000).toFixed(2)} <span className="text-xs text-muted-foreground">m³/h</span>
              </p>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-caution/10">
              <Thermometer className="w-4 h-4 text-caution" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temp</p>
              <p className="font-display font-semibold text-foreground">
                {metrics.temperature.toFixed(1)} <span className="text-xs text-muted-foreground">°C</span>
              </p>
            </div>
          </div>

          {/* Chlorine */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-optimal/10">
              <FlaskConical className="w-4 h-4 text-optimal" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chlorine</p>
              <p className="font-display font-semibold text-foreground">
                {metrics.chlorine.toFixed(2)} <span className="text-xs text-muted-foreground">ppm</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
