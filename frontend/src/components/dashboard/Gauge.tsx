import { useMemo } from 'react';
import { SensorStatus } from '@/stores/sensorStore';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GaugeProps {
  value: number;
  unit: string;
  label: string;
  status: SensorStatus;
  maxValue?: number;
  decimals?: number;
  previousValue?: number;
}

export const Gauge = ({
  value,
  unit,
  label,
  status,
  maxValue = 100,
  decimals = 1,
  previousValue
}: GaugeProps) => {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (value / maxValue) * 100));
  }, [value, maxValue]);

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Calculate trend
  const trend = useMemo(() => {
    if (previousValue === undefined) return 'stable';
    if (value > previousValue * 1.02) return 'up';
    if (value < previousValue * 0.98) return 'down';
    return 'stable';
  }, [value, previousValue]);

  const statusColors = {
    optimal: {
      stroke: 'url(#gradient-optimal)',
      strokeClass: 'stroke-optimal',
      text: 'text-optimal',
      glow: 'drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]',
      bg: 'bg-optimal/10',
      border: 'border-optimal/30',
      label: 'OPTIMAL',
      gradient: { start: '#22c55e', end: '#10b981' },
    },
    caution: {
      stroke: 'url(#gradient-caution)',
      strokeClass: 'stroke-caution',
      text: 'text-caution',
      glow: 'drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      bg: 'bg-caution/10',
      border: 'border-caution/30',
      label: 'CAUTION',
      gradient: { start: '#f59e0b', end: '#f97316' },
    },
    danger: {
      stroke: 'url(#gradient-danger)',
      strokeClass: 'stroke-danger',
      text: 'text-danger',
      glow: 'drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]',
      bg: 'bg-danger/10',
      border: 'border-danger/30',
      label: 'DANGER',
      gradient: { start: '#ef4444', end: '#dc2626' },
    },
  };

  const colors = statusColors[status];

  return (
    <div className={`glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:scale-[1.02] border ${colors.border}`}>
      {/* Background glow */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br from-transparent via-transparent to-current ${colors.text}`} />

      {/* Gauge SVG */}
      <div className={`relative w-40 h-40 ${colors.glow}`}>
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={`gradient-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.gradient.start} />
              <stop offset="100%" stopColor={colors.gradient.end} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-muted/30"
            strokeWidth="6"
          />

          {/* Track marks */}
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * 360;
            const x1 = 50 + 40 * Math.cos((angle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((angle * Math.PI) / 180);
            const x2 = 50 + 44 * Math.cos((angle * Math.PI) / 180);
            const y2 = 50 + 44 * Math.sin((angle * Math.PI) / 180);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="stroke-muted/20"
                strokeWidth="1"
              />
            );
          })}

          {/* Value arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={colors.stroke}
            className={`${colors.strokeClass} transition-all duration-700 ease-out`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-display font-bold ${colors.text} transition-all duration-300`}>
            {value.toFixed(decimals)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">{unit}</span>
        </div>
      </div>

      {/* Label */}
      <h3 className="mt-4 text-lg font-display font-semibold text-foreground">
        {label}
      </h3>

      {/* Status badge with trend */}
      <div className="mt-2 flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} flex items-center gap-1`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend === 'stable' && <Minus className="w-3 h-3" />}
          {colors.label}
        </div>
      </div>

      {/* Percentage bar at bottom */}
      <div className="w-full mt-4 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.strokeClass}`}
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${colors.gradient.start}, ${colors.gradient.end})`
          }}
        />
      </div>
    </div>
  );
};
