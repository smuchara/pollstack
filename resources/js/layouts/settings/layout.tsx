import Heading from '@/components/heading';
import { SecondarySidebar } from '@/components/secondary-sidebar';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { type NavItem } from '@/types';
import { Bell, CreditCard, Globe, Settings2, User, Users, Wrench } from 'lucide-react';
import { type PropsWithChildren } from 'react';

const generalItems: NavItem[] = [
    {
        title: 'Apps',
        href: editAppearance(),
        icon: Wrench,
    },
    {
        title: 'Account',
        href: edit(),
        icon: User,
    },
    {
        title: 'Notification',
        href: '#',
        icon: Bell,
    },
    {
        title: 'Language & Region',
        href: '#',
        icon: Globe,
    },
];

const workspaceItems: NavItem[] = [
    {
        title: 'General',
        href: '#',
        icon: Settings2,
    },
    {
        title: 'Members',
        href: '#',
        icon: Users,
    },
    {
        title: 'Billing',
        href: '#',
        icon: CreditCard,
    },
];

const navGroups = [
    {
        title: 'General Settings',
        items: generalItems,
    },
    {
        title: 'Workspace Settings',
        items: workspaceItems,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex flex-col md:flex-row h-full min-h-0">
            <div className="hidden md:block shrink-0 overflow-y-auto py-6 pl-6 md:py-8 md:pl-8">
                <SecondarySidebar groups={navGroups} />
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="w-full max-w-3xl">
                    <div className="space-y-6">
                        <Heading
                            title="Account Settings"
                            description="Manage your profile and account settings"
                        />
                        <div className="border-t border-border pt-6">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

