import { Droplets, Waves, Sparkles } from 'lucide-react';
import { useSensorStore } from '@/stores/sensorStore';

export const Header = () => {
  const { connectionStatus, currentPhase, phaseNumber, totalPhases } = useSensorStore();

  const statusConfig = {
    disconnected: { label: 'Disconnected', class: 'connection-dot-disconnected', textClass: 'text-muted-foreground' },
    connecting: { label: 'Connecting...', class: 'bg-caution animate-pulse', textClass: 'text-caution' },
    connected: { label: 'Live', class: 'connection-dot-connected', textClass: 'text-optimal' },
    error: { label: 'Error', class: 'connection-dot-disconnected', textClass: 'text-danger' },
  };

  const status = statusConfig[connectionStatus];

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 backdrop-blur-sm">
            <Waves className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            AquaFlow AI
            <span className="text-sm font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              v1.0
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Smart Water Treatment Monitoring System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Current Phase */}
        <div className="hidden md:flex items-center gap-2 glass-card px-4 py-2">
          <Droplets className="w-4 h-4 text-primary" />
          <div className="text-sm">
            <span className="text-muted-foreground">Phase {phaseNumber}/{totalPhases}: </span>
            <span className="font-medium text-foreground">{currentPhase}</span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 glass-card px-4 py-2">
          <div className={`connection-dot ${status.class}`} />
          <span className={`text-sm font-medium ${status.textClass}`}>
            {status.label}
          </span>
        </div>
      </div>
    </header>
  );
};
