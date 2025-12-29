import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, Circle, Clock, PieChart, Vote, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageHeader, EmptyState } from '@/components/common';
import PollStatusBadge from '@/components/polls/poll-status-badge';
import PollTypeBadge from '@/components/polls/poll-type-badge';
import PollTiming from '@/components/polls/poll-timing';
import { type BreadcrumbItem } from '@/types';

interface PollOption {
    id: number;
    text: string;
    order: number;
    votes_count?: number;
}

interface Poll {
    id: number;
    question: string;
    description: string | null;
    type: 'open' | 'closed';
    status: 'scheduled' | 'active' | 'ended' | 'archived';
    start_at: string | null;
    end_at: string | null;
    organization_id: number | null;
    options: PollOption[];
    organization: {
        id: number;
        name: string;
    } | null;
    creator: {
        id: number;
        name: string;
    };
    user_has_voted: boolean;
    user_vote?: {
        poll_option_id: number;
    };
    total_votes?: number;
}

interface Props {
    activePolls: Poll[];
    endedPolls: Poll[];
    counts: {
        active: number;
        ended: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Poll Voting', href: '/polls' },
];

export default function PollsIndex({ activePolls, endedPolls, counts }: Props) {
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState<Record<number, boolean>>({});

    const handleVote = (pollId: number) => {
        const optionId = selectedOptions[pollId];

        if (!optionId) {
            toast.error('Please select an option');
            return;
        }

        setSubmitting({ ...submitting, [pollId]: true });

        router.post(`/polls/${pollId}/vote`,
            { option_id: optionId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Vote cast successfully!');
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(errors.poll || 'Failed to cast vote');
                },
                onFinish: () => {
                    setSubmitting({ ...submitting, [pollId]: false });
                },
            }
        );
    };

    const renderActivePoll = (poll: Poll) => (
        <Card key={poll.id} className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <PollStatusBadge
                                status={poll.status}
                                userHasVoted={poll.user_has_voted}
                            />
                            <PollTypeBadge type={poll.type} />
                        </div>
                        <CardTitle className="text-lg leading-tight line-clamp-2" title={poll.question}>
                            {poll.question}
                        </CardTitle>
                    </div>
                </div>
                {poll.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                        {poll.description}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="flex-1 pb-3">
                {poll.user_has_voted ? (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Your vote:</p>
                        {poll.options.map((option) => (
                            <div
                                key={option.id}
                                className={`text-sm border rounded px-3 py-2 ${poll.user_vote?.poll_option_id === option.id
                                    ? 'bg-primary/10 border-primary font-medium'
                                    : 'bg-muted/30'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {poll.user_vote?.poll_option_id === option.id && (
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                    )}
                                    {option.text}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Select your choice:</Label>
                        <RadioGroup
                            value={selectedOptions[poll.id]?.toString()}
                            onValueChange={(value) =>
                                setSelectedOptions({
                                    ...selectedOptions,
                                    [poll.id]: parseInt(value),
                                })
                            }
                        >
                            {poll.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.id.toString()} id={`poll-${poll.id}-option-${option.id}`} />
                                    <Label
                                        htmlFor={`poll-${poll.id}-option-${option.id}`}
                                        className="flex-1 cursor-pointer text-sm"
                                    >
                                        {option.text}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                )}

                {/* Poll Timing Information */}
                <PollTiming
                    startAt={poll.start_at}
                    endAt={poll.end_at}
                    organization={poll.organization}
                />
            </CardContent>

            {!poll.user_has_voted && (
                <CardFooter className="pt-3 border-t bg-muted/10">
                    <Button
                        className="w-full"
                        onClick={() => handleVote(poll.id)}
                        disabled={!selectedOptions[poll.id] || submitting[poll.id]}
                    >
                        {submitting[poll.id] ? 'Submitting...' : 'Cast Vote'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );

    const renderClosedPoll = (poll: Poll) => (
        <Card key={poll.id} className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Closed
                            </Badge>
                            <PollTypeBadge type={poll.type} />
                        </div>
                        <CardTitle className="text-lg leading-tight line-clamp-2" title={poll.question}>
                            {poll.question}
                        </CardTitle>
                    </div>
                </div>
                {poll.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                        {poll.description}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="flex-1 pb-3">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                        Results ({poll.total_votes || 0} {(poll.total_votes || 0) === 1 ? 'vote' : 'votes'}):
                    </p>
                    {poll.options.map((option) => {
                        const votes = option.votes_count || 0;
                        const percentage = poll.total_votes ? Math.round((votes / poll.total_votes) * 100) : 0;
                        const isUserChoice = poll.user_vote?.poll_option_id === option.id;

                        return (
                            <div key={option.id} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className={isUserChoice ? 'font-medium' : ''}>
                                        {option.text} {isUserChoice && <CheckCircle2 className="inline h-3 w-3 text-primary ml-1" />}
                                    </span>
                                    <span className="text-muted-foreground">{percentage}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${isUserChoice ? 'bg-primary' : 'bg-primary/60'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Poll Timing Information */}
                <PollTiming
                    startAt={poll.start_at}
                    endAt={poll.end_at}
                    organization={poll.organization}
                />
            </CardContent>

            <CardFooter className="pt-3 border-t bg-muted/10">
                <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                        // Check if we are in an organization context
                        const currentPath = window.location.pathname;
                        const isOrgContext = currentPath.includes('/organization/');

                        if (isOrgContext && poll.organization) {
                            // Extract org slug from current path or poll data
                            // Structure: /organization/{slug}/admin/polls-voting
                            const pathParts = currentPath.split('/');
                            const orgIndex = pathParts.indexOf('organization');
                            if (orgIndex !== -1 && pathParts[orgIndex + 1]) {
                                const slug = pathParts[orgIndex + 1];
                                router.get(`/organization/${slug}/admin/polls-voting/${poll.id}/results`);
                                return;
                            }
                        }

                        // Fallback to global route
                        router.get(`/polls/${poll.id}/results`);
                    }}
                >
                    <PieChart className="h-4 w-4" />
                    View Results
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Poll Voting" />

            <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <PageHeader
                        title="Poll Voting"
                        description="Participate in ongoing polls and view results from closed polls."
                    />

                    {/* Tabbed Interface */}
                    <Tabs defaultValue="open" className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="open" className="gap-2">
                                <Vote className="h-4 w-4" />
                                Open Votes
                                <Badge variant="secondary" className="ml-1">
                                    {counts.active}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="closed" className="gap-2">
                                <PieChart className="h-4 w-4" />
                                Closed Votes
                                <Badge variant="secondary" className="ml-1">
                                    {counts.ended}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        {/* Open Votes Tab */}
                        <TabsContent value="open" className="mt-6">
                            {activePolls.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                    {activePolls.map(renderActivePoll)}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Vote}
                                    title="No active polls"
                                    description="There are currently no open polls available for you to vote on."
                                />
                            )}
                        </TabsContent>

                        {/* Closed Votes Tab */}
                        <TabsContent value="closed" className="mt-6">
                            {endedPolls.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                    {endedPolls.map(renderClosedPoll)}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={PieChart}
                                    title="No closed polls"
                                    description="There are currently no closed polls to view."
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
