import { Shield, ShieldAlert, User } from 'lucide-react';

interface RoleBadgeProps {
    role: string;
}

const roleConfig: Record<string, {
    styles: string;
    icon: typeof Shield
}> = {
    super_admin: {
        styles: "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-800/50",
        icon: ShieldAlert
    },
    admin: {
        styles: "bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-800/50",
        icon: Shield
    },
    user: {
        styles: "bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-800/50",
        icon: User
    },
    // Fallback for unknown roles
    default: {
        styles: "bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-700",
        icon: User
    }
};

export function RoleBadge({ role }: RoleBadgeProps) {
    const config = roleConfig[role] || roleConfig.default;
    const Icon = config.icon;

    // Format text: "super_admin" -> "Super Admin"
    const label = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.styles}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}
