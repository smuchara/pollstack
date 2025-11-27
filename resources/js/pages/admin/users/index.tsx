import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ColumnDef, PaginationState, Updater } from '@tanstack/react-table';
import { Edit, Trash2, ArrowUpDown, Filter, Pin, Shield, Mail } from 'lucide-react';

// Components
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/data-table';
import { useRole } from '@/components/role-guard';
import { TipsDialog } from '@/components/ui/tips-dialog';
import { RoleBadge } from '@/components/ui/role-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { InviteUsersModal } from '@/components/invite-users-modal';

// Types
import { Role } from '@/types/role';
import { type BreadcrumbItem, type SharedData } from '@/types';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified_at: string | null;
  created_at: string;
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
}

export default function UsersList({ users, pagination }: Props) {
  const { isSuperAdmin, hasRole, isAdmin } = useRole();
  const { auth } = usePage<SharedData>().props;
  const user = auth?.user;

  // --- State & Config ---

  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination.current_page - 1,
    pageSize: pagination.per_page,
  });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const dashboardUrl = user?.is_super_admin
      ? '/super-admin/dashboard'
      : '/admin/dashboard';

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboardUrl },
    { title: 'User Management', href: '/admin/users' },
  ];

  // --- Actions ---

  const handleDelete = (targetUser: User) => {
    if (!confirm(`Are you sure you want to delete ${targetUser.name}? This action cannot be undone.`)) {
      return;
    }
    router.delete(`/admin/users/${targetUser.id}`, { preserveScroll: true });
  };

  const handlePaginationChange = (updaterOrValue: Updater<PaginationState>) => {
    const newPagination = typeof updaterOrValue === 'function'
        ? updaterOrValue(paginationState)
        : updaterOrValue;

    setPaginationState(newPagination);
    router.get('/admin/users',
        { page: newPagination.pageIndex + 1, per_page: newPagination.pageSize },
        { preserveState: true, preserveScroll: true }
    );
  };

  // --- Permissions Logic ---

  const canEditUser = (targetUser: User) => {
    if (isSuperAdmin()) return true;
    if (hasRole(Role.ADMIN)) return targetUser.role === 'user';
    return false;
  };

  const canDeleteUser = (targetUser: User) => {
    return isSuperAdmin() && targetUser.role !== 'super_admin';
  };

  // --- Table Definition ---

  const columns: ColumnDef<User>[] = [
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
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'email_verified_at',
      header: 'Status',
      cell: ({ row }) => (
          <StatusBadge
              verified={!!row.original.email_verified_at}
              date={row.original.email_verified_at || undefined}
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
            {canEditUser(row.original) && (
                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.visit(`/admin/users/${row.original.id}/edit`);
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
                      handleDelete(row.original);
                    }}
                    className="group rounded-md p-1.5 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-600"
                    title="Delete User"
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
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Invite Users</span>
                    </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <DataTable
                  columns={columns}
                  data={users}
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
        <InviteUsersModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      </AppLayout>
  );
}
