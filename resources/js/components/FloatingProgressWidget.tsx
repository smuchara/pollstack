import { useBulkInviteProgress } from '@/hooks/use-bulk-invite-progress';
import { X, Loader2, CheckCircle, ChevronDown, ChevronUp, Mail, Send } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export function FloatingProgressWidget() {
    const { progress, isVisible, dismiss } = useBulkInviteProgress();
    const [isMinimized, setIsMinimized] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isPulsing, setIsPulsing] = useState(false);
    const prevProcessedRef = useRef<number>(0);

    // Pulse animation when progress updates
    useEffect(() => {
        if (progress && progress.processed > prevProcessedRef.current) {
            setTimeout(() => setIsPulsing(true), 0);
            const timer = setTimeout(() => setIsPulsing(false), 300);
            prevProcessedRef.current = progress.processed;
            return () => clearTimeout(timer);
        }
    }, [progress?.processed]);

    // Countdown timer when completed
    useEffect(() => {
        if (progress?.status === 'completed') {
            setTimeout(() => setCountdown(5), 0);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setTimeout(() => setCountdown(null), 0);
        }
    }, [progress?.status]);

    // Reset when widget becomes invisible
    useEffect(() => {
        if (!isVisible) {
            prevProcessedRef.current = 0;
        }
    }, [isVisible]);

    if (!isVisible || !progress) return null;

    const sent = progress.sent ?? progress.processed;
    const total = progress.total;
    const percentage = total > 0 ? Math.round((sent / total) * 100) : 0;

    const isCompleted = progress.status === 'completed';
    const isSending = progress.status === 'sending';

    const getTitle = () => {
        if (isCompleted) return 'All Emails Sent!';
        if (isSending) return 'Sending Emails...';
        return 'Preparing Invites...';
    };

    const getProgressLabel = () => {
        if (progress.status === 'processing' && sent === 0) {
            return 'Queuing invitations...';
        }
        return `${sent} of ${total} emails sent`;
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 overflow-hidden rounded-xl border bg-card shadow-2xl shadow-black/20 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${isMinimized ? 'w-auto' : 'w-80'
                } ${isPulsing ? 'ring-2 ring-primary/50' : ''}`}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between px-4 py-3 ${isCompleted
                    ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-500/20'
                    : 'bg-gradient-to-r from-primary/10 to-blue-500/10 border-b border-primary/20'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isCompleted
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-primary/20 text-primary'
                        }`}>
                        {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : isSending ? (
                            <Send className="h-4 w-4 animate-pulse" />
                        ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">{getTitle()}</span>
                        {isMinimized && (
                            <span className="text-xs text-muted-foreground">{sent}/{total}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={dismiss}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <div className="p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{getProgressLabel()}</span>
                        </div>
                        <span className={`text-sm font-bold ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                            {percentage}%
                        </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
                        <div
                            className={`h-full transition-all duration-500 ease-out rounded-full ${isCompleted
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-primary to-blue-500'
                                }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {isCompleted ? (
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                ✓ All invitation emails sent
                            </p>
                            {countdown !== null && (
                                <span className="text-xs text-muted-foreground">Closing in {countdown}s</span>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground pt-1">
                            {isSending ? 'Sending in background. You can continue working...' : 'Please wait...'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

