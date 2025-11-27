import { Link } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

interface ActionCardProps {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    iconColor?: string;
}

export function ActionCard({
                               title,
                               description,
                               href,
                               icon: Icon,
                               iconColor = "text-foreground"
                           }: ActionCardProps) {
    return (
        <Link
            href={href}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50"
        >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
                <Icon className={`h-5 w-5 ${iconColor} transition-colors group-hover:text-primary`} />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary">
                {title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {description}
            </p>
        </Link>
    );
}
