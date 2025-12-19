import { Head, router } from '@inertiajs/react';
import { ArrowUpRight, ArrowDownRight, Users, CheckCircle2, Calendar, TrendingUp, Lock, Globe, Trash2, Share2 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatLocalDate, formatLocalTimeOnly, calculateDuration } from '@/lib/date-utils';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { BreadcrumbItem } from '@/types';

interface PollOption {
    id: number;
    text: string;
    order: number;
    votes_count: number;
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
}

interface PercentageBreakdownItem {
    name: string;
    value: number;
    percentage: number;
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PollResults({ poll, statistics, votingTrend, percentageBreakdown, voterLog }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Polls', href: '/polls' },
        { title: 'Results', href: '' },
    ];

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
            router.delete(`/polls/${poll.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${poll.question} - Results`} />

            <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="capitalize">
                                    {poll.type === 'open' ? (
                                        <>
                                            <Globe className="h-3 w-3 mr-1" />
                                            Open Ballot
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-3 w-3 mr-1" />
                                            Closed Ballot
                                        </>
                                    )}
                                </Badge>
                                <Badge variant="outline" className={poll.status === 'active' ? 'bg-green-500/15 text-green-700' : 'bg-gray-500/15'}>
                                    {poll.status === 'active' ? 'Active' : 'Ended'}
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">{poll.question}</h1>
                            {poll.description && (
                                <p className="mt-2 text-muted-foreground">{poll.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Share2 className="h-4 w-4" />
                                Share Report
                            </Button>
                            <Button variant="destructive" className="gap-2" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4" />
                                Delete Poll
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Total Votes */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.total_votes}</div>
                                {statistics.trend_percentage !== 0 && (
                                    <p className={`text-xs flex items-center gap-1 mt-1 ${statistics.trend_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {statistics.trend_percentage > 0 ? (
                                            <ArrowUpRight className="h-3 w-3" />
                                        ) : (
                                            <ArrowDownRight className="h-3 w-3" />
                                        )}
                                        {Math.abs(statistics.trend_percentage)}% from yesterday
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Leading Option */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Leading Option</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold truncate" title={statistics.leading_option || 'N/A'}>
                                    {statistics.leading_option || 'N/A'}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Duration */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Duration</CardTitle>
                                <Calendar className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    <div className="text-sm">
                                        {statistics.duration.start && statistics.duration.end ? (
                                            <>
                                                <div>{formatLocalDate(statistics.duration.start)}</div>
                                                <div className="text-muted-foreground text-xs">
                                                    {formatLocalDate(statistics.duration.end)}
                                                </div>
                                            </>
                                        ) : (
                                            'Not set'
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Conversion Rate */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.conversion_rate}%</div>
                                <p className="text-xs text-muted-foreground">Of eligible voters</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Vote Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vote Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={poll.options} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="text" type="category" width={120} />
                                        <Tooltip />
                                        <Bar dataKey="votes_count" fill="#6366f1" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Percentage Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Percentage Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={percentageBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {percentageBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Voting Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Voting Trend (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={votingTrend}>
                                    <defs>
                                        <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="votes" stroke="#6366f1" fillOpacity={1} fill="url(#colorVotes)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Voter Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Voter Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {poll.type === 'closed' ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Lock className="h-12 w-12 text-muted-foreground mb-3" />
                                    <p className="text-lg font-medium">Voter information is private and locked</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        This is a closed ballot. Individual votes are confidential.
                                    </p>
                                </div>
                            ) : voterLog && voterLog.length > 0 ? (
                                <div className="space-y-1">
                                    {/* Header */}
                                    <div className="grid grid-cols-3 gap-4 p-3 border-b font-medium text-sm text-muted-foreground">
                                        <div>Voter</div>
                                        <div>Selection</div>
                                        <div>Timestamp</div>
                                    </div>
                                    {/* Rows */}
                                    {voterLog.map((log) => (
                                        <div key={log.id} className="grid grid-cols-3 gap-4 p-3 border-b hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{log.voter.avatar}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{log.voter.name}</span>
                                            </div>
                                            <div>{log.selection}</div>
                                            <div className="text-muted-foreground">{log.timestamp}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No votes cast yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
