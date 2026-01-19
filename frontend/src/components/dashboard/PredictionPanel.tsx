import { useState, useEffect } from 'react';
import { Beaker, Sparkles, AlertCircle, CheckCircle2, Loader2, ArrowRight, Droplet, Zap } from 'lucide-react';
import { useSensorStore } from '@/stores/sensorStore';
import { getPrediction, type PredictionResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const PredictionPanel = () => {
    const { currentReading, connectionStatus, dosingAmount, setDosingAmount, togglePump, isPumpActive } = useSensorStore();
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [autoMode, setAutoMode] = useState(false);

    // Fetch prediction when readings change (debounced)
    useEffect(() => {
        if (connectionStatus !== 'connected') return;

        const fetchPrediction = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await getPrediction({
                    turbidity: currentReading.turbidity,
                    ph: currentReading.ph,
                    tds: currentReading.tds,
                });
                setPrediction(result);
                setLastUpdate(new Date());

                // Auto-dose if enabled
                if (autoMode && result.alum_dose > 0) {
                    setDosingAmount(Math.min(50, Math.round(result.alum_dose)));
                }
            } catch (err) {
                console.error('Prediction error:', err);
                setError('Backend offline - start the server');
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce prediction requests
        const timeoutId = setTimeout(fetchPrediction, 500);
        return () => clearTimeout(timeoutId);
    }, [currentReading.turbidity, currentReading.ph, currentReading.tds, connectionStatus, autoMode, setDosingAmount]);

    const isConnected = connectionStatus === 'connected';

    const handleApplyDose = (dose: number) => {
        setDosingAmount(Math.min(50, Math.round(dose)));
    };

    return (
        <div className="glass-card p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-violet-500/20 to-pink-500/20">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold text-foreground text-lg">AI Dosage Engine</h3>
                        <p className="text-xs text-muted-foreground">ML-powered treatment recommendations</p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    prediction?.model_loaded
                        ? "bg-optimal/10 text-optimal border border-optimal/30"
                        : "bg-caution/10 text-caution border border-caution/30"
                )}>
                    {prediction?.model_loaded ? (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>RandomForest Active</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Fallback Mode</span>
                        </>
                    )}
                </div>
            </div>

            {/* Current Input */}
            {isConnected && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Input:</span>
                        <span className="font-mono">
                            <span className="text-blue-400">Turb={currentReading.turbidity.toFixed(2)}</span>
                            {' '}<span className="text-muted-foreground">|</span>{' '}
                            <span className="text-green-400">pH={currentReading.ph.toFixed(2)}</span>
                            {' '}<span className="text-muted-foreground">|</span>{' '}
                            <span className="text-amber-400">TDS={currentReading.tds.toFixed(0)}</span>
                        </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
            )}

            {/* Prediction Cards */}
            <div className="grid grid-cols-2 gap-4">
                {/* Purolite Dose */}
                <div className={cn(
                    "relative overflow-hidden rounded-xl p-5 transition-all group",
                    "bg-gradient-to-br from-blue-500/5 via-cyan-500/10 to-blue-600/5",
                    "border border-blue-500/20 hover:border-blue-500/40",
                    !isConnected && "opacity-50"
                )}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Beaker className="w-5 h-5 text-blue-400" />
                        </div>
                        {isLoading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                    </div>

                    <p className="text-xs text-muted-foreground mb-1">Purolite Resin</p>
                    <p className="text-3xl font-display font-bold text-foreground mb-1">
                        {isConnected ? (prediction?.purolite_dose.toFixed(2) ?? '--') : '--'}
                        <span className="text-sm font-normal text-muted-foreground ml-1">mg/L</span>
                    </p>
                    <p className="text-xs text-blue-400/80">Ion Exchange Treatment</p>

                    {isConnected && prediction && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApplyDose(prediction.purolite_dose)}
                            className="mt-3 w-full text-xs h-8 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                        >
                            Apply Dose
                        </Button>
                    )}

                    {/* Decorative gradient */}
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                </div>

                {/* Alum Dose */}
                <div className={cn(
                    "relative overflow-hidden rounded-xl p-5 transition-all group",
                    "bg-gradient-to-br from-amber-500/5 via-orange-500/10 to-amber-600/5",
                    "border border-amber-500/20 hover:border-amber-500/40",
                    !isConnected && "opacity-50"
                )}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                            <Droplet className="w-5 h-5 text-amber-400" />
                        </div>
                        {isLoading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                    </div>

                    <p className="text-xs text-muted-foreground mb-1">Alum Coagulant</p>
                    <p className="text-3xl font-display font-bold text-foreground mb-1">
                        {isConnected ? (prediction?.alum_dose.toFixed(2) ?? '--') : '--'}
                        <span className="text-sm font-normal text-muted-foreground ml-1">mg/L</span>
                    </p>
                    <p className="text-xs text-amber-400/80">Coagulation Treatment</p>

                    {isConnected && prediction && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApplyDose(prediction.alum_dose)}
                            className="mt-3 w-full text-xs h-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                        >
                            Apply Dose
                        </Button>
                    )}

                    {/* Decorative gradient */}
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                </div>
            </div>

            {/* Auto Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                    <Zap className={cn("w-4 h-4", autoMode ? "text-primary" : "text-muted-foreground")} />
                    <div>
                        <p className="text-sm font-medium text-foreground">Auto-Dosing Mode</p>
                        <p className="text-xs text-muted-foreground">Automatically apply AI recommendations</p>
                    </div>
                </div>
                <button
                    onClick={() => setAutoMode(!autoMode)}
                    disabled={!isConnected}
                    className={cn(
                        "relative w-12 h-6 rounded-full transition-all",
                        autoMode ? "bg-primary" : "bg-muted",
                        !isConnected && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        autoMode ? "left-7" : "left-1"
                    )} />
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Last Update */}
            {lastUpdate && isConnected && (
                <p className="text-xs text-muted-foreground text-center">
                    Last prediction: {lastUpdate.toLocaleTimeString()}
                </p>
            )}

            {/* Not Connected State */}
            {!isConnected && (
                <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                        Connect to see real-time AI predictions
                    </p>
                </div>
            )}
        </div>
    );
};
