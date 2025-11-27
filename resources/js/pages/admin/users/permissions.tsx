import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Save, Shield, Users as UsersIcon, Lock, Unlock, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/ui/role-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Types
import type { BreadcrumbItem } from '@/types';
import type { PermissionGroup, GroupedPermissions } from '@/types/permission';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/permission';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_label: string;
}

interface Props {
  user: User;
  permission_groups: PermissionGroup[];
  permissions: GroupedPermissions;
  user_permission_groups: number[];
  user_direct_permissions: Array<{ id: number; granted: boolean }>;
}

export default function UserPermissions({
  user,
  permission_groups,
  permissions,
  user_permission_groups,
  user_direct_permissions,
}: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(permissions))
  );

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: user.role === 'super_admin' ? '/super-admin/dashboard' : '/admin/dashboard' },
    { title: 'User Management', href: '/admin/users' },
    { title: user.name, href: '#' },
    { title: 'Permissions', href: `#` },
  ];

  const form = useForm({
    permission_group_ids: user_permission_groups,
    granted_permissions: user_direct_permissions
      .filter((p) => p.granted)
      .map((p) => p.id),
    revoked_permissions: user_direct_permissions
      .filter((p) => !p.granted)
      .map((p) => p.id),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get the assigned permission groups for detailed toasts
    const assignedGroups = permission_groups.filter((g) =>
      form.data.permission_group_ids.includes(g.id)
    );

    form.put(`/admin/users/${user.id}/permissions`, {
      onSuccess: () => {
        // Show individual toasts for each assigned permission group
        if (assignedGroups.length > 0) {
          assignedGroups.forEach((group) => {
            toast.success(`${group.label} granted to ${user.name}`, {
              icon: '✅',
            });
          });
        }

        // Show toast for granted permissions
        if (form.data.granted_permissions.length > 0) {
          toast.success(`${form.data.granted_permissions.length} individual permission(s) granted`, {
            icon: '🔓',
          });
        }

        // Show toast for revoked permissions
        if (form.data.revoked_permissions.length > 0) {
          toast(`${form.data.revoked_permissions.length} permission(s) revoked`, {
            icon: '⚠️',
          });
        }
        // Note: Backend flash message will show general success
      },
      onError: () => {
        toast.error('Failed to update permissions. Please try again.');
      },
    });
  };

  const togglePermissionGroup = (groupId: number) => {
    const current = form.data.permission_group_ids;
    if (current.includes(groupId)) {
      form.setData('permission_group_ids', current.filter((id) => id !== groupId));
    } else {
      form.setData('permission_group_ids', [...current, groupId]);
    }
  };

  const toggleDirectPermission = (permissionId: number) => {
    const isGranted = form.data.granted_permissions.includes(permissionId);
    const isRevoked = form.data.revoked_permissions.includes(permissionId);

    if (isGranted) {
      // Currently granted, so remove it
      form.setData({
        ...form.data,
        granted_permissions: form.data.granted_permissions.filter((id) => id !== permissionId),
      });
    } else if (isRevoked) {
      // Currently revoked, so ungrant it (remove from revoked)
      form.setData({
        ...form.data,
        revoked_permissions: form.data.revoked_permissions.filter((id) => id !== permissionId),
      });
    } else {
      // Not in either list, so grant it
      form.setData({
        ...form.data,
        granted_permissions: [...form.data.granted_permissions, permissionId],
      });
    }
  };

  const revokePermission = (permissionId: number) => {
    // Add to revoked list and remove from granted if present
    form.setData({
      ...form.data,
      granted_permissions: form.data.granted_permissions.filter((id) => id !== permissionId),
      revoked_permissions: [...form.data.revoked_permissions.filter((id) => id !== permissionId), permissionId],
    });
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

  const getCategoryIcon = (category: string) => {
    const iconName = CATEGORY_ICONS[category] || 'Shield';
    const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const getPermissionState = (permissionId: number): 'granted' | 'revoked' | 'neutral' => {
    if (form.data.granted_permissions.includes(permissionId)) return 'granted';
    if (form.data.revoked_permissions.includes(permissionId)) return 'revoked';
    return 'neutral';
  };

  // Check if user gets permission from any selected group
  const getPermissionFromGroups = (permissionId: number): PermissionGroup | null => {
    const selectedGroups = permission_groups.filter((g) =>
      form.data.permission_group_ids.includes(g.id)
    );
    return selectedGroups.find((g) => g.permissions.some((p) => p.id === permissionId)) || null;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Manage Permissions - ${user.name}`} />

      <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Manage Permissions
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm text-muted-foreground">
                  {user.name} ({user.email})
                </p>
                <RoleBadge role={user.role} />
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={form.processing} className="gap-2">
              <Save className="h-4 w-4" />
              {form.processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="groups" className="gap-2">
                <UsersIcon className="h-4 w-4" />
                Permission Groups
              </TabsTrigger>
              <TabsTrigger value="individual" className="gap-2">
                <Shield className="h-4 w-4" />
                Individual Permissions
              </TabsTrigger>
            </TabsList>

            {/* Permission Groups Tab */}
            <TabsContent value="groups" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assign Permission Groups</CardTitle>
                  <CardDescription>
                    Select pre-configured permission groups to assign to this user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {permission_groups.map((group) => {
                    const isSelected = form.data.permission_group_ids.includes(group.id);

                    return (
                      <div
                        key={group.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={isSelected}
                          onCheckedChange={() => togglePermissionGroup(group.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Label
                              htmlFor={`group-${group.id}`}
                              className="text-base font-semibold cursor-pointer"
                            >
                              {group.label}
                            </Label>
                            {group.is_system && (
                              <Badge variant="secondary" className="text-xs">
                                System
                              </Badge>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {group.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            <span>{group.permissions_count || group.permissions.length} permissions</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {permission_groups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No permission groups available</p>
                      <p className="text-sm mt-1">
                        Contact a super admin to create permission groups
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Individual Permissions Tab */}
            <TabsContent value="individual" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grant or Revoke Individual Permissions</CardTitle>
                  <CardDescription>
                    Override permissions from groups or grant additional permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(permissions).map(([category, categoryPermissions]) => {
                    const isExpanded = expandedCategories.has(category);
                    const grantedCount = categoryPermissions.filter((p) =>
                      getPermissionState(p.id) === 'granted'
                    ).length;
                    const revokedCount = categoryPermissions.filter((p) =>
                      getPermissionState(p.id) === 'revoked'
                    ).length;

                    return (
                      <div key={category} className="rounded-lg border border-border">
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
                              <div className="flex gap-3 text-sm text-muted-foreground">
                                {grantedCount > 0 && (
                                  <span className="text-green-600">
                                    {grantedCount} granted
                                  </span>
                                )}
                                {revokedCount > 0 && (
                                  <span className="text-red-600">
                                    {revokedCount} revoked
                                  </span>
                                )}
                                {grantedCount === 0 && revokedCount === 0 && (
                                  <span>No overrides</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            className={`h-5 w-5 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border p-4 space-y-3">
                            {categoryPermissions.map((permission) => {
                              const state = getPermissionState(permission.id);
                              const fromGroup = getPermissionFromGroups(permission.id);

                              return (
                                <div
                                  key={permission.id}
                                  className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/30"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-foreground">
                                      {permission.label}
                                    </div>
                                    {permission.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {permission.description}
                                      </p>
                                    )}
                                    {fromGroup && state === 'neutral' && (
                                      <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                                        <Shield className="h-3 w-3" />
                                        <span>From group: {fromGroup.label}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={state === 'granted' ? 'default' : 'outline'}
                                      onClick={() => toggleDirectPermission(permission.id)}
                                      className="gap-1"
                                    >
                                      <Unlock className="h-3 w-3" />
                                      Grant
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={state === 'revoked' ? 'destructive' : 'outline'}
                                      onClick={() => revokePermission(permission.id)}
                                      className="gap-1"
                                    >
                                      <Lock className="h-3 w-3" />
                                      Revoke
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
