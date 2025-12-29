import { CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PollStatusBadgeProps {
    status: 'scheduled' | 'active' | 'ended' | 'archived';
    userHasVoted?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function PollStatusBadge({ status, userHasVoted = false, size = 'md' }: PollStatusBadgeProps) {
    const getStatusConfig = () => {
        if (status === 'scheduled') {
            return {
                label: 'Scheduled',
                icon: Clock,
                className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            };
        }
        if (status === 'ended') {
            return {
                label: 'Poll Ended',
                icon: null,
                className: 'bg-gray-500/15 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
            };
        }
        if (userHasVoted && status === 'active') {
            return {
                label: 'Voted',
                icon: CheckCircle2,
                className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            };
        }
        return {
            label: 'Active',
            icon: null,
            className: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        };
    };

    const config = getStatusConfig();
    const Icon = config.icon;
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';

    return (
        <Badge variant="outline" className={`capitalize border ${config.className}`}>
            {Icon && <Icon className={`${iconSize} mr-1`} />}
            {config.label}
        </Badge>
    );
}
