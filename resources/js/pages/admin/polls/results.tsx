import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomBarChart, CustomPieChart } from '@/components/charts';
import { PageHeader } from '@/components/common';
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
        slug: string;
    } | null;
    options: PollOption[];
}

interface Props {
    poll: Poll;
}

export default function AdminPollResults({ poll }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Polls', href: poll.organization ? `/organization/${poll.organization.slug}/admin/polls` : '/admin/polls' },
        { title: 'Results', href: '' },
    ];

    const percentageBreakdown = poll.options.map((option) => {
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes_count, 0);
        return {
            name: option.text,
            value: option.votes_count,
            percentage: totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0,
        };
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${poll.question} - Results`} />

            <div className="min-h-screen bg-background p-6 text-foreground sm:p-8 lg:p-10">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <PageHeader
                        title={poll.question}
                        description={poll.description || undefined}
                    />

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
                                    barColor="#8b5cf6"
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
                                    colors={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1']}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
