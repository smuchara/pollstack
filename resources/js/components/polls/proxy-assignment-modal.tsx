import { useState, useMemo } from 'react';
import { Search, User as UserIcon, Shield, ArrowRight } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ProxyUser {
    id: number | string; // ID or Email/TempID for new users
    name: string;
    email: string;
    type: 'existing' | 'new';
}

interface ProxyAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableUsers: ProxyUser[];
    onAssign: (principal: ProxyUser, proxy: ProxyUser) => void;
}

export function ProxyAssignmentModal({
    isOpen,
    onClose,
    availableUsers,
    onAssign,
}: ProxyAssignmentModalProps) {
    const [selectedPrincipal, setSelectedPrincipal] = useState<ProxyUser | null>(null);
    const [selectedProxy, setSelectedProxy] = useState<ProxyUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return availableUsers;
        const lower = searchQuery.toLowerCase();
        return availableUsers.filter(
            (u) =>
                u.name.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower)
        );
    }, [availableUsers, searchQuery]);

    const handleAssign = () => {
        if (selectedPrincipal && selectedProxy) {
            onAssign(selectedPrincipal, selectedProxy);
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedPrincipal(null);
        setSelectedProxy(null);
        setSearchQuery('');
        onClose();
    };

    const renderUserList = (
        users: ProxyUser[],
        onSelect: (u: ProxyUser) => void,
        selectedId: string | number | undefined,
        excludeId?: string | number
    ) => (
        <ScrollArea className="h-[200px] rounded-md border p-2">
            <div className="space-y-1">
                {users
                    .filter((u) => u.id !== excludeId)
                    .map((user) => (
                    <div
                        key={user.id}
                        className={cn(
                            "flex cursor-pointer items-center justify-between rounded-md p-2 text-sm hover:bg-muted",
                            selectedId === user.id && "bg-primary/10 text-primary hover:bg-primary/15"
                        )}
                        onClick={() => onSelect(user)}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted",
                                selectedId === user.id && "bg-primary/20"
                            )}>
                                <UserIcon className="h-3 w-3" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-medium">{user.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        {selectedId === user.id && <Shield className="h-4 w-4" />}
                    </div>
                ))}
                {users.length === 0 && (
                     <div className="py-4 text-center text-xs text-muted-foreground">
                        No users found
                    </div>
                )}
            </div>
        </ScrollArea>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Assign Proxy Voter</DialogTitle>
                    <DialogDescription>
                        Select a user who cannot vote (Principal) and designate someone to vote on their behalf (Proxy).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
                    {/* Principal Selection */}
                    <div className="space-y-3">
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">1. Select Principal (Original Voter)</h4>
                            {selectedPrincipal ? (
                                <div className="flex items-center justify-between bg-background p-2 rounded border">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{selectedPrincipal.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedPrincipal.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedPrincipal(null)}>Change</Button>
                                </div>
                            ) : (
                                <div className="h-14 flex items-center justify-center border-dashed border rounded text-xs text-muted-foreground">
                                    No user selected
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Proxy Selection */}
                    <div className="space-y-3">
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">2. Select Proxy (Designated Voter)</h4>
                            {selectedProxy ? (
                                <div className="flex items-center justify-between bg-background p-2 rounded border">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{selectedProxy.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedProxy.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedProxy(null)}>Change</Button>
                                </div>
                            ) : (
                                <div className="h-14 flex items-center justify-center border-dashed border rounded text-xs text-muted-foreground">
                                    No proxy selected
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Search and Selection Area */}
                <div className="space-y-3 border-t pt-4">
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users to select..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <p className="text-xs font-semibold text-muted-foreground">Available Principals</p>
                             {renderUserList(filteredUsers, setSelectedPrincipal, selectedPrincipal?.id, selectedProxy?.id)}
                        </div>
                        <div className="space-y-2">
                             <p className="text-xs font-semibold text-muted-foreground">Available Proxies</p>
                             {renderUserList(filteredUsers, setSelectedProxy, selectedProxy?.id, selectedPrincipal?.id)}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAssign} 
                        disabled={!selectedPrincipal || !selectedProxy}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Shield className="mr-2 h-4 w-4" />
                        Assign Proxy
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
