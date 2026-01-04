import { Link } from '@inertiajs/react';
import { cn, isSameUrl } from '@/lib/utils';
import { NavItem } from '@/types';

interface NavGroup {
    title?: string;
    items: NavItem[];
}

interface SecondarySidebarProps {
    groups: NavGroup[];
    className?: string;
}

export function SecondarySidebar({ groups, className }: SecondarySidebarProps) {
    const currentPath = window.location.pathname;

    return (
        <aside className={cn("w-full md:w-64 space-y-8", className)}>
            {groups.map((group, groupIndex) => (
                <div key={groupIndex} className="px-3 py-2">
                    {group.title && (
                        <h4 className="mb-2 px-4 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            {group.title}
                        </h4>
                    )}
                    <nav className="space-y-1">
                        {group.items.map((item, itemIndex) => {
                            // Check if current path starts with item href (simple active check)
                            // or exact match depending on requirement.
                            // For "Apps" (appearance) and "Account" (profile), exact or prefix match.
                            const isActive = isSameUrl(currentPath, item.href);

                            return (
                                <Link
                                    key={itemIndex}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-secondary text-secondary-foreground"
                                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                    )}
                                >
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            ))}
        </aside>
    );
}
