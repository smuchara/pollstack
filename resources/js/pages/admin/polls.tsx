import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Eye, EyeOff, Users, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader, EmptyState } from '@/components/common';
import PollStatusBadge from '@/components/polls/poll-status-badge';
import PollTypeBadge from '@/components/polls/poll-type-badge';
import PollTiming from '@/components/polls/poll-timing';

// Types
import type { BreadcrumbItem } from '@/types';

interface PollOption {
    id: number;
    text: string;
    order: number;
}

interface Department {
    id: number;
    name: string;
    slug: string;
    users_count: number;
    is_default: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Poll {
    id: number;
    question: string;
    description: string | null;
    type: 'open' | 'closed';
    visibility: 'public' | 'invite_only';
    status: 'scheduled' | 'active' | 'ended' | 'archived';
    start_at: string | null;
    end_at: string | null;
    created_by: number;
    organization_id: number | null;
    options: PollOption[];
    creator: {
        id: number;
        name: string;
    };
    organization: {
        id: number;
        name: string;
    } | null;
    invited_users_count?: number;
    invited_departments_count?: number;
    invitedUsers?: User[];
    invitedDepartments?: Department[];
}

interface Props {
    polls: {
        data: Poll[];
        current_page: number;
        last_page: number;
        total: number;
    };
    departments: Department[];
    users: User[];
}

import CreatePollModal from '@/components/polls/create-poll-modal';

export default function PollsIndex({ polls, departments, users }: Props) {
    const { props } = usePage<{ organization_slug: string }>();
    const orgSlug = props.organization_slug;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: `/organization/${orgSlug}/admin/dashboard` },
        { title: 'Polls', href: `/organization/${orgSlug}/admin/polls-management` },
    ];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [pollToEdit, setPollToEdit] = useState<Poll | undefined>(undefined);
    const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);

    const handleEdit = (poll: Poll) => {
        setPollToEdit(poll);
        setIsCreateModalOpen(true);
    };

    const handleCreate = () => {
        setPollToEdit(undefined);
        setIsCreateModalOpen(true);
    };

    const handleDelete = () => {
        if (!pollToDelete) return;

        router.delete(`/organization/${orgSlug}/admin/polls-management/${pollToDelete.id}`, {
            onSuccess: () => {
                toast.success('Poll deleted successfully');
                setPollToDelete(null);
            },
            onError: () => {
                toast.error('Failed to delete poll');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Polls Management" />

            <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <PageHeader
                        title="Polls Management"
                        description="Create and manage polls for your organization."
                        actions={
                            <Button onClick={handleCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Poll
                            </Button>
                        }
                    />

                    {/* Polls Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {polls.data.map((poll) => (
                            <Card key={poll.id} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <PollStatusBadge status={poll.status} />
                                                <PollTypeBadge type={poll.type} />
                                                {/* Visibility Badge */}
                                                {poll.visibility === 'invite_only' ? (
                                                    <Badge variant="outline" className="gap-1 text-xs">
                                                        <EyeOff className="h-3 w-3" />
                                                        Invite Only
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="gap-1 text-xs">
                                                        <Eye className="h-3 w-3" />
                                                        Public
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-lg leading-tight line-clamp-2" title={poll.question}>
                                                {poll.question}
                                            </CardTitle>
                                        </div>
                                    </div>
                                    <CardDescription className="line-clamp-2 mt-2 h-10">
                                        {poll.description || 'No description provided.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <div className="space-y-4">
                                        {/* Invitation Info for invite-only polls */}
                                        {poll.visibility === 'invite_only' && (
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {poll.invited_departments_count !== undefined &&
                                                    poll.invited_departments_count > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Building2 className="h-4 w-4" />
                                                            <span>{poll.invited_departments_count} dept</span>
                                                        </div>
                                                    )}
                                                {poll.invited_users_count !== undefined &&
                                                    poll.invited_users_count > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            <span>{poll.invited_users_count} users</span>
                                                        </div>
                                                    )}
                                            </div>
                                        )}

                                        {/* Options Preview */}
                                        <div className="space-y-2">
                                            {poll.options.slice(0, 3).map((option) => (
                                                <div
                                                    key={option.id}
                                                    className="text-sm border rounded px-3 py-2 bg-muted/30 truncate"
                                                >
                                                    {option.text}
                                                </div>
                                            ))}
                                            {poll.options.length > 3 && (
                                                <div className="text-xs text-muted-foreground text-center">
                                                    +{poll.options.length - 3} more options
                                                </div>
                                            )}
                                        </div>

                                        {/* Poll Timing Information */}
                                        <PollTiming startAt={poll.start_at} endAt={poll.end_at} />
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-3 border-t bg-muted/10 flex justify-between gap-2">
                                    {poll.status === 'scheduled' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 gap-2"
                                            onClick={() => handleEdit(poll)}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setPollToDelete(poll)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {polls.data.length === 0 && (
                        <EmptyState
                            icon={Calendar}
                            title="No polls found"
                            description="Create your first poll to get started."
                            action={{
                                label: 'Create Poll',
                                onClick: handleCreate,
                                icon: Plus,
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!pollToDelete} onOpenChange={() => setPollToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the poll "
                            {pollToDelete?.question}" and remove all collected votes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete Poll
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Create Modal */}
            <CreatePollModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                poll={pollToEdit}
                context="organization"
                organizationSlug={orgSlug}
                departments={departments}
                users={users}
            />
        </AppLayout>
    );
}
