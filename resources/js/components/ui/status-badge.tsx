import { CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
    verified: boolean;
    date?: string;
    status?: 'verified' | 'pending' | 'invited';
}

export function StatusBadge({ verified, date, status }: StatusBadgeProps) { // Wait, typo in ]
    // Normalize status
    const currentStatus = status || (verified ? 'verified' : 'pending');

    if (currentStatus === 'verified') {
        return (
            <div
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                title={date ? `Verified on ${new Date(date).toLocaleDateString()}` : 'Email Verified'}
            >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verified</span>
            </div>
        );
    }

    if (currentStatus === 'invited') {
        return (
            <div
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                title="Invitation sent, awaiting acceptance"
            >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Invite Sent</span>
            </div>
        );
    }

    return (
        <div
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            title="Email verification pending"
        >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Pending</span>
        </div>
    );
}
