import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface PieChartData {
    name: string;
    value: number;
    percentage: number;
    [key: string]: string | number;
}

interface CustomPieChartProps {
    data: PieChartData[];
    colors?: string[];
    innerRadius?: number;
    outerRadius?: number;
    paddingAngle?: number;
    height?: number;
}

// Custom tooltip for pie chart to show percentages
const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: PieChartData }> }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="rounded-lg border bg-card px-4 py-2.5 shadow-lg">
                <p className="font-semibold text-sm">{data.name}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                    {data.payload.percentage}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {data.value} {data.value === 1 ? 'vote' : 'votes'}
                </p>
            </div>
        );
    }
    return null;
};

const DEFAULT_COLORS = [
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#10b981', // green
    '#f59e0b', // orange
    '#ec4899', // pink
    '#6366f1', // blue
];

export default function CustomPieChart({
    data,
    colors = DEFAULT_COLORS,
    innerRadius = 70,
    outerRadius = 110,
    paddingAngle = 3,
    height = 300,
}: CustomPieChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={paddingAngle}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
        </ResponsiveContainer>
    );
}
