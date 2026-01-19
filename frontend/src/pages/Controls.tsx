import { Sidebar } from '@/components/dashboard/Sidebar';
import { ArrowLeft, Beaker, Timer, Terminal, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { useSensorStore } from '@/stores/sensorStore';

const Controls = () => {
  const { dosingAmount, setDosingAmount, isPumpActive } = useSensorStore();
  const [duration, setDuration] = useState(5);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> AquaFlow Serial Monitor v1.0',
    '> Waiting for connection...',
  ]);

  const calculateDuration = (ml: number) => {
    const flowRate = 5.0; // ml/s
    return Math.round((ml / flowRate) * 1000);
  };

  const handleDose = () => {
    const durationMs = calculateDuration(dosingAmount);
    setTerminalOutput(prev => [
      ...prev,
      `> Dosing ${dosingAmount}ml for ${durationMs}ms`,
      `> Relay HIGH`,
      `> ... waiting ${durationMs}ms`,
      `> Relay LOW`,
      `> Dosing complete!`,
    ]);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 ml-16 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Pump Controls</h1>
              <p className="text-muted-foreground">Configure dosing and relay settings</p>
            </div>
          </header>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Dosage Calculator */}
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Beaker className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">Dosage Calculator</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Dose Amount (ml)</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Slider
                      value={[dosingAmount]}
                      onValueChange={([val]) => setDosingAmount(val)}
                      max={50}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-16 text-right font-mono">{dosingAmount}ml</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Calculated Duration</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {calculateDuration(dosingAmount)}ms
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Flow rate: 5.0 ml/s
                  </p>
                </div>

                <Button onClick={handleDose} className="w-full gap-2 bg-primary hover:bg-primary/90">
                  <Beaker className="w-4 h-4" />
                  Execute Dose
                </Button>
              </div>
            </div>

            {/* Relay Timer */}
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-caution/10">
                  <Timer className="w-5 h-5 text-caution" />
                </div>
                <h3 className="font-display font-semibold text-foreground">Relay Timer</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="interval">Dosing Interval (minutes)</Label>
                  <Input 
                    id="interval" 
                    type="number" 
                    defaultValue={30}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="cycles">Number of Cycles</Label>
                  <Input 
                    id="cycles" 
                    type="number" 
                    defaultValue={10}
                    className="mt-2"
                  />
                </div>

                <Button variant="outline" className="w-full gap-2">
                  <Timer className="w-4 h-4" />
                  Schedule Dosing
                </Button>
              </div>
            </div>

            {/* Serial Terminal */}
            <div className="md:col-span-2 glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Terminal className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground">Serial Monitor</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setTerminalOutput(['> Terminal cleared'])}
                >
                  Clear
                </Button>
              </div>

              <div className="bg-background/80 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
                {terminalOutput.map((line, i) => (
                  <p key={i} className="text-muted-foreground">{line}</p>
                ))}
              </div>

              <div className="flex gap-2">
                <Input placeholder="Send command..." className="flex-1" />
                <Button variant="outline">Send</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Controls;
