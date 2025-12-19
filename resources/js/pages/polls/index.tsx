import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, Circle, Lock, Globe, Calendar, Users, Clock, PieChart } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatLocalDate, formatLocalTimeOnly, calculateDuration } from '@/lib/date-utils';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';

interface PollOption {
    id: number;
    text: string;
    order: number;
    votes_count?: number;  // For ended polls
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
    total_votes?: number;  // For ended polls
}

interface Props {
    polls: {
        data: Poll[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Polls', href: '/polls' },
];

export default function PollsIndex({ polls }: Props) {
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
                onError: (errors: any) => {
                    toast.error(errors.poll || 'Failed to cast vote');
                },
                onFinish: () => {
                    setSubmitting({ ...submitting, [pollId]: false });
                },
            }
        );
    };

    const getPollBadgeColor = (poll: Poll) => {
        if (poll.status === 'scheduled') {
            return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        }
        if (poll.status === 'ended') {
            return 'bg-gray-500/15 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
        }
        if (poll.user_has_voted) {
            return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        }
        return 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Active Polls" />

            <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Active Polls
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Participate in ongoing polls and make your voice heard.
                            </p>
                        </div>
                    </div>

                    {/* Polls Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {polls.data.map((poll) => (
                            <Card key={poll.id} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize border ${getPollBadgeColor(poll)}`}
                                                >
                                                    {poll.status === 'scheduled' ? (
                                                        <><Clock className="h-3 w-3 mr-1" /> Scheduled</>
                                                    ) : poll.status === 'ended' ? (
                                                        'Poll Ended'
                                                    ) : poll.user_has_voted ? (
                                                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Voted</>
                                                    ) : (
                                                        'Active'
                                                    )}
                                                </Badge>
                                                {poll.type === 'closed' ? (
                                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                                )}
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
                                    {poll.status === 'scheduled' ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <Clock className="h-12 w-12 text-amber-500 mb-3" />
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Poll opens soon
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Voting will begin at the scheduled start time
                                            </p>
                                        </div>
                                    ) : poll.status === 'ended' ? (
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
                                    ) : poll.user_has_voted ? (
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
                                    <div className="space-y-2 border-t pt-3 mt-3">
                                        {/* Duration Badge */}
                                        {poll.start_at && poll.end_at && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">Duration:</span>
                                                <div className="flex items-center gap-1 text-xs font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">
                                                    <Clock className="h-3 w-3" />
                                                    {calculateDuration(poll.start_at, poll.end_at)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Start Time */}
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Starts:</span>
                                            <span className="font-medium">
                                                {poll.start_at ? (
                                                    <>
                                                        {formatLocalDate(poll.start_at)}{' '}
                                                        <span className="text-muted-foreground">at</span>{' '}
                                                        {formatLocalTimeOnly(poll.start_at)}
                                                    </>
                                                ) : (
                                                    'Not set'
                                                )}
                                            </span>
                                        </div>

                                        {/* End Time */}
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Ends:</span>
                                            <span className="font-medium">
                                                {poll.end_at ? (
                                                    <>
                                                        {formatLocalDate(poll.end_at)}{' '}
                                                        <span className="text-muted-foreground">at</span>{' '}
                                                        {formatLocalTimeOnly(poll.end_at)}
                                                    </>
                                                ) : (
                                                    'Not set'
                                                )}
                                            </span>
                                        </div>

                                        {/* Organization */}
                                        {poll.organization && (
                                            <div className="flex items-center justify-between text-xs pt-2 border-t">
                                                <span className="text-muted-foreground">Organization:</span>
                                                <Badge variant="secondary" className="text-[10px] h-5">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {poll.organization.name}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>

                                {!poll.user_has_voted && poll.status === 'active' ? (
                                    <CardFooter className="pt-3 border-t bg-muted/10">
                                        <Button
                                            className="w-full"
                                            onClick={() => handleVote(poll.id)}
                                            disabled={!selectedOptions[poll.id] || submitting[poll.id]}
                                        >
                                            {submitting[poll.id] ? 'Submitting...' : 'Cast Vote'}
                                        </Button>
                                    </CardFooter>
                                ) : poll.status === 'ended' ? (
                                    <CardFooter className="pt-3 border-t bg-muted/10">
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={() => router.get(`/polls/${poll.id}/results`)}
                                        >
                                            <PieChart className="h-4 w-4" />
                                            View Details
                                        </Button>
                                    </CardFooter>
                                ) : null}
                            </Card>
                        ))}
                    </div>

                    {polls.data.length === 0 && (
                        <div className="text-center py-12 rounded-lg border border-dashed bg-muted/20">
                            <Circle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <h3 className="text-lg font-medium">No active polls</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                                There are currently no polls available for you to vote on.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
