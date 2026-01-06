import { useState, useEffect } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import { Plus, Trash2, Calendar, Lock, Globe, Clock, AlignLeft, List, Users, Building2, Eye, EyeOff, Zap, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { localToUTC, utcToLocalInput } from '@/lib/date-utils';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PollOption {
    text: string;
    id?: number;
    votes_count?: number;
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
    id?: number;
    question: string;
    description?: string | null;
    type: string;
    visibility?: string;
    status?: string;
    start_at?: string | null;
    end_at?: string | null;
    organization_id?: number | string | null;
    options?: PollOption[];
    invited_users?: User[];
    invited_departments?: Department[];
}

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    poll?: Poll;
    context?: 'super-admin' | 'organization';
    organizationSlug?: string;
    departments?: Department[];
    users?: User[];
}

export default function CreatePollModal({
    isOpen,
    onClose,
    poll,
    context = 'super-admin',
    organizationSlug,
    departments = [],
    users = [],
}: CreatePollModalProps) {
    // Initialize options based on poll or default
    const [options, setOptions] = useState<PollOption[]>(
        poll?.options?.map((o) => ({ text: o.text })) || [{ text: '' }, { text: '' }]
    );

    // Invitation states
    const [selectedDepartments, setSelectedDepartments] = useState<number[]>(
        poll?.invited_departments?.map((d) => d.id) || []
    );
    const [selectedUsers, setSelectedUsers] = useState<number[]>(
        poll?.invited_users?.map((u) => u.id) || []
    );
    const [userSearchQuery, setUserSearchQuery] = useState('');

    const form = useForm({
        question: poll?.question || '',
        description: poll?.description || '',
        type: poll?.type || 'open',
        visibility: poll?.visibility || 'public',
        status: 'active', // Backend will determine actual status based on timing
        start_at: poll?.start_at ? utcToLocalInput(poll.start_at) : '',
        end_at: poll?.end_at ? utcToLocalInput(poll.end_at) : '',
        organization_id: poll?.organization_id || '',
        options: [] as PollOption[],
        invite_user_ids: [] as number[],
        invite_department_ids: [] as number[],
    });

    // Reset form when poll changes
    useEffect(() => {
        if (poll && isOpen) {
            form.setData({
                question: poll.question,
                description: poll.description || '',
                type: poll.type,
                visibility: poll.visibility || 'public',
                status: 'active',
                start_at: poll.start_at ? utcToLocalInput(poll.start_at) : '',
                end_at: poll.end_at ? utcToLocalInput(poll.end_at) : '',
                organization_id: poll.organization_id || '',
                options: [],
                invite_user_ids: [],
                invite_department_ids: [],
            });
            setOptions(poll.options?.map((o) => ({ text: o.text })) || [{ text: '' }, { text: '' }]);
            setSelectedDepartments(poll.invited_departments?.map((d) => d.id) || []);
            setSelectedUsers(poll.invited_users?.map((u) => u.id) || []);
        }
    }, [poll, isOpen]);

    // Reset when closing
    useEffect(() => {
        if (!isOpen) {
            setUserSearchQuery('');
        }
    }, [isOpen]);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { text: '' }]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) {
            toast.error('A poll must have at least 2 options.');
            return;
        }
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const toggleDepartment = (deptId: number) => {
        setSelectedDepartments((prev) =>
            prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
        );
    };

    const toggleUser = (userId: number) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const getTotalInvitedCount = () => {
        const deptUserCount = departments
            .filter((d) => selectedDepartments.includes(d.id))
            .reduce((sum, d) => sum + d.users_count, 0);
        return deptUserCount + selectedUsers.length;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (options.some((opt) => !opt.text.trim())) {
            toast.error('All options must have text.');
            return;
        }

        // Validate invite-only polls have invitations
        if (
            form.data.visibility === 'invite_only' &&
            selectedDepartments.length === 0 &&
            selectedUsers.length === 0
        ) {
            toast.error('Invite-only polls must have at least one invited user or department.');
            return;
        }

        // Prepare data with proper null handling for organization_id
        const preparedOrganizationId =
            form.data.organization_id && form.data.organization_id !== ''
                ? form.data.organization_id
                : null;

        const dataToSubmit = {
            question: form.data.question,
            description: form.data.description || null,
            type: form.data.type,
            visibility: form.data.visibility,
            status: form.data.status,
            start_at: form.data.start_at ? localToUTC(form.data.start_at) : null,
            end_at: form.data.end_at ? localToUTC(form.data.end_at) : null,
            organization_id: preparedOrganizationId,
            options: options,
            invite_user_ids: form.data.visibility === 'invite_only' ? selectedUsers : [],
            invite_department_ids: form.data.visibility === 'invite_only' ? selectedDepartments : [],
        };

        // Determine base URL based on context
        const baseUrl =
            context === 'organization'
                ? `/organization/${organizationSlug}/admin/polls-management`
                : '/super-admin/polls';

        if (poll) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.put(`${baseUrl}/${poll.id}`, dataToSubmit as any, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Poll updated successfully');
                    form.reset();
                    onClose();
                },
                onError: (errors) => {
                    toast.error('Failed to update poll.');
                    console.error(errors);
                },
            });
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.post(baseUrl, dataToSubmit as any, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Poll created successfully');
                    form.reset();
                    setOptions([{ text: '' }, { text: '' }]);
                    setSelectedDepartments([]);
                    setSelectedUsers([]);
                    onClose();
                },
                onError: (errors) => {
                    toast.error('Failed to create poll.');
                    console.error(errors);
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent size="2xl" className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{poll ? 'Edit Poll' : 'Create New Poll'}</DialogTitle>
                        <DialogDescription>
                            {poll ? 'Update the poll details.' : 'Configure the poll details, visibility, options, and schedule.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="question" className="flex items-center gap-2">
                                    <AlignLeft className="h-4 w-4" />
                                    Poll Question
                                </Label>
                                <Input
                                    id="question"
                                    placeholder="e.g., What is your favorite backend framework?"
                                    value={form.data.question}
                                    onChange={(e) => form.setData('question', e.target.value)}
                                    required
                                />
                                {form.errors.question && (
                                    <p className="text-sm text-destructive">{form.errors.question}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Provide more context..."
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Type & Visibility Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Ballot Type</Label>
                                <Select value={form.data.type} onValueChange={(val) => form.setData('type', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                <span>Open Ballot</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="closed">
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                <span>Closed Ballot</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="visibility">Poll Visibility</Label>
                                <Select
                                    value={form.data.visibility}
                                    onValueChange={(val) => form.setData('visibility', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select visibility" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-4 w-4" />
                                                <span>Public (All Users)</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="invite_only">
                                            <div className="flex items-center gap-2">
                                                <EyeOff className="h-4 w-4" />
                                                <span>Invite Only</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Invite Section - Only show for invite_only */}
                        {form.data.visibility === 'invite_only' && (
                            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        <Label className="text-base font-medium">Invite Participants</Label>
                                    </div>
                                    <Badge variant="secondary" className="gap-1">
                                        <Zap className="h-3 w-3" />
                                        QuickInvite™
                                    </Badge>
                                </div>

                                <Tabs defaultValue="departments" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="departments" className="gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Departments
                                            {selectedDepartments.length > 0 && (
                                                <Badge variant="default" className="ml-1 h-5 px-1.5">
                                                    {selectedDepartments.length}
                                                </Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="users" className="gap-2">
                                            <Users className="h-4 w-4" />
                                            Individual Users
                                            {selectedUsers.length > 0 && (
                                                <Badge variant="default" className="ml-1 h-5 px-1.5">
                                                    {selectedUsers.length}
                                                </Badge>
                                            )}
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="departments" className="mt-4">
                                        <div className="space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                Select departments to invite all their members at once.
                                            </p>
                                            <div className="grid gap-2 max-h-48 overflow-y-auto">
                                                {departments.map((dept) => (
                                                    <div
                                                        key={dept.id}
                                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                                            selectedDepartments.includes(dept.id)
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border hover:bg-muted/50'
                                                        }`}
                                                        onClick={() => toggleDepartment(dept.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={selectedDepartments.includes(dept.id)}
                                                                onCheckedChange={() => toggleDepartment(dept.id)}
                                                            />
                                                            <div>
                                                                <p className="font-medium">{dept.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {dept.users_count} member{dept.users_count !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {dept.is_default && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Default
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                                {departments.length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                        No departments available.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="users" className="mt-4">
                                        <div className="space-y-3">
                                            <Input
                                                placeholder="Search users by name or email..."
                                                value={userSearchQuery}
                                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                            />

                                            {/* Selected Users */}
                                            {selectedUsers.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedUsers.map((userId) => {
                                                        const user = users.find((u) => u.id === userId);
                                                        if (!user) return null;
                                                        return (
                                                            <Badge
                                                                key={userId}
                                                                variant="secondary"
                                                                className="gap-1 pr-1"
                                                            >
                                                                {user.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleUser(userId)}
                                                                    className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div className="grid gap-1 max-h-48 overflow-y-auto">
                                                {filteredUsers
                                                    .filter((u) => !selectedUsers.includes(u.id))
                                                    .slice(0, 20)
                                                    .map((user) => (
                                                        <div
                                                            key={user.id}
                                                            className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
                                                            onClick={() => toggleUser(user.id)}
                                                        >
                                                            <div>
                                                                <p className="font-medium text-sm">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                                            </div>
                                                            <Button type="button" variant="ghost" size="sm">
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                {filteredUsers.filter((u) => !selectedUsers.includes(u.id)).length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                        {userSearchQuery ? 'No users found.' : 'No more users available.'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                {/* Summary */}
                                {(selectedDepartments.length > 0 || selectedUsers.length > 0) && (
                                    <div className="flex items-center gap-2 pt-2 border-t text-sm">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>
                                            Approximately <strong>{getTotalInvitedCount()}</strong> user
                                            {getTotalInvitedCount() !== 1 ? 's' : ''} will be invited
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Options */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <List className="h-4 w-4" />
                                Poll Options
                            </Label>
                            <div className="space-y-2">
                                {options.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder={`Option ${index + 1}`}
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOption(index)}
                                            disabled={options.length <= 2}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                className="mt-2 text-primary hover:text-primary/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                            </Button>
                        </div>

                        {/* Schedule */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_at" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Start Date
                                </Label>
                                <Input
                                    id="start_at"
                                    type="datetime-local"
                                    value={form.data.start_at}
                                    onChange={(e) => form.setData('start_at', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_at" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    End Date
                                </Label>
                                <Input
                                    id="end_at"
                                    type="datetime-local"
                                    value={form.data.end_at}
                                    onChange={(e) => form.setData('end_at', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : poll ? 'Save Changes' : 'Create Poll'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
