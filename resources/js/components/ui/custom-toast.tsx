import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Toast } from 'react-hot-toast';

interface CustomToastProps {
    t: Toast;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onDismiss: () => void;
}

export function CustomToast({ t, message, type, onDismiss }: CustomToastProps) {
    const variants = {
        success: {
            icon: CheckCircle2,
            primary: 'text-emerald-500 dark:text-emerald-400',
            secondary: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            border: 'border-emerald-500/20',
            glow: 'shadow-emerald-500/5'
        },
        error: {
            icon: XCircle,
            primary: 'text-red-500 dark:text-red-400',
            secondary: 'bg-red-500/10 dark:bg-red-500/20',
            border: 'border-red-500/20',
            glow: 'shadow-red-500/5'
        },
        info: {
            icon: Info,
            primary: 'text-blue-500 dark:text-blue-400',
            secondary: 'bg-blue-500/10 dark:bg-blue-500/20',
            border: 'border-blue-500/20',
            glow: 'shadow-blue-500/5'
        },
        warning: {
            icon: AlertTriangle,
            primary: 'text-amber-500 dark:text-amber-400',
            secondary: 'bg-amber-500/10 dark:bg-amber-500/20',
            border: 'border-amber-500/20',
            glow: 'shadow-amber-500/5'
        },
    };

    const style = variants[type];
    const Icon = style.icon;

    return (
        <div
            className={`
                ${t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out slide-out-to-top-2'}
                relative flex w-full max-w-sm overflow-hidden rounded-xl border border-border
                bg-card/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300
                ${style.glow}
            `}
        >
            {/* Subtle Gradient background hint */}
            <div className={`pointer-events-none absolute inset-0 opacity-[0.03] ${style.primary.replace('text-', 'bg-')}`} />

            <div className="flex w-full items-start gap-3">
                {/* Icon Wrapper */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.secondary} ${style.primary} ring-1 ring-inset ${style.border}`}>
                    <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-foreground">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDismiss();
                    }}
                    className="group -mr-2 -mt-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="h-4 w-4 transition-transform group-hover:scale-110" />
                </button>
            </div>
        </div>
    );
}
