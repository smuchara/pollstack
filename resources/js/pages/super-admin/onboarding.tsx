import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Building2, Users, TrendingUp, Plus, ExternalLink, CheckCircle2, Clock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import AppLayout from '@/layouts/app-layout';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Types
import type { BreadcrumbItem } from '@/types';

interface Organization {
    id: number;
    name: string;
    slug: string;
    users_count: number;
    status: 'active' | 'pending_signup' | 'pending_verification';
    created_at: string;
}

interface Stats {
    total_organizations: number;
    total_users_in_tenants: number;
    recent_organizations: number;
    active_count: number;
    pending_signup_count: number;
    pending_verification_count: number;
}

interface Props {
    organizations: Organization[];
    stats: Stats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/super-admin/dashboard' },
    { title: 'Onboarding', href: '/super-admin/onboarding' },
];

// Status badge component
function StatusBadge({ status }: { status: Organization['status'] }) {
    const config = {
        active: {
            label: 'Active',
            icon: CheckCircle2,
            className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        },
        pending_signup: {
            label: 'Pending Signup',
            icon: Mail,
            className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        },
        pending_verification: {
            label: 'Pending Verification',
            icon: Clock,
            className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        },
    };

    const { label, icon: Icon, className } = config[status];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}

export default function Onboarding({ organizations, stats }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const form = useForm({
        company_name: '',
        slug: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
    });

    // Auto-generate slug from company name
    const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        form.setData('company_name', name);
        // Generate slug: lowercase, replace spaces with hyphens, remove special chars
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        form.setData('slug', slug);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/super-admin/onboarding', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                form.reset();
                toast.success('Tenant provisioned successfully! An invitation email has been sent to the admin.');
            },
            onError: () => {
                toast.error('Failed to provision tenant. Please check the form and try again.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agency Onboarding" />

            <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                {/* Decorative Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[100px]" />
                    <div className="absolute top-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
                </div>

                <div className="relative mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                Agency Onboarding
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Provision new corporate tenants and manage onboarded organizations
                            </p>
                        </div>

                        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Provision New Tenant
                        </Button>
                    </div>

                    {/* Stats Grid - Row 1: Overview */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            title="Total Organizations"
                            value={stats.total_organizations}
                            icon={Building2}
                            description="All corporate tenants"
                            bgClass="bg-blue-500/10"
                            colorClass="text-blue-600 dark:text-blue-400"
                        />

                        <StatCard
                            title="Total Tenant Users"
                            value={stats.total_users_in_tenants}
                            icon={Users}
                            description="Users across all organizations"
                            bgClass="bg-purple-500/10"
                            colorClass="text-purple-600 dark:text-purple-400"
                        />

                        <StatCard
                            title="New This Month"
                            value={`+${stats.recent_organizations}`}
                            icon={TrendingUp}
                            description="Organizations added in last 30 days"
                            bgClass="bg-cyan-500/10"
                            colorClass="text-cyan-600 dark:text-cyan-400"
                        />
                    </div>

                    {/* Stats Grid - Row 2: Status Breakdown */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard
                            title="Active"
                            value={stats.active_count}
                            icon={CheckCircle2}
                            description="Fully onboarded & verified"
                            bgClass="bg-emerald-500/10"
                            colorClass="text-emerald-600 dark:text-emerald-400"
                        />

                        <StatCard
                            title="Pending Signup"
                            value={stats.pending_signup_count}
                            icon={Mail}
                            description="Invitation sent, awaiting signup"
                            bgClass="bg-amber-500/10"
                            colorClass="text-amber-600 dark:text-amber-400"
                        />

                        <StatCard
                            title="Pending Verification"
                            value={stats.pending_verification_count}
                            icon={Clock}
                            description="Signed up, email not verified"
                            bgClass="bg-orange-500/10"
                            colorClass="text-orange-600 dark:text-orange-400"
                        />
                    </div>

                    {/* Organizations Table */}
                    <div className="rounded-xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-6 py-4">
                            <h2 className="text-lg font-semibold text-foreground">Onboarded Organizations</h2>
                            <p className="text-sm text-muted-foreground">
                                List of all provisioned corporate tenants
                            </p>
                        </div>

                        {organizations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <Building2 className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-foreground">No organizations yet</h3>
                                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                                    Get started by provisioning your first corporate tenant.
                                </p>
                                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Provision First Tenant
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Organization
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Portal URL
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Users
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {organizations.map((org) => (
                                            <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{org.name}</p>
                                                            <p className="text-xs text-muted-foreground">ID: {org.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                        /organization/{org.slug}
                                                    </code>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <StatusBadge status={org.status} />
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                                                        <Users className="h-3 w-3" />
                                                        {org.users_count}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                                                    {org.created_at}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-2"
                                                        onClick={() => window.open(`/organization/${org.slug}/admin/dashboard`, '_blank')}
                                                        disabled={org.status !== 'active'}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        Visit
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-lg">
                    <form onSubmit={handleCreate}>
                        <DialogHeader>
                            <DialogTitle>Provision New Tenant</DialogTitle>
                            <DialogDescription>
                                Create a new corporate organization and its primary administrator
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-6">
                            {/* Organization Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Building2 className="h-4 w-4" />
                                    Organization Details
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Company / SACCO Name</Label>
                                    <Input
                                        id="company_name"
                                        value={form.data.company_name}
                                        onChange={handleCompanyNameChange}
                                        placeholder="e.g. Harambee SACCO"
                                        required
                                    />
                                    {form.errors.company_name && (
                                        <p className="text-sm text-destructive">{form.errors.company_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">Portal Domain (Slug)</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                            /organization/
                                        </span>
                                        <Input
                                            id="slug"
                                            value={form.data.slug}
                                            onChange={(e) => form.setData('slug', e.target.value)}
                                            placeholder="harambee-sacco"
                                            className="rounded-l-none"
                                            required
                                        />
                                    </div>
                                    {form.errors.slug && (
                                        <p className="text-sm text-destructive">{form.errors.slug}</p>
                                    )}
                                </div>
                            </div>

                            {/* Admin Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Users className="h-4 w-4" />
                                    Primary Administrator
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="admin_name">Full Name</Label>
                                        <Input
                                            id="admin_name"
                                            value={form.data.admin_name}
                                            onChange={(e) => form.setData('admin_name', e.target.value)}
                                            placeholder="John Doe"
                                            required
                                        />
                                        {form.errors.admin_name && (
                                            <p className="text-sm text-destructive">{form.errors.admin_name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="admin_phone">Phone Number</Label>
                                        <Input
                                            id="admin_phone"
                                            value={form.data.admin_phone}
                                            onChange={(e) => form.setData('admin_phone', e.target.value)}
                                            placeholder="+254 7..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="admin_email">Email Address</Label>
                                    <Input
                                        id="admin_email"
                                        type="email"
                                        value={form.data.admin_email}
                                        onChange={(e) => form.setData('admin_email', e.target.value)}
                                        placeholder="admin@company.com"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        An invitation with login credentials will be sent to this email.
                                    </p>
                                    {form.errors.admin_email && (
                                        <p className="text-sm text-destructive">{form.errors.admin_email}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing} className="gap-2">
                                {form.processing ? 'Provisioning...' : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Provision Tenant
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
