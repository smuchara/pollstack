import {
    AlignLeft,
    Building2,
    Calendar,
    Check,
    Clock,
    Eye,
    EyeOff,
    Globe,
    Lock,
    Plus,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';


export interface User {
    id: number;
    name: string;
    email: string;
}

export interface PollFormData {
    question: string;
    description: string;
    type: string;
    visibility: string;
    start_at: string;
    end_at: string;
}

export interface PollFormErrors {
    question?: string;
    description?: string;
    type?: string;
    visibility?: string;
    start_at?: string;
    end_at?: string;
}

interface PollFormSharedProps {
    formData: PollFormData;
    errors?: PollFormErrors;
    onFormDataChange: <K extends keyof PollFormData>(
        field: K,
        value: PollFormData[K],
    ) => void;
    users?: User[];
    selectedUsers: number[];
    onUsersChange: (ids: number[]) => void;
    inviteFile?: File | null;
    onInviteFileChange?: (file: File | null) => void;
    inviteListCount?: number;
    onViewInviteList?: () => void;
    onClearInviteList?: () => void;
}

export function PollFormShared({
    formData,
    errors = {},
    onFormDataChange,
    users = [],
    selectedUsers,
    onUsersChange,
    inviteFile,
    onInviteFileChange,
    inviteListCount = 0,
    onViewInviteList,
    onClearInviteList,
}: PollFormSharedProps) {
    const [userSearchQuery, setUserSearchQuery] = useState('');


    const toggleUser = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            onUsersChange(selectedUsers.filter((id) => id !== userId));
        } else {
            onUsersChange([...selectedUsers, userId]);
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearchQuery.toLowerCase()),
    );

    const getTotalInvitedCount = () => {
        return selectedUsers.length + inviteListCount;
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label
                        htmlFor="question"
                        className="flex items-center gap-2"
                    >
                        <AlignLeft className="h-4 w-4" />
                        Poll Question
                    </Label>
                    <Input
                        id="question"
                        placeholder="e.g., What is your favorite backend framework?"
                        value={formData.question}
                        onChange={(e) =>
                            onFormDataChange('question', e.target.value)
                        }
                        required
                    />
                    {errors.question && (
                        <p className="text-sm text-destructive">
                            {errors.question}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                        id="description"
                        placeholder="Provide more context about this poll..."
                        value={formData.description}
                        onChange={(e) =>
                            onFormDataChange('description', e.target.value)
                        }
                        rows={3}
                    />
                    {errors.description && (
                        <p className="text-sm text-destructive">
                            {errors.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="type">Ballot Type</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(val) => onFormDataChange('type', val)}
                    >
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
                        value={formData.visibility}
                        onValueChange={(val) =>
                            onFormDataChange('visibility', val)
                        }
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

            {formData.visibility === 'invite_only' && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <Label className="text-base font-medium">
                                Invite Participants
                            </Label>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                            <Zap className="h-3 w-3" />
                            QuickInvite™
                        </Badge>
                    </div>

                    <Tabs defaultValue="bulk" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="bulk" className="gap-2">
                                <Users className="h-4 w-4" />
                                Bulk Invite
                            </TabsTrigger>
                            <TabsTrigger value="users" className="gap-2">
                                <Users className="h-4 w-4" />
                                Individual Users
                                {selectedUsers.length > 0 && (
                                    <Badge
                                        variant="default"
                                        className="ml-1 h-5 px-1.5"
                                    >
                                        {selectedUsers.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="bulk" className="mt-4">
                            {inviteListCount > 0 ? (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-900/30 dark:bg-green-900/10">
                                    <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                                    <p className="font-medium text-green-700 dark:text-green-400">
                                        {inviteListCount} users ready to invite
                                    </p>
                                    <div className="mt-3 flex justify-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={onViewInviteList}
                                        >
                                            Review List
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClearInviteList}
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Label>Upload Excel / CSV</Label>
                                    <div className="rounded-lg border border-dashed p-6 text-center hover:bg-muted/50">
                                        <Input
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            className="mx-auto max-w-xs"
                                            onChange={(e) => {
                                                if (
                                                    e.target.files?.[0] &&
                                                    onInviteFileChange
                                                ) {
                                                    onInviteFileChange(
                                                        e.target.files[0],
                                                    );
                                                }
                                            }}
                                        />
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Upload a list of emails to invite.
                                        </p>
                                        {inviteFile && (
                                            <p className="mt-2 text-sm font-medium text-primary">
                                                Selected: {inviteFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="users" className="mt-4">
                            <div className="space-y-3">
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={userSearchQuery}
                                    onChange={(e) =>
                                        setUserSearchQuery(e.target.value)
                                    }
                                />

                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUsers.map((userId) => {
                                            const user = users.find(
                                                (u) => u.id === userId,
                                            );
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
                                                        onClick={() =>
                                                            toggleUser(userId)
                                                        }
                                                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="grid max-h-48 gap-1 overflow-y-auto">
                                    {filteredUsers
                                        .filter(
                                            (u) =>
                                                !selectedUsers.includes(u.id),
                                        )
                                        .slice(0, 20)
                                        .map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex cursor-pointer items-center justify-between rounded p-2 hover:bg-muted/50"
                                                onClick={() =>
                                                    toggleUser(user.id)
                                                }
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    {filteredUsers.filter(
                                        (u) => !selectedUsers.includes(u.id),
                                    ).length === 0 && (
                                        <p className="py-4 text-center text-sm text-muted-foreground">
                                            {userSearchQuery
                                                ? 'No users found.'
                                                : 'No more users available.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {(inviteFile ||
                        selectedUsers.length > 0) && (
                        <div className="flex items-center gap-2 border-t pt-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>
                                Approximately{' '}
                                <strong>{getTotalInvitedCount()}</strong> user
                                {getTotalInvitedCount() !== 1 ? 's' : ''} will
                                be invited
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label
                        htmlFor="start_at"
                        className="flex items-center gap-2"
                    >
                        <Calendar className="h-4 w-4" />
                        Start Date
                    </Label>
                    <Input
                        id="start_at"
                        type="datetime-local"
                        value={formData.start_at}
                        onChange={(e) =>
                            onFormDataChange('start_at', e.target.value)
                        }
                    />
                    {errors.start_at && (
                        <p className="text-sm text-destructive">
                            {errors.start_at}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end_at" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        End Date
                    </Label>
                    <Input
                        id="end_at"
                        type="datetime-local"
                        value={formData.end_at}
                        onChange={(e) =>
                            onFormDataChange('end_at', e.target.value)
                        }
                    />
                    {errors.end_at && (
                        <p className="text-sm text-destructive">
                            {errors.end_at}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PollFormShared;
