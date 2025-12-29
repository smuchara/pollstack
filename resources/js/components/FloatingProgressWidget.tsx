import { useBulkInviteProgress } from '@/hooks/use-bulk-invite-progress';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function FloatingProgressWidget() {
    const { progress, isVisible, dismiss } = useBulkInviteProgress();
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isVisible || !progress) return null;

    const percentage = progress.total > 0
        ? Math.round((progress.processed / progress.total) * 100)
        : 0;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-xl shadow-black/10 transition-all duration-300 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {progress.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    <h4 className="text-sm font-semibold">
                        {progress.status === 'completed' ? 'Import Complete' : 'Bulk Invites Processing'}
                    </h4>
                </div>
                <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.processed} of {progress.total} invites sent</span>
                    <span>{percentage}%</span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {progress.status === 'completed' && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                        All invitations have been queued successfully.
                    </p>
                )}
            </div>
        </div>
    );
}
