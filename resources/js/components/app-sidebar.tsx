import { NavMain } from '@/components/nav-main';
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
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { BarChart3, LayoutGrid, Settings, UserPlus, Users } from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from './app-logo';



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

    // Build navigation groups based on user role
    const navGroups = useMemo(() => {
        const groups: NavGroup[] = [];

        // General group - always present
        groups.push({
            title: 'General',
            items: [
                {
                    title: 'Dashboard',
                    href: dashboardUrl,
                    icon: LayoutGrid,
                },
            ],
        });

        // Polls group
        const pollItems: NavItem[] = [];
        if (user?.is_admin && !user?.is_super_admin && organization_slug) {
            pollItems.push({
                title: 'Poll Voting',
                href: `${tenantBaseUrl}/polls-voting`,
                icon: BarChart3,
            });
            pollItems.push({
                title: 'Poll Management',
                href: `${tenantBaseUrl}/polls-management`,
                icon: BarChart3,
            });
        } else if (user?.is_super_admin) {
            pollItems.push({
                title: 'Poll Voting',
                href: '/polls',
                icon: BarChart3,
            });
            pollItems.push({
                title: 'Poll Management',
                href: '/super-admin/polls',
                icon: BarChart3,
            });
        } else {
            pollItems.push({
                title: 'Polls',
                href: '/polls',
                icon: BarChart3,
            });
        }
        if (pollItems.length > 0) {
            groups.push({
                title: 'Polls',
                items: pollItems,
            });
        }

        // Users group
        const userItems: NavItem[] = [];
        if (user?.is_admin && !user?.is_super_admin) {
            userItems.push({
                title: 'User Management',
                href: `${tenantBaseUrl}/users`,
                icon: Users,
            });
        }
        if (user?.is_super_admin) {
            userItems.push({
                title: 'User Management',
                href: '/super-admin/users',
                icon: Users,
            });
            userItems.push({
                title: 'Onboarding',
                href: '/super-admin/onboarding',
                icon: UserPlus,
            });
        }
        if (userItems.length > 0) {
            groups.push({
                title: 'Users',
                items: userItems,
            });
        }

        // Administration group
        const adminItems: NavItem[] = [];
        if (user?.is_super_admin) {
            adminItems.push({
                title: 'System Configuration',
                href: '/super-admin/permission-groups',
                icon: Settings,
            });
        }
        if (user?.is_admin && !user?.is_super_admin) {
            adminItems.push({
                title: 'System Configuration',
                href: `${tenantBaseUrl}/permission-groups`,
                icon: Settings,
            });
        }
        if (adminItems.length > 0) {
            groups.push({
                title: 'Administration',
                items: adminItems,
            });
        }

        return groups;
    }, [user, dashboardUrl, tenantBaseUrl, organization_slug]);

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
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter />
        </Sidebar>
    );
}
