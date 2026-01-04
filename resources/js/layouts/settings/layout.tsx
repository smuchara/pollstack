import Heading from '@/components/heading';
import { cn, isSameUrl, resolveUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const tabNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Password',
        href: editPassword(),
        icon: null,
    },
    {
        title: 'Two-Factor Auth',
        href: show(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            {/* Horizontal Tab Navigation */}
            <nav className="mb-6 border-b border-border">
                <div className="flex space-x-1 overflow-x-auto">
                    {tabNavItems.map((item, index) => {
                        const isActive = isSameUrl(currentPath, item.href);
                        return (
                            <Link
                                key={`${resolveUrl(item.href)}-${index}`}
                                href={item.href}
                                className={cn(
                                    'relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                                    'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                    isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {item.title}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Content Area */}
            <div className="max-w-2xl">
                <section className="space-y-8">
                    {children}
                </section>
            </div>
        </div>
    );
}

