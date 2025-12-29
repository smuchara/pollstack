import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Edit, Trash2, Users, Shield } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import AppLayout from '@/layouts/app-layout';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Types
import type { BreadcrumbItem } from '@/types';
import type { PermissionGroup, GroupedPermissions } from '@/types/permission';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/permission';
import { useRole } from '@/components/role-guard';

interface Props {
  groups: PermissionGroup[];
  permissions: GroupedPermissions;
}

interface PermissionSelectorProps {
  permissions: GroupedPermissions;
  selectedPermissions: number[];
  expandedCategories: Set<string>;
  toggleCategory: (category: string) => void;
  togglePermission: (permissionId: number) => void;
  formType: 'create' | 'edit';
}

function PermissionSelector({
  permissions,
  selectedPermissions,
  expandedCategories,
  toggleCategory,
  togglePermission,
  formType,
}: PermissionSelectorProps) {
  const getCategoryIcon = (category: string) => {
    const iconName = CATEGORY_ICONS[category] || 'Shield';
    const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {Object.entries(permissions).map(([category, categoryPermissions]) => {
        const isExpanded = expandedCategories.has(category);
        const selectedCount = categoryPermissions.filter((p) =>
          selectedPermissions.includes(p.id)
        ).length;

        return (
          <div key={category} className="rounded-lg border border-border bg-card">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                {getCategoryIcon(category)}
                <div>
                  <h4 className="font-semibold text-foreground">
                    {CATEGORY_LABELS[category] || category}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} of {categoryPermissions.length} selected
                  </p>
                </div>
              </div>
              <Badge variant={selectedCount > 0 ? 'default' : 'secondary'}>
                {selectedCount}
              </Badge>
            </button>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-3">
                {categoryPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`${formType}-permission-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`${formType}-permission-${permission.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {permission.label}
                      </Label>
                      {permission.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PermissionGroups({ groups, permissions }: Props) {
  const { isSuperAdmin } = useRole();
  const { organization_slug } = usePage<{ organization_slug?: string }>().props;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(permissions)));

  // Dynamic Base URL
  const baseUrl = isSuperAdmin()
    ? '/super-admin'
    : `/organization/${organization_slug}/admin`;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: `${baseUrl}/dashboard` },
    { title: 'System Configuration', href: '#' },
    { title: 'Permission Groups', href: `${baseUrl}/permission-groups` },
  ];

  const createForm = useForm({
    name: '',
    label: '',
    description: '',
    permissions: [] as number[],
    scope: 'client', // Default scope
  });

  const editForm = useForm({
    name: '',
    label: '',
    description: '',
    permissions: [] as number[],
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post(`${baseUrl}/permission-groups`, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        createForm.reset();
        toast.success('Permission group created successfully');
      },
      onError: () => {
        toast.error('Failed to create permission group. Please try again.');
      },
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    editForm.put(`${baseUrl}/permission-groups/${selectedGroup.id}`, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedGroup(null);
        editForm.reset();
        toast.success('Permission group updated successfully');
      },
      onError: () => {
        toast.error('Failed to update permission group. Please try again.');
      },
    });
  };

  const handleDelete = (group: PermissionGroup) => {
    if (group.is_system) {
      toast.error('System permission groups cannot be deleted');
      return;
    }

    if (!confirm(`Delete "${group.label}"? This action cannot be undone.`)) {
      return;
    }

    router.delete(`${baseUrl}/permission-groups/${group.id}`, {
      onSuccess: () => {
        toast.success('Permission group deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete permission group. Please try again.');
      },
    });
  };

  const openEditModal = (group: PermissionGroup) => {
    setSelectedGroup(group);
    editForm.setData({
      name: group.name,
      label: group.label,
      description: group.description || '',
      permissions: group.permissions.map((p) => p.id),
    });
    setIsEditModalOpen(true);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermissionCreate = (permissionId: number) => {
    const currentPermissions = createForm.data.permissions;
    if (currentPermissions.includes(permissionId)) {
      createForm.setData('permissions', currentPermissions.filter((id) => id !== permissionId));
    } else {
      createForm.setData('permissions', [...currentPermissions, permissionId]);
    }
  };

  const togglePermissionEdit = (permissionId: number) => {
    const currentPermissions = editForm.data.permissions;
    if (currentPermissions.includes(permissionId)) {
      editForm.setData('permissions', currentPermissions.filter((id) => id !== permissionId));
    } else {
      editForm.setData('permissions', [...currentPermissions, permissionId]);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Permission Groups" />

      <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Permission Groups
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Create custom permission groups to assign to users
              </p>
            </div>

            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </div>

          {/* Permission Groups Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {group.label}
                      </h3>
                      {group.is_system && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                      {!group.is_system && group.scope === 'system' && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          System
                        </Badge>
                      )}
                      {!group.is_system && group.organization_id && (
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {group.name} (Tenant)
                        </Badge>
                      )}
                      {!group.is_system && !group.organization_id && group.scope === 'client' && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Global Client
                        </Badge>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>{group.permissions_count || group.permissions.length} permissions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{group.users_count || 0} users</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(group)}
                    // Disable edit if it's a global group and user is not super admin
                    disabled={!isSuperAdmin() && group.organization_id === null}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  {!group.is_system && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(group)}
                      // Disable delete if it's a global group and user is not super admin
                      disabled={!isSuperAdmin() && group.organization_id === null}
                      className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Permission Group</DialogTitle>
              <DialogDescription>
                Define a custom permission group with specific permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">

              {/* Scope Selection (Super Admin Only) */}
              {isSuperAdmin() && (
                <div className="space-y-3 rounded-lg border p-4">
                  <Label>Group Scope</Label>
                  <RadioGroup
                    defaultValue="client"
                    value={createForm.data.scope}
                    onValueChange={(val: string) => createForm.setData('scope', val as 'system' | 'client')}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="client" id="scope-client" />
                      <Label htmlFor="scope-client" className="font-normal cursor-pointer">Client (Tenant)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="scope-system" />
                      <Label htmlFor="scope-system" className="font-normal cursor-pointer">System (Admin)</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    Client groups are for tenant users. System groups are for system administrators.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="create-name">Group Name (Slug)</Label>
                <Input
                  id="create-name"
                  value={createForm.data.name}
                  onChange={(e) => createForm.setData('name', e.target.value)}
                  placeholder="e.g., poll_moderator"
                  required
                />
                {createForm.errors.name && (
                  <p className="text-sm text-destructive">{createForm.errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-label">Display Label</Label>
                <Input
                  id="create-label"
                  value={createForm.data.label}
                  onChange={(e) => createForm.setData('label', e.target.value)}
                  placeholder="e.g., Poll Moderator"
                  required
                />
                {createForm.errors.label && (
                  <p className="text-sm text-destructive">{createForm.errors.label}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={createForm.data.description}
                  onChange={(e) => createForm.setData('description', e.target.value)}
                  placeholder="Describe this permission group..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <PermissionSelector
                  formType="create"
                  permissions={permissions}
                  selectedPermissions={createForm.data.permissions}
                  expandedCategories={expandedCategories}
                  toggleCategory={toggleCategory}
                  togglePermission={togglePermissionCreate}
                />
                {createForm.errors.permissions && (
                  <p className="text-sm text-destructive">{createForm.errors.permissions}</p>
                )}
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
              <Button type="submit" disabled={createForm.processing}>
                {createForm.processing ? 'Creating...' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Permission Group</DialogTitle>
              <DialogDescription>
                Update the permissions for "{selectedGroup?.label}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name (Slug)</Label>
                <Input
                  id="edit-name"
                  value={editForm.data.name}
                  onChange={(e) => editForm.setData('name', e.target.value)}
                  disabled={selectedGroup?.is_system}
                  required
                />
                {editForm.errors.name && (
                  <p className="text-sm text-destructive">{editForm.errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-label">Display Label</Label>
                <Input
                  id="edit-label"
                  value={editForm.data.label}
                  onChange={(e) => editForm.setData('label', e.target.value)}
                  disabled={selectedGroup?.is_system}
                  required
                />
                {editForm.errors.label && (
                  <p className="text-sm text-destructive">{editForm.errors.label}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.data.description}
                  onChange={(e) => editForm.setData('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <PermissionSelector
                  formType="edit"
                  permissions={permissions}
                  selectedPermissions={editForm.data.permissions}
                  expandedCategories={expandedCategories}
                  toggleCategory={toggleCategory}
                  togglePermission={togglePermissionEdit}
                />
                {editForm.errors.permissions && (
                  <p className="text-sm text-destructive">{editForm.errors.permissions}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editForm.processing}>
                {editForm.processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
