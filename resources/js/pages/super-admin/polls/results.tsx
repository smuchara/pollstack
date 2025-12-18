import { Head } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PollOption {
    id: number;
    text: string;
    votes_count: number;
}

interface Poll {
    id: number;
    question: string;
    description: string | null;
    status: string;
    type: string;
    options: PollOption[];
}

interface Props {
    poll: Poll;
}

export default function PollResults({ poll }: Props) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/super-admin/dashboard' },
        { title: 'Polls', href: '/super-admin/polls' },
        { title: 'Results', href: `/super-admin/polls/${poll.id}/results` },
    ];

    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes_count, 0);

    const data = poll.options.map(opt => ({
        name: opt.text,
        votes: opt.votes_count,
    }));

    // Random-ish colors for bars if needed, or consistent primary color
    // const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Results: ${poll.question}`} />

            <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                        <Button variant="ghost" className="pl-0 gap-2 text-muted-foreground" onClick={() => window.history.back()}>
                            <ArrowLeft className="h-4 w-4" />
                            Back to Polls
                        </Button>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold tracking-tight">{poll.question}</h1>
                            {poll.description && (
                                <p className="text-muted-foreground">{poll.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="capitalize">
                                    {poll.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    • Total Votes: {totalVotes}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charts & Data */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vote Distribution</CardTitle>
                                <CardDescription>Visual representation of the votes</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                            cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                        />
                                        <Bar dataKey="votes" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detailed Breakdown</CardTitle>
                                <CardDescription>Exact vote counts per option</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {poll.options.map((option, index) => {
                                        const percentage = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
                                        return (
                                            <div key={option.id} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{option.text}</span>
                                                    <span className="text-muted-foreground">{option.votes_count} votes ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
