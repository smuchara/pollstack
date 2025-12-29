import { Lock, Globe } from 'lucide-react';

interface PollTypeBadgeProps {
    type: 'open' | 'closed';
    showLabel?: boolean;
}

export default function PollTypeBadge({ type, showLabel = false }: PollTypeBadgeProps) {
    return (
        <div className="flex items-center gap-1">
            {type === 'closed' ? (
                <>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    {showLabel && <span className="text-xs text-muted-foreground">Closed</span>}
                </>
            ) : (
                <>
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    {showLabel && <span className="text-xs text-muted-foreground">Open</span>}
                </>
            )}
        </div>
    );
}
