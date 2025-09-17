import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  animated?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  animated = true,
  color = 'primary'
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 200);

    return () => clearTimeout(timer);
  }, [value, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  const getColorClass = () => {
    switch (color) {
      case 'success':
        return 'stroke-success';
      case 'warning':
        return 'stroke-warning';
      case 'destructive':
        return 'stroke-destructive';
      default:
        return 'stroke-primary';
    }
  };

  const getScoreColor = () => {
    if (value >= 80) return 'text-success';
    if (value >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted stroke-current opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-1000 ease-out",
            getColorClass()
          )}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={cn("text-2xl font-bold", getScoreColor())}>
              {Math.round(animatedValue)}
            </div>
            <div className="text-xs text-muted-foreground">
              / 100
            </div>
          </div>
        </div>
      )}
    </div>
  );
}