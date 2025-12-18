import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Edit, Trash2, PieChart, Calendar, Lock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Components
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

// Types
import type { BreadcrumbItem } from '@/types';

interface PollOption {
    id: number;
    text: string;
    order: number;
}

interface Poll {
    id: number;
    question: string;
    description: string | null;
    type: 'open' | 'closed';
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
}

interface Props {
    polls: {
        data: Poll[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

import CreatePollModal from '@/components/polls/create-poll-modal';

export default function PollsIndex({ polls }: Props) {
    const { props } = usePage<{ organization_slug: string }>();
    const orgSlug = props.organization_slug;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: `/organization/${orgSlug}/admin/dashboard` },
        { title: 'Polls', href: `/organization/${orgSlug}/admin/polls` },
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

        router.delete(`/organization/${orgSlug}/admin/polls/${pollToDelete.id}`, {
            onSuccess: () => {
                toast.success('Poll deleted successfully');
                setPollToDelete(null);
            },
            onError: () => {
                toast.error('Failed to delete poll');
            },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'scheduled': return 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'ended': return 'bg-gray-500/15 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
            default: return 'secondary';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Polls Management" />

            <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Polls Management
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Create and manage polls for your organization.
                            </p>
                        </div>

                        <Button onClick={handleCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Poll
                        </Button>
                    </div>

                    {/* Polls Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {polls.data.map((poll) => (
                            <Card key={poll.id} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`capitalize border ${getStatusColor(poll.status)}`}>
                                                    {poll.status}
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
                                    <CardDescription className="line-clamp-2 mt-2 h-10">
                                        {poll.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <div className="space-y-4">
                                        {/* Options Preview */}
                                        <div className="space-y-2">
                                            {poll.options.slice(0, 3).map(option => (
                                                <div key={option.id} className="text-sm border rounded px-3 py-2 bg-muted/30 truncate">
                                                    {option.text}
                                                </div>
                                            ))}
                                            {poll.options.length > 3 && (
                                                <div className="text-xs text-muted-foreground text-center">
                                                    +{poll.options.length - 3} more options
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                                            <div className="flex items-center gap-1" title="Start Date">
                                                <Calendar className="h-3 w-3" />
                                                {poll.start_at ? format(new Date(poll.start_at), 'MMM d, yyyy') : 'No start date'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-3 border-t bg-muted/10 flex justify-between gap-2">
                                    <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={() => router.get(`/organization/${orgSlug}/admin/polls/${poll.id}/results`)}>
                                        <PieChart className="h-3.5 w-3.5" />
                                        Results
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 gap-2 border-l border-r rounded-none" onClick={() => handleEdit(poll)}>
                                        <Edit className="h-3.5 w-3.5" />
                                        Edit
                                    </Button>
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
                        <div className="text-center py-12 rounded-lg border border-dashed bg-muted/20">
                            <PieChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <h3 className="text-lg font-medium">No polls found</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                                Create your first poll to get started.
                            </p>
                            <Button onClick={handleCreate} className="mt-4 gap-2">
                                <Plus className="h-4 w-4" />
                                Create Poll
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!pollToDelete} onOpenChange={() => setPollToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the poll
                            "{pollToDelete?.question}" and remove all collected votes.
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
            />
        </AppLayout>
    );
}
