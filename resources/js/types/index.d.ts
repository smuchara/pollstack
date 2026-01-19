import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface FlashMessages {
    success?: string;
    error?: string;
    info?: string;
    warning?: string;
}

export type NotificationType =
    | 'poll_invitation'
    | 'proxy_voter_assigned'
    | 'poll_starting_soon'
    | 'poll_ending_soon'
    | 'poll_results'
    | 'invitation_failed'
    | 'system_update'
    | 'user_registered';

export interface Notification {
    id: string;
    type: NotificationType;
    icon: string;
    color: string;
    title: string;
    message: string;
    action_url?: string | null;
    action_text?: string | null;
    read_at: string | null;
    created_at: string;
}

export interface NotificationsData {
    items: Notification[];
    unread_count: number;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    flash?: FlashMessages;
    notifications?: NotificationsData | null;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    profile_photo_url?: string;
    profile_photo_path?: string;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

