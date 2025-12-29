import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor?: string;
    trend?: {
        value: number;
        label?: string;
    };
    subtitle?: string;
}

export default function MetricCard({ title, value, icon: Icon, iconColor = 'text-primary', trend, subtitle }: MetricCardProps) {
    const getTrendColor = (trendValue: number) => {
        if (trendValue > 0) return 'text-[color:var(--color-trend-up)]';
        if (trendValue < 0) return 'text-[color:var(--color-trend-down)]';
        return 'text-[color:var(--color-trend-neutral)]';
    };

    const getTrendIcon = (trendValue: number) => {
        if (trendValue > 0) return ArrowUpRight;
        if (trendValue < 0) return ArrowDownRight;
        return Minus;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <p className={`flex items-center gap-1 text-xs mt-1 ${getTrendColor(trend.value)}`}>
                        {(() => {
                            const TrendIcon = getTrendIcon(trend.value);
                            return <TrendIcon className="h-3 w-3" />;
                        })()}
                        {Math.abs(trend.value)}% {trend.label || 'from yesterday'}
                    </p>
                )}
                {subtitle && !trend && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}
