import { Head } from '@inertiajs/react';
import { useRole, RoleGuard } from '@/components/role-guard';
import AppLayout from '@/layouts/app-layout';
import { StatCard } from '@/components/stat-card';
import { ActionCard } from '@/components/action-card';
import { type BreadcrumbItem } from '@/types';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Settings,
  Activity,
  Server,
  Briefcase
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
    href: '/admin/dashboard',
  },
];

export default function AdminDashboard({ stats }: Props) {
  const { user, roleLabel } = useRole();

  return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Admin Dashboard" />

        {/* Main Container */}
        <div className="relative min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">

          {/* Decorative Background (Cool/Professional Blue Tone) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[10%] -right-[5%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
            <div className="absolute top-[20%] left-[10%] h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-7xl space-y-8">

            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Administration
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Overview for <span className="font-medium text-foreground">{user?.name}</span> • {roleLabel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-xs text-muted-foreground">Current Session</p>
                  <p className="text-sm font-medium text-emerald-500">Active</p>
                </div>
              </div>
            </div>

            {/* Primary Stats Grid */}
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                User Base Overview
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats.total}
                    icon={Users}
                    description="All registered accounts"
                    href="/admin/users"
                    bgClass="bg-blue-500/10"
                    colorClass="text-blue-600 dark:text-blue-400"
                />

                <StatCard
                    title="Verified"
                    value={stats.total_verified}
                    icon={UserCheck}
                    description="Email confirmed"
                    bgClass="bg-emerald-500/10"
                    colorClass="text-emerald-600 dark:text-emerald-400"
                />

                <StatCard
                    title="Unverified"
                    value={stats.total_unverified}
                    icon={UserX}
                    description="Pending verification"
                    bgClass="bg-amber-500/10"
                    colorClass="text-amber-600 dark:text-amber-400"
                />

                <StatCard
                    title="Staff"
                    value={stats.total_admins + stats.total_super_admins}
                    icon={Shield}
                    description="Admins & Super Admins"
                    bgClass="bg-purple-500/10"
                    colorClass="text-purple-600 dark:text-purple-400"
                />
              </div>
            </div>

            {/* Secondary Metrics (Growth & Distribution) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* New Signups Card - Highlighting Growth */}
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

            {/* Quick Actions Grid */}
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ActionCard
                    title="Manage Users"
                    description="View, edit, and moderate user accounts"
                    href="/admin/users"
                    icon={Users}
                    iconColor="text-blue-500"
                />

                <ActionCard
                    title="Application Settings"
                    description="Configure general system preferences"
                    href="/admin/settings"
                    icon={Settings}
                    iconColor="text-slate-500"
                />

                {/* Conditional Super Admin Action */}
                <RoleGuard requireSuperAdmin>
                  <ActionCard
                      title="System Config"
                      description="Advanced environment & security (Super Admin)"
                      href="/super-admin/config"
                      icon={Server}
                      iconColor="text-red-500"
                  />
                </RoleGuard>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
  );
}
