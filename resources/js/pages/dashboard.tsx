import { Head } from '@inertiajs/react';
import { useRole, RoleGuard } from '@/components/role-guard';
import { PermissionGuard } from '@/components/permission-guard';
import AppLayout from '@/layouts/app-layout';
import { StatCard } from '@/components/stat-card';
import { ActionCard } from '@/components/action-card';
import { AlertBanner } from '@/components/ui/alert-banner';
import { type BreadcrumbItem } from '@/types';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Settings,
  Activity,
  Server,
  Briefcase,
  TrendingUp,
  FileText,
  Database,
  Wrench,
  Lock,
  Trash2,
} from 'lucide-react';

interface Props {
  stats: {
    total: number;
    total_verified: number;
    total_unverified: number;
    total_super_admins: number;
    total_admins: number;
    total_users: number;
    recent_signups: number;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

export default function UnifiedDashboard({ stats }: Props) {
  const { user, roleLabel, isSuperAdmin } = useRole();

  // Super Admin management actions
  const superAdminActions = [
    { href: '/super-admin/config', icon: Settings, title: 'Configuration', desc: 'Global environment variables', color: 'text-gray-500' },
    { href: '/super-admin/roles', icon: Users, title: 'Role Management', desc: 'RBAC permissions structure', color: 'text-blue-500' },
    { href: '/super-admin/permission-groups', icon: Shield, title: 'Permission Groups', desc: 'Custom permission templates', color: 'text-purple-500' },
    { href: '/super-admin/logs', icon: FileText, title: 'System Logs', desc: 'Audit trails & error reporting', color: 'text-amber-500' },
    { href: '/super-admin/backup', icon: Database, title: 'Backup & Restore', desc: 'Snapshot management', color: 'text-emerald-500' },
    { href: '/super-admin/maintenance', icon: Wrench, title: 'Maintenance', desc: 'System availability toggle', color: 'text-indigo-500' },
    { href: '/super-admin/security', icon: Lock, title: 'Security Policy', desc: 'Firewall & session rules', color: 'text-rose-500' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isSuperAdmin() ? 'Super Admin Dashboard' : 'Dashboard'} />

      {/* Main Container */}
      <div className="relative min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
        {/* Decorative Background - Blue for Admin, Orange for Super Admin */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {isSuperAdmin() ? (
            <>
              <div className="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[100px]" />
              <div className="absolute top-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-destructive/5 blur-[80px]" />
            </>
          ) : (
            <>
              <div className="absolute -top-[10%] -right-[5%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
              <div className="absolute top-[20%] left-[10%] h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-[80px]" />
            </>
          )}
        </div>

        <div className="relative mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {isSuperAdmin() ? 'Super Admin Control' : 'Administration'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSuperAdmin() ? 'System oversight for' : 'Overview for'}{' '}
                <span className="font-medium text-foreground">{user?.name}</span> • {roleLabel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSuperAdmin() ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  System Operational
                </div>
              ) : (
                <div className="hidden text-right md:block">
                  <p className="text-xs text-muted-foreground">Current Session</p>
                  <p className="text-sm font-medium text-emerald-500">Active</p>
                </div>
              )}
            </div>
          </div>

          {/* Super Admin Warning Banner */}
          <RoleGuard requireSuperAdmin>
            <AlertBanner title="Elevated Privileges Active" variant="warning">
              You have root-level access to the system. Modifications made here may be irreversible and affect all tenants.
            </AlertBanner>
          </RoleGuard>

          {/* Primary Stats Grid - Show for both Admin and Super Admin */}
          <PermissionGuard permission="view_users">
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                User Base Overview
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Users"
                  value={stats.total}
                  icon={Users}
                  description={isSuperAdmin() ? 'Live accounts database' : 'All registered accounts'}
                  href="/admin/users"
                  bgClass="bg-blue-500/10"
                  colorClass="text-blue-600 dark:text-blue-400"
                />

                <StatCard
                  title="Verified"
                  value={stats.total_verified}
                  icon={UserCheck}
                  description={isSuperAdmin() ? 'Identity confirmed users' : 'Email confirmed'}
                  bgClass="bg-emerald-500/10"
                  colorClass="text-emerald-600 dark:text-emerald-400"
                />

                {!isSuperAdmin() && (
                  <StatCard
                    title="Unverified"
                    value={stats.total_unverified}
                    icon={UserX}
                    description="Pending verification"
                    bgClass="bg-amber-500/10"
                    colorClass="text-amber-600 dark:text-amber-400"
                  />
                )}

                <StatCard
                  title={isSuperAdmin() ? 'Admins' : 'Staff'}
                  value={stats.total_admins + stats.total_super_admins}
                  icon={Shield}
                  description={isSuperAdmin() ? 'Total privileged accounts' : 'Admins & Super Admins'}
                  bgClass="bg-purple-500/10"
                  colorClass="text-purple-600 dark:text-purple-400"
                />

                <StatCard
                  title="Growth"
                  value={`+${stats.recent_signups}`}
                  icon={TrendingUp}
                  description="New users in last 7 days"
                  bgClass={isSuperAdmin() ? 'bg-orange-500/10' : 'bg-cyan-500/10'}
                  colorClass={isSuperAdmin() ? 'text-orange-600 dark:text-orange-400' : 'text-cyan-600 dark:text-cyan-400'}
                />
              </div>
            </div>
          </PermissionGuard>

          {/* Secondary Metrics - Admin Only */}
          <RoleGuard requireAdmin fallback={null}>
            {!isSuperAdmin() && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* New Signups Card */}
                <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Recent Growth</h3>
                      <p className="text-xs text-muted-foreground">Last 7 days</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">+{stats.recent_signups}</span>
                    <span className="ml-2 text-xs font-medium text-emerald-500">New Users</span>
                  </div>
                </div>

                {/* Regular Users Breakdown */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">Standard Accounts</h3>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-2xl font-bold text-foreground">{stats.total_users}</span>
                    <span className="text-xs text-muted-foreground mb-1">Non-administrative</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-slate-500"
                      style={{ width: `${(stats.total_users / stats.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Admin Distribution */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">Admin Distribution</h3>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-2xl font-bold text-foreground">{stats.total_admins}</span>
                    <span className="text-xs text-muted-foreground mb-1">Standard Admins</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{ width: `${(stats.total_admins / (stats.total_admins + stats.total_super_admins)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </RoleGuard>

          {/* Quick Actions Grid - Show for Admins */}
          <PermissionGuard anyPermission={['view_users', 'manage_settings']}>
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <PermissionGuard permission="view_users">
                  <ActionCard
                    title="Manage Users"
                    description="View, edit, and moderate user accounts"
                    href="/admin/users"
                    icon={Users}
                    iconColor="text-blue-500"
                  />
                </PermissionGuard>

                <PermissionGuard permission="manage_settings">
                  <ActionCard
                    title="Application Settings"
                    description="Configure general system preferences"
                    href="/admin/settings"
                    icon={Settings}
                    iconColor="text-slate-500"
                  />
                </PermissionGuard>

                <RoleGuard requireSuperAdmin>
                  <ActionCard
                    title="System Config"
                    description="Advanced environment & security"
                    href="/super-admin/config"
                    icon={Server}
                    iconColor="text-red-500"
                  />
                </RoleGuard>
              </div>
            </div>
          </PermissionGuard>

          {/* Super Admin System Management */}
          <RoleGuard requireSuperAdmin>
            <div>
              <h2 className="mb-5 text-lg font-semibold tracking-tight text-foreground">
                System Management
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {superAdminActions.map((action, idx) => (
                  <ActionCard
                    key={idx}
                    {...action}
                    iconColor={action.color}
                  />
                ))}
              </div>
            </div>
          </RoleGuard>

          {/* Super Admin Danger Zone */}
          <RoleGuard requireSuperAdmin>
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
          </RoleGuard>
        </div>
      </div>
    </AppLayout>
  );
}
