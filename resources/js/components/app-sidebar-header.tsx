import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NavUser } from '@/components/nav-user';
import { Search, Bell } from 'lucide-react';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-transparent bg-background/95 backdrop-blur px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="hidden items-center gap-2 md:flex">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-64 rounded-xl bg-background pl-8 shadow-none focus-visible:ring-1"
                    />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Bell className="h-4 w-4" />
                </Button>
                <div className="h-8 w-px bg-border/50 mx-2" />
                <NavUser />
            </div>
        </header>
    );
}
