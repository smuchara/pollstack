import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Users } from 'lucide-react';

interface PollVisibilityBadgeProps {
    visibility: 'public' | 'invite_only';
    invitedCount?: number;
}

export default function PollVisibilityBadge({ visibility, invitedCount }: PollVisibilityBadgeProps) {
    if (visibility === 'invite_only') {
        return (
            <Badge variant="outline" className="gap-1 text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
                <EyeOff className="h-3 w-3" />
                Invite Only
                {invitedCount !== undefined && invitedCount > 0 && (
                    <span className="ml-1 flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {invitedCount}
                    </span>
                )}
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="gap-1 text-xs border-green-500/50 text-green-600 dark:text-green-400">
            <Eye className="h-3 w-3" />
            Public
        </Badge>
    );
}
