import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, PieChart, Vote, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PageHeader, EmptyState } from '@/components/common';
import PollStatusBadge from '@/components/polls/poll-status-badge';
import PollTypeBadge from '@/components/polls/poll-type-badge';
import PollTiming from '@/components/polls/poll-timing';
import { PresenceVerificationGate, type VotingAccessMode } from '@/components/polls/presence-verification-gate';
import { VotingAccessModeBadge } from '@/components/polls/voting-access-mode-badge';
import { type BreadcrumbItem } from '@/types';

interface PollOption {
    id: number;
    text: string;
    order: number;
    votes_count?: number;
    image_url?: string | null;
    image_full_url?: string | null;
    name?: string | null;
    position?: string | null;
}

interface Poll {
    id: number;
    question: string;
    description: string | null;
    type: 'open' | 'closed';
    poll_type?: 'standard' | 'profile';
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
    voting_access_mode?: VotingAccessMode;
    verification_status?: {
        is_verified: boolean;
        verification_type: 'remote' | 'on_premise' | null;
        can_vote_remotely: boolean;
        requires_verification: boolean;
    };
    proxy_assignments: {
        user_id: number;
        name: string;
        has_voted: boolean;
    }[];
}

interface Props {
    activePolls: Poll[];
    scheduledPolls: Poll[];
    endedPolls: Poll[];
    counts: {
        active: number;
        scheduled: number;
        ended: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Poll Voting', href: '/polls' },
];

export default function PollsIndex({ activePolls, scheduledPolls, endedPolls, counts }: Props) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

    const handleVote = (pollId: number, onBehalfOf: number | null = null) => {
        const contextKey = `${pollId}_${onBehalfOf || 'self'}`;
        const optionId = selectedOptions[contextKey];

        if (!optionId) {
            toast.error('Please select an option');
            return;
        }

        setSubmitting({ ...submitting, [contextKey]: true });

        router.post(`/polls/${pollId}/vote`,
            { 
                option_id: optionId,
                on_behalf_of: onBehalfOf
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Vote cast successfully!');
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(errors.poll || 'Failed to cast vote');
                },
                onFinish: () => {
                    setSubmitting({ ...submitting, [contextKey]: false });
                },
            }
        );
    };

    const renderVotingForm = (poll: Poll, onBehalfOf: number | null = null) => {
        const contextKey = `${poll.id}_${onBehalfOf || 'self'}`;
        const hasVoted = onBehalfOf 
            ? poll.proxy_assignments?.find(p => p.user_id === onBehalfOf)?.has_voted 
            : poll.user_has_voted;
        
        // Find existing vote if available (only available for self in current backend, proxies just show status)
        const userVote = onBehalfOf ? null : poll.user_vote;

        if (hasVoted) {
            return (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                        {onBehalfOf ? 'Vote cast for this user.' : 'Your vote:'}
                    </p>
                    {poll.options.map((option) => (
                        <div
                            key={option.id}
                            className={`text-sm border rounded px-3 py-2 ${userVote?.poll_option_id === option.id
                                ? 'bg-primary/10 border-primary font-medium'
                                : 'bg-muted/30'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {userVote?.poll_option_id === option.id && (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                                {poll.poll_type === 'profile' ? (
                                    <div className="flex items-center gap-2">
                                        {option.image_full_url && (
                                            <img 
                                                src={option.image_full_url} 
                                                alt={option.name || option.text} 
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                        )}
                                        <span>{option.name || option.text}</span>
                                        {option.position && (
                                            <span className="text-xs text-muted-foreground">({option.position})</span>
                                        )}
                                    </div>
                                ) : (
                                    option.text
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Select choice:</Label>
                    
                    {poll.poll_type === 'profile' ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {poll.options.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => setSelectedOptions({
                                        ...selectedOptions,
                                        [contextKey]: option.id
                                    })}
                                    className={`
                                        cursor-pointer relative flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:bg-muted/50
                                        ${selectedOptions[contextKey] === option.id 
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                            : 'border-border hover:border-sidebar-accent'
                                        }
                                    `}
                                >
                                    <div className="mb-3 relative">
                                        {option.image_full_url ? (
                                            <img 
                                                src={option.image_full_url} 
                                                alt={option.name || option.text}
                                                className="h-16 w-16 rounded-full object-cover ring-2 ring-background shadow-sm"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary ring-2 ring-background">
                                                {(option.name || option.text).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {selectedOptions[contextKey] === option.id && (
                                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-md">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center w-full space-y-0.5">
                                        <div className="font-semibold text-sm truncate w-full" title={option.name || option.text}>
                                            {option.name || option.text}
                                        </div>
                                        {option.position && (
                                            <div className="text-xs text-muted-foreground truncate w-full" title={option.position}>
                                                {option.position}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <RadioGroup
                            value={selectedOptions[contextKey]?.toString()}
                            onValueChange={(value) =>
                                setSelectedOptions({
                                    ...selectedOptions,
                                    [contextKey]: parseInt(value),
                                })
                            }
                        >
                            {poll.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.id.toString()} id={`poll-${poll.id}-${onBehalfOf || 'self'}-option-${option.id}`} />
                                    <Label
                                        htmlFor={`poll-${poll.id}-${onBehalfOf || 'self'}-option-${option.id}`}
                                        className="flex-1 cursor-pointer text-sm"
                                    >
                                        {option.text}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                </div>

                <Button
                    className="w-full"
                    onClick={() => handleVote(poll.id, onBehalfOf)}
                    disabled={!selectedOptions[contextKey] || submitting[contextKey]}
                >
                    {submitting[contextKey] ? 'Submitting...' : 'Cast Vote'}
                </Button>
            </div>
        );
    };

    const renderActivePoll = (poll: Poll) => (
        <Card key={poll.id} className="flex flex-col overflow-hidden">
            <CardHeader className="pb-3 bg-card z-10 relative">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <PollStatusBadge
                                status={poll.status}
                                userHasVoted={poll.user_has_voted}
                            />
                            <PollTypeBadge type={poll.type} />
                            {poll.voting_access_mode && poll.voting_access_mode !== 'remote_only' && (
                                <VotingAccessModeBadge mode={poll.voting_access_mode} />
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

            <CardContent className="flex-1 pb-3 space-y-6">
                {/* My Vote Section */}
                <div>
                    <PresenceVerificationGate
                        pollId={poll.id}
                        votingAccessMode={poll.voting_access_mode || 'hybrid'}
                        isVerified={poll.verification_status?.is_verified || false}
                        verificationType={poll.verification_status?.verification_type}
                        onProceed={() => {}}
                    >
                        {renderVotingForm(poll, null)}
                    </PresenceVerificationGate>
                </div>

                {/* Proxy Votes Section */}
                {poll.proxy_assignments && poll.proxy_assignments.length > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                             <Vote className="h-4 w-4" />
                             Proxy Votes ({poll.proxy_assignments.length})
                        </h4>
                        <div className="space-y-4">
                            {poll.proxy_assignments.map((proxy) => (
                                <div key={proxy.user_id} className="p-4 rounded-lg bg-muted/30 border">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="font-medium flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {proxy.name.charAt(0).toUpperCase()}
                                            </div>
                                            {proxy.name}
                                        </div>
                                        {proxy.has_voted ? (
                                            <Badge variant="secondary" className="gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Voted
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Not Voted</Badge>
                                        )}
                                    </div>
                                    
                                    {renderVotingForm(poll, proxy.user_id)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Poll Timing Information */}
                <PollTiming
                    startAt={poll.start_at}
                    endAt={poll.end_at}
                    organization={poll.organization}
                    className="mt-2"
                />
            </CardContent>
        </Card>
    );

    const renderScheduledPoll = (poll: Poll) => (
        <Card key={poll.id} className="flex flex-col opacity-90">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <PollStatusBadge status={poll.status} />
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
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Options Preview:</Label>
                    <div className="space-y-2">
                         {poll.poll_type === 'profile' ? (
                            <div className="flex -space-x-2 overflow-hidden py-1">
                                {poll.options.slice(0, 5).map((option) => (
                                    <div key={option.id} className="relative rounded-full ring-2 ring-background">
                                        {option.image_full_url ? (
                                            <img
                                                src={option.image_full_url}
                                                alt={option.name || option.text}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {(option.name || option.text).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {poll.options.length > 5 && (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted ring-2 ring-background text-xs font-medium">
                                        +{poll.options.length - 5}
                                    </div>
                                )}
                            </div>
                         ) : (
                            poll.options.map((option) => (
                                <div key={option.id} className="text-sm border rounded px-3 py-2 bg-muted/30 text-muted-foreground">
                                    {option.text}
                                </div>
                            ))
                         )}
                    </div>
                </div>

                {/* Poll Timing Information */}
                <PollTiming
                    startAt={poll.start_at}
                    endAt={poll.end_at}
                    organization={poll.organization}
                    className="mt-4"
                />
            </CardContent>

             <CardFooter className="pt-3 border-t bg-muted/10">
                <div className="w-full text-center text-sm text-muted-foreground">
                    Voting starts {poll.start_at ? new Date(poll.start_at).toLocaleDateString() : 'soon'}
                </div>
            </CardFooter>
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
                                    <span className={`flex items-center gap-2 ${isUserChoice ? 'font-medium' : ''}`}>
                                        {poll.poll_type === 'profile' && option.image_full_url && (
                                            <img
                                                src={option.image_full_url}
                                                alt=""
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        )}
                                        {poll.poll_type === 'profile' && !option.image_full_url && (
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {(option.name || option.text).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {option.name || option.text} {isUserChoice && <CheckCircle2 className="inline h-3 w-3 text-primary ml-1" />}
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
        <TooltipProvider>
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
                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="active" className="gap-2">
                                <Vote className="h-4 w-4" />
                                Active
                                <Badge variant="secondary" className="ml-1">
                                    {counts.active}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="scheduled" className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Scheduled
                                <Badge variant="secondary" className="ml-1">
                                    {counts.scheduled}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="ended" className="gap-2">
                                <PieChart className="h-4 w-4" />
                                Ended
                                <Badge variant="secondary" className="ml-1">
                                    {counts.ended}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        {/* Active Polls Tab */}
                        <TabsContent value="active" className="mt-6">
                            {activePolls.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                    {activePolls.map(renderActivePoll)}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Vote}
                                    title="No active polls"
                                    description="There are currently no active polls available for you to vote on."
                                />
                            )}
                        </TabsContent>

                        {/* Scheduled Polls Tab */}
                        <TabsContent value="scheduled" className="mt-6">
                            {scheduledPolls.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                    {scheduledPolls.map(renderScheduledPoll)}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Vote}
                                    title="No scheduled polls"
                                    description="There are currently no polls scheduled for the future."
                                />
                            )}
                        </TabsContent>

                        {/* Ended Polls Tab */}
                        <TabsContent value="ended" className="mt-6">
                            {endedPolls.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                    {endedPolls.map(renderClosedPoll)}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={PieChart}
                                    title="No ended polls"
                                    description="There are currently no ended polls to view."
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
        </TooltipProvider>
    );
}
