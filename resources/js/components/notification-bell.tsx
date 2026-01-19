import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Notification, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import {
    AlarmClock,
    BarChart3,
    Bell,
    CheckCheck,
    Clock,
    Info,
    UserCheck,
    UserPlus,
    Vote,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    vote: Vote,
    'user-check': UserCheck,
    clock: Clock,
    'alarm-clock': AlarmClock,
    'bar-chart': BarChart3,
    'x-circle': XCircle,
    info: Info,
    'user-plus': UserPlus,
    bell: Bell,
};

const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    emerald:
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

function NotificationItem({
    notification,
    onMarkAsRead,
}: NotificationItemProps) {
    const IconComponent = iconMap[notification.icon] || Bell;
    const colorClasses = colorMap[notification.color] || colorMap.slate;

    const handleClick = () => {
        onMarkAsRead(notification.id);
        if (notification.action_url) {
            router.visit(notification.action_url);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
                'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                !notification.read_at && 'bg-blue-50/50 dark:bg-blue-950/20',
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    colorClasses,
                )}
            >
                <IconComponent className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {notification.title}
                    </p>
                    {!notification.read_at && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {notification.message}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                    {notification.created_at}
                </p>
            </div>
        </button>
    );
}

export function NotificationBell() {
    const { notifications } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const items = notifications?.items ?? [];
    const unreadCount = notifications?.unread_count ?? 0;

    const handleMarkAsRead = async (id: string) => {
        try {
            await fetch(`/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content ?? '',
                },
            });
            router.reload({ only: ['notifications'] });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsMarkingAll(true);
        try {
            await fetch('/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content ?? '',
                },
            });
            router.reload({ only: ['notifications'] });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setIsMarkingAll(false);
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="group relative h-9 w-9 cursor-pointer"
                >
                    <Bell className="!size-5 opacity-80 group-hover:opacity-100" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-96 p-0"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        Notifications
                    </h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={isMarkingAll}
                            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <ScrollArea className="max-h-[400px]">
                    {items.length > 0 ? (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {items.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={handleMarkAsRead}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                                <Bell className="h-8 w-8 text-neutral-400" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                No notifications yet
                            </p>
                            <p className="mt-1 text-sm text-neutral-500">
                                You're all caught up!
                            </p>
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-neutral-200 px-4 py-2 dark:border-neutral-700">
                        <button
                            onClick={() => {
                                setOpen(false);
                                router.visit('/notifications');
                            }}
                            className="w-full py-1.5 text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            View all notifications
                        </button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
