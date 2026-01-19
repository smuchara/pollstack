import { Breadcrumbs } from '@/components/breadcrumbs';
import { NavUser } from '@/components/nav-user';
import { NotificationBell } from '@/components/notification-bell';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Search } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-transparent bg-background/95 px-6 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="hidden items-center gap-2 md:flex">
                <div className="relative">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-64 rounded-xl bg-background pl-8 shadow-none focus-visible:ring-1"
                    />
                </div>
                <NotificationBell />
                <div className="mx-2 h-8 w-px bg-border/50" />
                <NavUser />
            </div>
        </header>
    );
}
