import {
    AlignLeft,
    Building2,
    Calendar,
    Check,
    Clock,
    Eye,
    EyeOff,
    Globe,
    Laptop,
    Lock,
    MapPin,
    Plus,
    QrCode,
    Users,
    X,
    Zap,
    Trash2,
    Shield,
    UserPlus,
} from 'lucide-react';
import { useState, useMemo } from 'react';

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
import { ExtractedUser } from './poll-invite-review-modal';
import { ProxyAssignmentModal, ProxyUser } from './proxy-assignment-modal';


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
    voting_access_mode: string;
    start_at: string;
    end_at: string;
}

export interface PollFormErrors {
    question?: string;
    description?: string;
    type?: string;
    visibility?: string;
    voting_access_mode?: string;
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
    // Updated props for inline list and proxies
    reviewedUsers?: ExtractedUser[];
    onReviewedUsersChange?: (users: ExtractedUser[]) => void;
    proxies?: {principal: string|number, proxy: string|number}[];
    onProxiesChange?: (proxies: {principal: string|number, proxy: string|number}[]) => void;
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
    // updated props
    reviewedUsers = [],
    onReviewedUsersChange,
    proxies = [],
    onProxiesChange,
}: PollFormSharedProps) {
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [reviewedUserSearch, setReviewedUserSearch] = useState('');
    const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);

    // Helpers for Proxy Modal
    const availableProxyUsers = useMemo(() => {
        // Map existing selected users
        const existing = selectedUsers.map(id => {
            const u = users.find(x => x.id === id);
            // Ensure type is 'existing' literal
            return u ? { id: u.id, name: u.name, email: u.email, type: 'existing' as const } : null;
        }).filter((x): x is ProxyUser => x !== null);

        // Map extracted users
        const extracted: ProxyUser[] = reviewedUsers.map(u => ({
            id: u.id, // Temp ID from extraction
            name: u.name,
            email: u.email,
            type: 'new'
        }));

        return [...existing, ...extracted];
    }, [selectedUsers, users, reviewedUsers]);

    const handleAssignProxy = (principal: ProxyUser, proxy: ProxyUser) => {
        if (!onProxiesChange) return;
        // Check duplication
        const exists = proxies.find(p => p.principal === principal.id);
        if (exists) {
            // Update or ignore? Let's update
             onProxiesChange(proxies.map(p => p.principal === principal.id ? { ...p, proxy: proxy.id } : p));
        } else {
             onProxiesChange([...proxies, { principal: principal.id, proxy: proxy.id }]);
        }
    };

    const getProxyName = (proxyId: string | number) => {
        const p = availableProxyUsers.find(u => u?.id == proxyId); // loose eq for string/number match
        return p ? p.name : 'Unknown';
    };

    const removeProxy = (principalId: string | number) => {
        if (!onProxiesChange) return;
        onProxiesChange(proxies.filter(p => p.principal !== principalId));
    };
    
    const removeReviewedUser = (id: number) => {
        if (!onReviewedUsersChange) return;
        onReviewedUsersChange(reviewedUsers.filter(u => u.id !== id));
        // Also remove any proxies associated
        if (onProxiesChange) {
            onProxiesChange(proxies.filter(p => p.principal !== id && p.proxy !== id));
        }
    };

    const filteredReviewedUsers = reviewedUsers.filter(u => 
        u.name.toLowerCase().includes(reviewedUserSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(reviewedUserSearch.toLowerCase())
    );


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
        return selectedUsers.length + reviewedUsers.length;
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

            {/* Voting Access Mode Section */}
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <Label className="text-base font-medium">Voting Access Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                    Choose how participants are allowed to vote in this poll.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                    {/* Remote Only */}
                    <label
                        className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all hover:bg-muted/50 ${
                            formData.voting_access_mode === 'remote_only'
                                ? 'border-primary bg-primary/5'
                                : 'border-muted'
                        }`}
                    >
                        <input
                            type="radio"
                            name="voting_access_mode"
                            value="remote_only"
                            checked={formData.voting_access_mode === 'remote_only'}
                            onChange={(e) =>
                                onFormDataChange('voting_access_mode', e.target.value)
                            }
                            className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <Laptop className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium">Remote Only</p>
                                <p className="text-xs text-muted-foreground">
                                    No verification needed
                                </p>
                            </div>
                        </div>
                        {formData.voting_access_mode === 'remote_only' && (
                            <div className="absolute right-2 top-2">
                                <Check className="h-4 w-4 text-primary" />
                            </div>
                        )}
                    </label>

                    {/* On-Premise Only */}
                    <label
                        className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all hover:bg-muted/50 ${
                            formData.voting_access_mode === 'on_premise_only'
                                ? 'border-primary bg-primary/5'
                                : 'border-muted'
                        }`}
                    >
                        <input
                            type="radio"
                            name="voting_access_mode"
                            value="on_premise_only"
                            checked={formData.voting_access_mode === 'on_premise_only'}
                            onChange={(e) =>
                                onFormDataChange('voting_access_mode', e.target.value)
                            }
                            className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="font-medium">On-Premise Only</p>
                                <p className="text-xs text-muted-foreground">
                                    QR verification required
                                </p>
                            </div>
                        </div>
                        {formData.voting_access_mode === 'on_premise_only' && (
                            <div className="absolute right-2 top-2">
                                <Check className="h-4 w-4 text-primary" />
                            </div>
                        )}
                    </label>

                    {/* Hybrid (Default) */}
                    <label
                        className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all hover:bg-muted/50 ${
                            formData.voting_access_mode === 'hybrid'
                                ? 'border-primary bg-primary/5'
                                : 'border-muted'
                        }`}
                    >
                        <input
                            type="radio"
                            name="voting_access_mode"
                            value="hybrid"
                            checked={formData.voting_access_mode === 'hybrid'}
                            onChange={(e) =>
                                onFormDataChange('voting_access_mode', e.target.value)
                            }
                            className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium">Hybrid</p>
                                <p className="text-xs text-muted-foreground">
                                    Remote or on-premise
                                </p>
                            </div>
                        </div>
                        {formData.voting_access_mode === 'hybrid' && (
                            <div className="absolute right-2 top-2">
                                <Check className="h-4 w-4 text-primary" />
                            </div>
                        )}
                        <Badge variant="secondary" className="absolute bottom-2 right-2 text-[10px]">
                            Default
                        </Badge>
                    </label>
                </div>
                {errors.voting_access_mode && (
                    <p className="text-sm text-destructive">
                        {errors.voting_access_mode}
                    </p>
                )}
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

                        <TabsContent value="bulk" className="mt-4 space-y-4">
                            
                            {/* Always show upload to add more? Or replace? 
                                User asked for "users extracted... appear inside".
                                Let's keep upload visible if list is empty, or collapsed if not.
                             */}
                             
                             <div className="space-y-3">
                                {reviewedUsers.length === 0 && (
                                    <div className="rounded-lg border border-dashed p-6 text-center hover:bg-muted/50">
                                         <Input
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            className="mx-auto max-w-xs"
                                            onChange={(e) => {
                                                if (e.target.files?.[0] && onInviteFileChange) {
                                                    onInviteFileChange(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <p className="mt-2 text-xs text-muted-foreground">Upload Excel/CSV to invite users.</p>
                                    </div>
                                )}
                             </div>

                            {/* Inline List of Extracted Users */}
                            {reviewedUsers.length > 0 && (
                                <div className="rounded-md border bg-card">
                                    {/* Sticky Toolbar */}
                                    <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-muted/40 p-2 backdrop-blur">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-background">
                                                {reviewedUsers.length} Users
                                            </Badge>
                                            {/* Search for reviewed users */}
                                            <Input 
                                                className="h-8 w-40 bg-background text-xs" 
                                                placeholder="Search list..." 
                                                value={reviewedUserSearch}
                                                onChange={(e) => setReviewedUserSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                type="button" 
                                                size="sm" 
                                                variant="secondary"
                                                onClick={() => setIsProxyModalOpen(true)}
                                                className="h-8 gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                                            >
                                                <Shield className="h-3.5 w-3.5" />
                                                Assign Proxy
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onReviewedUsersChange?.([])}
                                                className="h-8 w-8 p-0 text-destructive"
                                                title="Clear All"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Scrollable list */}
                                    <div className="max-h-[300px] overflow-auto p-2">
                                        {filteredReviewedUsers.length === 0 ? (
                                             <p className="py-4 text-center text-sm text-muted-foreground">No users match your search.</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {filteredReviewedUsers.map((user) => {
                                                    const proxy = proxies.find(p => p.principal === user.id);
                                                    return (
                                                        <div key={user.id} className="flex items-center justify-between rounded p-2 hover:bg-muted/50">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="truncate text-sm font-medium">{user.name}</p>
                                                                        {proxy && (
                                                                            <Badge variant="outline" className="h-5 gap-1 border-purple-200 bg-purple-50 px-1 text-[10px] text-purple-700">
                                                                                <Shield className="h-3 w-3" />
                                                                                Proxy: {getProxyName(proxy.proxy)}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {proxy && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                        onClick={() => removeProxy(user.id)}
                                                                        title="Remove Proxy"
                                                                    >
                                                                        <Shield className="h-3.5 w-3.5 fill-current opacity-50" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => removeReviewedUser(user.id)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Footer with add more option */}
                                    <div className="border-t bg-muted/20 p-2 text-center">
                                       <div className="relative">
                                            <Input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                className="absolute inset-0 cursor-pointer opacity-0"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0] && onInviteFileChange) {
                                                        onInviteFileChange(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                            <Button variant="outline" size="sm" className="w-full gap-2 border-dashed">
                                                <UserPlus className="h-4 w-4" />
                                                Import More Users
                                            </Button>
                                       </div>
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
            <ProxyAssignmentModal
                isOpen={isProxyModalOpen}
                onClose={() => setIsProxyModalOpen(false)}
                availableUsers={availableProxyUsers}
                onAssign={handleAssignProxy}
            />
        </div>
    );
}

export default PollFormShared;
