import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ColumnDef, PaginationState, Updater, Row } from '@tanstack/react-table';
import { Edit, Trash2, ArrowUpDown, Filter, Pin, Shield, ShieldCheck } from 'lucide-react';

// Components
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/data-table';
import { useRole } from '@/components/role-guard';
import { TipsDialog } from '@/components/ui/tips-dialog';
import { RoleBadge } from '@/components/ui/role-badge';
import { StatusBadge } from '@/components/ui/status-badge';

import { BulkInviteModal } from '@/components/BulkInviteModal';
import { Upload } from 'lucide-react';

// Types
import { Role } from '@/types/role';
import { type BreadcrumbItem, type SharedData } from '@/types';

interface PermissionGroup {
  id: number;
  name: string;
  label: string;
  scope: 'system' | 'client';
  description?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified_at: string | null;
  created_at: string;
  organization?: {
    id: number;
    name: string;
    slug: string;
  };
  permission_groups?: PermissionGroup[];
  status?: 'invited' | 'verified' | 'pending';
  is_invitation?: boolean;
}

interface Props {
  users: User[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  permission_groups?: PermissionGroup[];
}

interface PendingInvitation {
  id: number;
  name?: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsersList({ users, pagination, permission_groups = [], pendingInvitations = [] }: Props & { pendingInvitations?: PendingInvitation[] }) {
  const { isSuperAdmin, isClientSuperAdmin, hasRole, isAdmin } = useRole();
  const { auth, organization_slug } = usePage<SharedData & { organization_slug?: string }>().props;
  const user = auth?.user;

  // Merge pending invitations with users
  const allUsers: User[] = [
    ...pendingInvitations.map(inv => ({
      id: inv.id, // Ensure this doesn't conflict with real IDs if keys matter, maybe prefix? But id is number. 
      // We can use negative IDs for invitations to avoid conflict if needed, or just assume they are unique enough or handled.
      // Actually best to treat them distinct, but for DataTable they need to be same shape.
      name: inv.name || 'Invited User',
      email: inv.email,
      role: inv.role,
      email_verified_at: null,
      created_at: inv.created_at,
      status: 'invited' as const,
      is_invitation: true,
    })),
    ...users
  ];

  // Build base URL for tenant context or super admin
  const baseUrl = user?.is_super_admin
    ? '/super-admin'
    : (organization_slug ? `/organization/${organization_slug}/admin` : '/admin');

  // --- State & Config ---

  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination.current_page - 1,
    pageSize: pagination.per_page,
  });


  const [isBulkInviteModalOpen, setIsBulkInviteModalOpen] = useState(false);

  const dashboardUrl = user?.is_super_admin
    ? '/super-admin/dashboard'
    : `${baseUrl}/dashboard`;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboardUrl },
    { title: 'User Management', href: `${baseUrl}/users` },
  ];

  // --- Actions ---

  const handleDelete = (targetUser: User) => {
    if (!confirm(`Are you sure you want to delete ${targetUser.name}? This action cannot be undone.`)) {
      return;
    }
    router.delete(`${baseUrl}/users/${targetUser.id}`, { preserveScroll: true });
  };

  const handlePaginationChange = (updaterOrValue: Updater<PaginationState>) => {
    const newPagination = typeof updaterOrValue === 'function'
      ? updaterOrValue(paginationState)
      : updaterOrValue;

    setPaginationState(newPagination);
    router.get(`${baseUrl}/users`,
      { page: newPagination.pageIndex + 1, per_page: newPagination.pageSize },
      { preserveState: true, preserveScroll: true }
    );
  };

  // --- Permissions Logic ---

  const canEditUser = (targetUser: User) => {
    if (isSuperAdmin()) return true;
    if (isClientSuperAdmin()) return ['admin', 'user'].includes(targetUser.role);
    if (hasRole(Role.ADMIN)) return targetUser.role === 'user';
    return false;
  };

  const canDeleteUser = (targetUser: User) => {
    if (isSuperAdmin()) return targetUser.role !== 'super_admin';
    if (isClientSuperAdmin()) return ['admin', 'user'].includes(targetUser.role);
    return false;
  };

  const canManagePermissions = (targetUser: User) => {
    if (isSuperAdmin()) return true;
    if (isClientSuperAdmin()) return ['admin', 'user'].includes(targetUser.role);
    if (hasRole(Role.ADMIN)) return targetUser.role === 'user';
    return false;
  };

  // --- Table Definition ---

  const columns: ColumnDef<User>[] = [
    ...(isSuperAdmin() ? [{
      id: 'organization',
      accessorKey: 'organization.name', // key for filtering/sorting
      header: 'Organization',
      cell: ({ row }: { row: Row<User> }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.organization?.name || 'Global System'}</span>
          {row.original.organization && (
            <span className="text-xs text-muted-foreground">{row.original.organization.slug}</span>
          )}
        </div>
      ),
      enableColumnFilter: true,
    }] : []),
    {
      accessorKey: 'name',
      header: 'User Details',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      ),
      enableColumnFilter: true,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        // If user has permission groups, display them. Otherwise display base role.
        if (row.original.permission_groups && row.original.permission_groups.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {row.original.permission_groups.map(group => (
                <span key={group.id} className="inline-flex items-center rounded-md border border-transparent bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {group.label}
                </span>
              ))}
            </div>
          );
        }
        return <RoleBadge role={row.original.role} />;
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: 'email_verified_at',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          verified={!!row.original.email_verified_at}
          date={row.original.email_verified_at || undefined}
          status={row.original.status}
        />
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">
          {new Date(row.original.created_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canManagePermissions(row.original) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.visit(`${baseUrl}/users/${row.original.id}/permissions`);
              }}
              className="group rounded-md p-1.5 text-muted-foreground transition-all hover:bg-purple-500/10 hover:text-purple-600"
              title="Manage Permissions"
            >
              <ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
          )}
          {canEditUser(row.original) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.visit(`${baseUrl}/users/${row.original.id}/edit`);
              }}
              className="group rounded-md p-1.5 text-muted-foreground transition-all hover:bg-blue-500/10 hover:text-blue-600"
              title="Edit User"
            >
              <Edit className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
          )}
          {canDeleteUser(row.original) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // If invitation, we might need a different delete route (cancel invitation)
                if (row.original.is_invitation) {
                  if (confirm(`Cancel invitation for ${row.original.email}?`)) {
                    router.delete(`${baseUrl}/invitations/${row.original.id}`, { preserveScroll: true });
                  }
                } else {
                  handleDelete(row.original);
                }
              }}
              className="group rounded-md p-1.5 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-600"
              title={row.original.is_invitation ? "Cancel Invitation" : "Delete User"}
            >
              <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      ),
      enableSorting: false,
    },
  ];

  const helpTips = [
    { title: "Sort & Organize", description: "Click any column header to toggle ascending or descending sort order.", icon: ArrowUpDown },
    { title: "Advanced Filtering", description: "Use the search inputs within column headers to filter users by name or role.", icon: Filter },
    { title: "Column Pinning", description: "Click the pin icon in the header menu to freeze important columns to the left or right.", icon: Pin },
    { title: "Permission Levels", description: "Super Admins can manage all roles. Regular Admins can only manage standard users.", icon: Shield }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="User Management" />

      <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                User Management
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Directory of {pagination.total} registered accounts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <TipsDialog title="Table Features Guide" tips={helpTips} />

              {isAdmin() && (
                <>
                  <button
                    onClick={() => setIsBulkInviteModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Bulk Invite</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <DataTable
              columns={columns}
              data={allUsers}
              pagination={{
                pageIndex: paginationState.pageIndex,
                pageSize: paginationState.pageSize,
                total: pagination.total,
                onPaginationChange: handlePaginationChange,
              }}
              enableColumnFilters={true}
              enableSorting={true}
              enablePinning={true}
            />
          </div>
        </div>
      </div>

      {/* Invite Users Modal */}

      <BulkInviteModal
        isOpen={isBulkInviteModalOpen}
        onClose={() => setIsBulkInviteModalOpen(false)}
        permissionGroups={permission_groups}
      />
    </AppLayout>
  );
}
