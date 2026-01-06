import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
    className?: string; // Add className prop
}

export function AppShell({ children, variant = 'header', className }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;

    // Handle flash message toasts
    useToastNotifications();

    if (variant === 'header') {
        return (
            <>
                <div className={cn("flex min-h-screen w-full flex-col", className)}>{children}</div>
                <Toaster />
            </>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen} className={className}>
            {children}
            <Toaster />
        </SidebarProvider>
    );
}
