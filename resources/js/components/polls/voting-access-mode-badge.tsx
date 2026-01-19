import { Globe, Laptop, MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type VotingAccessMode = 'remote_only' | 'on_premise_only' | 'hybrid';

interface VotingAccessModeBadgeProps {
    mode: VotingAccessMode;
    showTooltip?: boolean;
    className?: string;
}

const modeConfig: Record<VotingAccessMode, {
    label: string;
    shortLabel: string;
    description: string;
    icon: typeof Globe;
    className: string;
}> = {
    remote_only: {
        label: 'Remote Only',
        shortLabel: 'Remote',
        description: 'Vote from anywhere without verification',
        icon: Laptop,
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    },
    on_premise_only: {
        label: 'On-Premise Only',
        shortLabel: 'On-Site',
        description: 'QR code verification required at venue',
        icon: MapPin,
        className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    },
    hybrid: {
        label: 'Hybrid',
        shortLabel: 'Hybrid',
        description: 'Vote remotely or verify on-premise',
        icon: Globe,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    },
};

/**
 * VotingAccessModeBadge - Displays the voting access mode of a poll.
 */
export function VotingAccessModeBadge({
    mode,
    showTooltip = true,
    className = '',
}: VotingAccessModeBadgeProps) {
    const config = modeConfig[mode] || modeConfig.hybrid;
    const Icon = config.icon;

    const badge = (
        <Badge
            variant="outline"
            className={`gap-1 text-[10px] font-medium ${config.className} ${className}`}
        >
            <Icon className="h-3 w-3" />
            {config.shortLabel}
        </Badge>
    );

    if (!showTooltip) {
        return badge;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {badge}
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export default VotingAccessModeBadge;
