import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomAreaChartProps {
    data: Record<string, string | number>[];
    dataKey: string;
    categoryKey: string;
    color?: string;
    height?: number;
    gradientId?: string;
}

// Custom tooltip for area chart
const CustomAreaTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-card px-4 py-2.5 shadow-lg">
                <p className="font-semibold text-sm mb-1">{label}</p>
                <p className="text-lg font-bold text-primary">
                    {payload[0].value} {payload[0].value === 1 ? 'vote' : 'votes'}
                </p>
            </div>
        );
    }
    return null;
};

const DEFAULT_COLOR = '#8b5cf6';

export default function CustomAreaChart({
    data,
    dataKey,
    categoryKey,
    color = DEFAULT_COLOR,
    height = 300,
    gradientId = 'colorGradient',
}: CustomAreaChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                <XAxis
                    dataKey={categoryKey}
                    className="text-xs text-muted-foreground"
                    tickMargin={8}
                />
                <YAxis className="text-xs text-muted-foreground" tickMargin={8} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${gradientId})`}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
