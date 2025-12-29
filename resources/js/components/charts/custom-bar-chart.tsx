import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomBarChartProps {
    data: Record<string, any>[];
    dataKey: string;
    categoryKey: string;
    layout?: 'horizontal' | 'vertical';
    barColor?: string;
    height?: number;
    categoryWidth?: number;
}

// Custom tooltip for bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
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

const DEFAULT_BAR_COLOR = '#8b5cf6';

export default function CustomBarChart({
    data,
    dataKey,
    categoryKey,
    layout = 'vertical',
    barColor = DEFAULT_BAR_COLOR,
    height = 300,
    categoryWidth = 120,
}: CustomBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout={layout}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                {layout === 'vertical' ? (
                    <>
                        <XAxis type="number" className="text-xs text-muted-foreground" />
                        <YAxis
                            dataKey={categoryKey}
                            type="category"
                            width={categoryWidth}
                            className="text-xs"
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            dataKey={categoryKey}
                            type="category"
                            className="text-xs text-muted-foreground"
                        />
                        <YAxis type="number" className="text-xs text-muted-foreground" />
                    </>
                )}
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                    dataKey={dataKey}
                    fill={barColor}
                    radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
