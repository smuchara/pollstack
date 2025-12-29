import { Clock, Users } from 'lucide-react';
import { formatLocalDate, formatLocalTimeOnly, calculateDuration } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';

interface PollTimingProps {
    startAt: string | null;
    endAt: string | null;
    showDuration?: boolean;
    compact?: boolean;
    organization?: {
        id: number;
        name: string;
    } | null;
}

export default function PollTiming({ startAt, endAt, showDuration = true, compact = false, organization }: PollTimingProps) {
    return (
        <div className={`space-y-2 border-t pt-3 ${compact ? 'mt-2' : 'mt-3'}`}>
            {/* Duration Badge */}
            {showDuration && startAt && endAt && (
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Duration:</span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        {calculateDuration(startAt, endAt)}
                    </div>
                </div>
            )}

            {/* Start Time */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Starts:</span>
                <span className="font-medium">
                    {startAt ? (
                        <>
                            {formatLocalDate(startAt)}{' '}
                            <span className="text-muted-foreground">at</span>{' '}
                            {formatLocalTimeOnly(startAt)}
                        </>
                    ) : (
                        'Not set'
                    )}
                </span>
            </div>

            {/* End Time */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Ends:</span>
                <span className="font-medium">
                    {endAt ? (
                        <>
                            {formatLocalDate(endAt)}{' '}
                            <span className="text-muted-foreground">at</span>{' '}
                            {formatLocalTimeOnly(endAt)}
                        </>
                    ) : (
                        'Not set'
                    )}
                </span>
            </div>

            {/* Organization */}
            {organization && (
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <span className="text-muted-foreground">Organization:</span>
                    <Badge variant="secondary" className="text-[10px] h-5">
                        <Users className="h-3 w-3 mr-1" />
                        {organization.name}
                    </Badge>
                </div>
            )}
        </div>
    );
}
