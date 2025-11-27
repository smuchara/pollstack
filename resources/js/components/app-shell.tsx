import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;
    
    // Handle flash message toasts
    useToastNotifications();

    if (variant === 'header') {
        return (
            <>
                <div className="flex min-h-screen w-full flex-col">{children}</div>
                <Toaster />
            </>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen}>
            {children}
            <Toaster />
        </SidebarProvider>
    );
}
