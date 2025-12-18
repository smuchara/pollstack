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
import { type NavItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { BarChart3, BookOpen, Folder, LayoutGrid, UserPlus, Users } from 'lucide-react';
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
    const { auth, organization_slug } = usePage<SharedData & { organization_slug?: string }>().props;
    const user = auth?.user;

    // Build base URL for tenant context  
    const tenantBaseUrl = organization_slug
        ? `/organization/${organization_slug}/admin`
        : '/admin';

    // Determine the correct dashboard URL based on user role
    const dashboardUrl = useMemo(() => {
        if (user?.is_super_admin) {
            return '/super-admin/dashboard';
        }
        if (user?.is_admin && organization_slug) {
            return `${tenantBaseUrl}/dashboard`;
        }
        if (user?.is_admin) {
            return '/admin/dashboard';
        }
        return dashboard().url;
    }, [user, organization_slug, tenantBaseUrl]);

    // Build navigation items based on user role
    const mainNavItems: NavItem[] = useMemo(() => {
        const items: NavItem[] = [
            {
                title: 'Dashboard',
                href: dashboardUrl,
                icon: LayoutGrid,
            },
        ];

        // Add User Management for admins (tenant-aware) and super admins
        if (user?.is_admin && !user?.is_super_admin) {
            items.push({
                title: 'User Management',
                href: `${tenantBaseUrl}/users`,
                icon: Users,
            });
        }

        // Super admin items (global, not tenant-specific)
        if (user?.is_super_admin) {
            items.push({
                title: 'User Management',
                href: '/super-admin/users',
                icon: Users,
            });
            items.push({
                title: 'Polls',
                href: '/super-admin/polls',
                icon: BarChart3,
            });
            items.push({
                title: 'Onboarding',
                href: '/super-admin/onboarding',
                icon: UserPlus,
            });
            items.push({
                title: 'System Configuration',
                href: '/super-admin/permission-groups', // Temporary link until config page exists
                icon: Users, // Using Users/Settings icon
            });
        }

        // Client Admin items
        if (user?.is_admin && !user?.is_super_admin) {
            items.push({
                title: 'System Configuration',
                href: `${tenantBaseUrl}/permission-groups`,
                icon: Users,
            });
        }

        return items;
    }, [user, dashboardUrl, tenantBaseUrl]);

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
