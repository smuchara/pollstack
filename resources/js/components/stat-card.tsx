import { Link } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    description: string;
    href?: string;
    colorClass: string;
    bgClass: string;
}

export function StatCard({ title, value, icon: Icon, description, href, colorClass, bgClass }: StatCardProps) {
    const Content = () => (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-foreground">
                        {value}
                    </p>
                </div>
                <div className={`rounded-xl p-3 ${bgClass} ${colorClass}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
                {description}
            </div>
        </>
    );

    const baseClasses = "group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md";
    const hoverClasses = href ? "hover:border-primary/50 cursor-pointer" : "hover:border-border/80";

    if (href) {
        return (
            <Link href={href} className={`${baseClasses} ${hoverClasses}`}>
                <Content />
            </Link>
        );
    }

    return (
        <div className={`${baseClasses} ${hoverClasses}`}>
            <Content />
        </div>
    );
}
