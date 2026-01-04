import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    scrollable = true,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[]; scrollable?: boolean }>) {
    return (
        <AppShell variant="sidebar" className="h-svh overflow-hidden">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="h-full min-h-0 overflow-hidden flex flex-col"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div
                    className={`flex-1 overflow-x-hidden ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'
                        }`}
                >
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
