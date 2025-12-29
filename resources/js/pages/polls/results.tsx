import { Head, router } from '@inertiajs/react';
import { Users, CheckCircle2, Calendar, TrendingUp, Lock, Globe, Trash2, Share2, Eye, ChevronDown } from 'lucide-react';
import { formatLocalDate } from '@/lib/date-utils';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MetricCard from '@/components/analytics/metric-card';
import { CustomPieChart, CustomBarChart, CustomAreaChart } from '@/components/charts';
import { PageHeader, EmptyState } from '@/components/common';
import type { BreadcrumbItem } from '@/types';

interface PollOption {
    id: number;
    text: string;
    order: number;
    votes_count: number;
    [key: string]: string | number; // Index signature for recharts
}

interface Poll {
    id: number;
    question: string;
    description: string | null;
    type: 'open' | 'closed';
    status: string;
    start_at: string | null;
    end_at: string | null;
    organization: {
        id: number;
        name: string;
    } | null;
    options: PollOption[];
}

interface Statistics {
    total_votes: number;
    trend_percentage: number;
    leading_option: string | null;
    conversion_rate: number;
    duration: {
        start: string | null;
        end: string | null;
    };
}

interface VotingTrendItem {
    date: string;
    votes: number;
    [key: string]: string | number; // Index signature for recharts
}

interface PercentageBreakdownItem {
    name: string;
    value: number;
    percentage: number;
    [key: string]: string | number; // Index signature for recharts
}

interface VoterLogItem {
    id: number;
    voter: {
        name: string;
        email: string;
        avatar: string;
    };
    selection: string;
    timestamp: string;
}

interface Props {
    poll: Poll;
    statistics: Statistics;
    votingTrend: VotingTrendItem[];
    percentageBreakdown: PercentageBreakdownItem[];
    voterLog: VoterLogItem[] | null;
}

// Analytics color palette
const ANALYTICS_COLORS = {
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    green: '#10b981',
    orange: '#f59e0b',
    pink: '#ec4899',
    blue: '#6366f1',
};

const CHART_COLORS = [ANALYTICS_COLORS.purple, ANALYTICS_COLORS.cyan, ANALYTICS_COLORS.green, ANALYTICS_COLORS.orange, ANALYTICS_COLORS.pink, ANALYTICS_COLORS.blue];

export default function PollResults({ poll, statistics, votingTrend, percentageBreakdown, voterLog }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        {
            title: 'Poll Voting', href: window.location.pathname.includes('/organization/')
                ? window.location.pathname.split('/').slice(0, window.location.pathname.indexOf('polls-voting') + 1).join('/')
                : '/polls'
        },
        { title: 'Results', href: '' },
    ];

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
            // Context-aware delete
            const currentPath = window.location.pathname;
            if (currentPath.includes('/organization/') && poll.organization) {
                // If in org context, likely an admin, try to use tenant route if simpler, 
                // but usually delete is an admin action. 
                // However, standard delete route might not be in 'web.php'.
                // If we are here as an admin, we might want to redirect to admin management.
                // For now, let's keep it safe. If there's no route, it will fail.
                // Best effort to keep context if it was supported.

                alert("Please use the Poll Management page to delete polls.");
                return;
            }
            router.delete(`/polls/${poll.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${poll.question} - Results`} />

            <div className="min-h-screen bg-background p-6 text-foreground sm:p-8 lg:p-10">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <PageHeader
                        title={poll.question}
                        description={poll.description || undefined}
                        actions={
                            <>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ChevronDown className="h-4 w-4" />
                                    This Week
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Share2 className="h-4 w-4" />
                                    Share
                                </Button>
                                <Button variant="destructive" size="sm" className="gap-2" onClick={handleDelete}>
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </>
                        }
                    />
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize gap-1.5">
                            {poll.type === 'open' ? (
                                <>
                                    <Globe className="h-3.5 w-3.5" />
                                    Open Ballot
                                </>
                            ) : (
                                <>
                                    <Lock className="h-3.5 w-3.5" />
                                    Closed Ballot
                                </>
                            )}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={poll.status === 'active'
                                ? 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800'
                                : 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-800'
                            }
                        >
                            {poll.status === 'active' ? 'Active' : 'Ended'}
                        </Badge>
                    </div>

                    {/* Key Metrics Row */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Total Votes"
                            value={statistics.total_votes.toLocaleString()}
                            icon={Users}
                            iconColor="text-[color:var(--color-analytics-purple)]"
                            trend={statistics.trend_percentage !== 0 ? {
                                value: statistics.trend_percentage,
                                label: 'from yesterday'
                            } : undefined}
                        />
                        <MetricCard
                            title="Leading Option"
                            value={statistics.leading_option || 'N/A'}
                            icon={CheckCircle2}
                            iconColor="text-[color:var(--color-analytics-green)]"
                        />
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
                                <Calendar className="h-4 w-4 text-[color:var(--color-analytics-orange)]" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-0.5">
                                    {statistics.duration.start && statistics.duration.end ? (
                                        <>
                                            <div className="text-base font-bold">{formatLocalDate(statistics.duration.start)}</div>
                                            <div className="text-xs text-muted-foreground">
                                                to {formatLocalDate(statistics.duration.end)}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-2xl font-bold">Not set</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <MetricCard
                            title="Conversion Rate"
                            value={`${statistics.conversion_rate}%`}
                            icon={TrendingUp}
                            iconColor="text-[color:var(--color-analytics-cyan)]"
                            subtitle="Of eligible voters"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        {/* Vote Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Vote Distribution</CardTitle>
                                <CardDescription>Total votes per option</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CustomBarChart
                                    data={poll.options}
                                    dataKey="votes_count"
                                    categoryKey="text"
                                    layout="vertical"
                                    barColor={ANALYTICS_COLORS.purple}
                                    categoryWidth={120}
                                />
                            </CardContent>
                        </Card>

                        {/* Percentage Breakdown */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Percentage Breakdown</CardTitle>
                                <CardDescription>Vote share distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CustomPieChart
                                    data={percentageBreakdown}
                                    colors={CHART_COLORS}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Voting Trend */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Voting Trend (Last 7 Days)</CardTitle>
                            <CardDescription>Daily voting activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomAreaChart
                                data={votingTrend}
                                dataKey="votes"
                                categoryKey="date"
                                color={ANALYTICS_COLORS.purple}
                            />
                        </CardContent>
                    </Card>

                    {/* Voter Log */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Voter Log</CardTitle>
                            <CardDescription>
                                {poll.type === 'open' ? 'Public voting records' : 'Anonymized voting data'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {poll.type === 'closed' ? (
                                <EmptyState
                                    icon={Lock}
                                    title="Voter information is private"
                                    description="This is a closed ballot. Individual votes are confidential and cannot be viewed."
                                />
                            ) : voterLog && voterLog.length > 0 ? (
                                <div className="space-y-0 rounded-md border">
                                    {/* Header */}
                                    <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-muted/30 border-b font-medium text-xs text-muted-foreground uppercase tracking-wide">
                                        <div>Voter</div>
                                        <div>Selection</div>
                                        <div>Timestamp</div>
                                    </div>
                                    {/* Rows */}
                                    <div className="divide-y">
                                        {voterLog.map((log) => (
                                            <div key={log.id} className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border">
                                                        <AvatarFallback className="text-xs">{log.voter.avatar}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">{log.voter.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{log.voter.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm">{log.selection}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-muted-foreground">{log.timestamp}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Eye}
                                    title="No votes cast yet"
                                    description=""
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
