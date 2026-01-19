import { useVirtualizer } from '@tanstack/react-virtual';
import {
    AlertCircle,
    CheckCircle2,
    Search,
    Trash2,
    User as UserIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
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

export interface ExtractedUser {
    id: number;
    email: string;
    name: string;
}

interface PollInviteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: ExtractedUser[];
    onConfirm: (users: ExtractedUser[]) => void;
}

export function PollInviteReviewModal({
    isOpen,
    onClose,
    users: initialUsers,
    onConfirm,
}: PollInviteReviewModalProps) {
    const [users, setUsers] = useState<ExtractedUser[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);

    // Update internal state when props change
    const [prevInitialUsers, setPrevInitialUsers] = useState(initialUsers);
    if (initialUsers !== prevInitialUsers) {
        setUsers(initialUsers);
        setPrevInitialUsers(initialUsers);
    }

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const lowerQuery = searchQuery.toLowerCase();
        return users.filter(
            (u) =>
                u.email.toLowerCase().includes(lowerQuery) ||
                u.name.toLowerCase().includes(lowerQuery),
        );
    }, [users, searchQuery]);

    const rowVirtualizer = useVirtualizer({
        count: filteredUsers.length,
        getScrollElement: () => parentRef,
        estimateSize: () => 60, // approximate row height
        overscan: 5,
    });

    const removeUser = (id: number) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const handleConfirm = () => {
        onConfirm(users);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Review Imported Users</DialogTitle>
                    <DialogDescription>
                        We successfully extracted{' '}
                        <strong>{initialUsers.length}</strong> users from your
                        file. Review the list below and remove any users you
                        don't want to invite.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Search and Stats */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Badge variant="secondary" className="h-9 px-3 text-sm">
                            {users.length} Users
                        </Badge>
                    </div>

                    {/* Virtualized List */}
                    <div
                        ref={setParentRef}
                        className="h-[400px] w-full overflow-auto rounded-md border"
                    >
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {filteredUsers.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                    <Search className="mb-2 h-8 w-8 opacity-50" />
                                    <p>No users found matching your search.</p>
                                </div>
                            ) : (
                                rowVirtualizer
                                    .getVirtualItems()
                                    .map((virtualRow) => {
                                        const user =
                                            filteredUsers[virtualRow.index];
                                        return (
                                            <div
                                                key={user.id}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${virtualRow.size}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                                className="flex items-center justify-between border-b p-3 hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        <UserIcon className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {user.name ||
                                                                'Unknown Name'}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeUser(user.id)
                                                    }
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Remove
                                                    </span>
                                                </Button>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>

                    {users.length === 0 && (
                        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            You have removed all users. The invite list is
                            empty.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={users.length === 0}
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm & Add {users.length} Users
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
