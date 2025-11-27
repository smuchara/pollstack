import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users } from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    
    // Determine the correct dashboard URL based on user role
    const dashboardUrl = useMemo(() => {
        if (user?.is_super_admin) {
            return '/super-admin/dashboard';
        }
        if (user?.is_admin) {
            return '/admin/dashboard';
        }
        return dashboard().url;
    }, [user]);
    
    // Build navigation items based on user role
    const mainNavItems: NavItem[] = useMemo(() => {
        const items: NavItem[] = [
            {
                title: 'Dashboard',
                href: dashboardUrl,
                icon: LayoutGrid,
            },
        ];
        
        // Add User Management for admins and super admins
        if (user?.is_admin || user?.is_super_admin) {
            items.push({
                title: 'User Management',
                href: '/admin/users',
                icon: Users,
            });
        }
        
        return items;
    }, [user, dashboardUrl]);
    
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
