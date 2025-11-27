import { Head } from '@inertiajs/react';
import { useRole } from '@/components/role-guard';
import AppLayout from '@/layouts/app-layout';
import { StatCard } from '@/components/stat-card';
import { AlertBanner } from '@/components/ui/alert-banner';
import { type BreadcrumbItem } from '@/types';
import {
    Users, UserCheck, Shield, TrendingUp,
    Settings, FileText, Database, Wrench, Lock,
    Activity, Trash2, Server
} from 'lucide-react';
import { ActionCard } from '@/components/action-card';

interface Props {
    stats: {
        total: number;
        total_verified: number;
        total_super_admins: number;
        total_admins: number;
        recent_signups: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/super-admin/dashboard' },
];

export default function SuperAdminDashboard({ stats }: Props) {
    const { user } = useRole();

    // Configuration for Action Grid to avoid repetitive JSX
    const managementActions = [
        { href: '/super-admin/config', icon: Settings, title: 'Configuration', desc: 'Global environment variables', color: 'text-gray-500' },
        { href: '/super-admin/roles', icon: Users, title: 'Role Management', desc: 'RBAC permissions structure', color: 'text-blue-500' },
        { href: '/super-admin/logs', icon: FileText, title: 'System Logs', desc: 'Audit trails & error reporting', color: 'text-amber-500' },
        { href: '/super-admin/backup', icon: Database, title: 'Backup & Restore', desc: 'Snapshot management', color: 'text-emerald-500' },
        { href: '/super-admin/maintenance', icon: Wrench, title: 'Maintenance', desc: 'System availability toggle', color: 'text-indigo-500' },
        { href: '/super-admin/security', icon: Lock, title: 'Security Policy', desc: 'Firewall & session rules', color: 'text-rose-500' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Super Admin Dashboard" />

            <div className="relative min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                {/* Decorative Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[100px]" />
                    <div className="absolute top-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-destructive/5 blur-[80px]" />
                </div>

                <div className="relative mx-auto max-w-7xl space-y-8">

                    {/* Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Super Admin Control
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                System oversight for <span className="font-medium text-foreground">{user?.name}</span>
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            System Operational
                        </div>
                    </div>

                    {/* Warning Banner */}
                    <AlertBanner title="Elevated Privileges Active" variant="warning">
                        You have root-level access to the system. Modifications made here may be irreversible and affect all tenants.
                    </AlertBanner>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Users"
                            value={stats.total}
                            icon={Users}
                            description="Live accounts database"
                            href="/admin/users"
                            bgClass="bg-blue-500/10"
                            colorClass="text-blue-600 dark:text-blue-400"
                        />
                        <StatCard
                            title="Verified"
                            value={stats.total_verified}
                            icon={UserCheck}
                            description="Identity confirmed users"
                            bgClass="bg-emerald-500/10"
                            colorClass="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            title="Admins"
                            value={stats.total_admins + stats.total_super_admins}
                            icon={Shield}
                            description="Total privileged accounts"
                            bgClass="bg-purple-500/10"
                            colorClass="text-purple-600 dark:text-purple-400"
                        />
                        <StatCard
                            title="Growth"
                            value={`+${stats.recent_signups}`}
                            icon={TrendingUp}
                            description="New users in last 7 days"
                            bgClass="bg-orange-500/10"
                            colorClass="text-orange-600 dark:text-orange-400"
                        />
                    </div>

                    {/* Management Actions */}
                    <div>
                        <h2 className="mb-5 text-lg font-semibold tracking-tight text-foreground">
                            System Management
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {managementActions.map((action, idx) => (
                                <ActionCard
                                    key={idx}
                                    {...action}
                                    iconColor={action.color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                        <div className="mb-6 flex items-center gap-3 border-b border-destructive/20 pb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                                <Activity className="h-4 w-4 text-destructive" />
                            </div>
                            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Danger Item 1 */}
                            <div className="flex flex-col justify-between rounded-lg border border-destructive/20 bg-background/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
                                <div className="mb-4 sm:mb-0">
                                    <h3 className="font-medium text-foreground">Clear System Cache</h3>
                                    <p className="text-sm text-muted-foreground">Removes temporary files and session data.</p>
                                </div>
                                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-destructive hover:text-white hover:border-destructive">
                                    <Server className="h-4 w-4" />
                                    Purge Cache
                                </button>
                            </div>

                            {/* Danger Item 2 */}
                            <div className="flex flex-col justify-between rounded-lg border border-destructive/20 bg-background/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
                                <div className="mb-4 sm:mb-0">
                                    <h3 className="font-medium text-foreground">Reset Database</h3>
                                    <p className="text-sm text-muted-foreground">Reverts all tables to factory default state.</p>
                                </div>
                                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90">
                                    <Trash2 className="h-4 w-4" />
                                    Reset DB
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
