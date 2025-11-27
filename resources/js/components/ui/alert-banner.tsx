import { AlertTriangle, Info, CheckCircle, XCircle, LucideIcon } from 'lucide-react';

type AlertVariant = 'warning' | 'info' | 'success' | 'destructive';

interface AlertBannerProps {
    title: string;
    children: React.ReactNode;
    variant?: AlertVariant;
}

const variants: Record<AlertVariant, {
    container: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    textColor: string;
    icon: LucideIcon;
}> = {
    warning: {
        container: "border-orange-500/20 bg-orange-500/5 dark:border-orange-500/30 dark:bg-orange-500/10",
        iconBg: "bg-orange-100 dark:bg-orange-900/30",
        iconColor: "text-orange-600 dark:text-orange-400",
        titleColor: "text-orange-800 dark:text-orange-200",
        textColor: "text-orange-700/80 dark:text-orange-300/70",
        icon: AlertTriangle
    },
    info: {
        container: "border-blue-500/20 bg-blue-500/5",
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        titleColor: "text-blue-800 dark:text-blue-200",
        textColor: "text-blue-700/80 dark:text-blue-300/70",
        icon: Info
    },
    success: {
        container: "border-emerald-500/20 bg-emerald-500/5",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        titleColor: "text-emerald-800 dark:text-emerald-200",
        textColor: "text-emerald-700/80 dark:text-emerald-300/70",
        icon: CheckCircle
    },
    destructive: {
        container: "border-red-500/20 bg-red-500/5",
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        titleColor: "text-red-800 dark:text-red-200",
        textColor: "text-red-700/80 dark:text-red-300/70",
        icon: XCircle
    }
};

export function AlertBanner({ title, children, variant = 'warning' }: AlertBannerProps) {
    const style = variants[variant];
    const Icon = style.icon;

    return (
        <div className={`relative overflow-hidden rounded-xl border px-4 py-4 ${style.container}`}>
            <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.iconColor}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h3 className={`text-sm font-semibold ${style.titleColor}`}>
                        {title}
                    </h3>
                    <div className={`mt-1 text-sm ${style.textColor}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
