import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { FloatingProgressWidget } from '@/components/FloatingProgressWidget';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    scrollable?: boolean;
}

export default ({ children, breadcrumbs, scrollable, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} scrollable={scrollable} {...props}>
        {children}
        <FloatingProgressWidget />
    </AppLayoutTemplate>
);
