import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Edit, Trash2, Building2, Users, Search, X, UserPlus, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader, EmptyState } from '@/components/common';
import { Checkbox } from '@/components/ui/checkbox';

// Types
import type { BreadcrumbItem } from '@/types';

interface Department {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_default: boolean;
    users_count: number;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    departments: Department[];
}

export default function DepartmentsIndex({ departments }: Props) {
    const { props } = usePage<{ organization_slug: string }>();
    const orgSlug = props.organization_slug;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: `/organization/${orgSlug}/admin/dashboard` },
        { title: 'Departments', href: `/organization/${orgSlug}/admin/departments` },
    ];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null);
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
    const [departmentToManageUsers, setDepartmentToManageUsers] = useState<Department | null>(null);
    const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const form = useForm({
        name: '',
        description: '',
    });

    const handleCreate = () => {
        form.reset();
        setDepartmentToEdit(null);
        setIsCreateModalOpen(true);
    };

    const handleEdit = (department: Department) => {
        form.setData({
            name: department.name,
            description: department.description || '',
        });
        setDepartmentToEdit(department);
        setIsCreateModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const url = departmentToEdit
            ? `/organization/${orgSlug}/admin/departments/${departmentToEdit.id}`
            : `/organization/${orgSlug}/admin/departments`;

        const method = departmentToEdit ? 'put' : 'post';

        router[method](url, form.data, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(departmentToEdit ? 'Department updated successfully' : 'Department created successfully');
                setIsCreateModalOpen(false);
                form.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(typeof firstError === 'string' ? firstError : 'Failed to save department');
            },
        });
    };

    const handleDelete = () => {
        if (!departmentToDelete) return;

        router.delete(`/organization/${orgSlug}/admin/departments/${departmentToDelete.id}`, {
            onSuccess: () => {
                toast.success('Department deleted successfully');
                setDepartmentToDelete(null);
            },
            onError: () => {
                toast.error('Failed to delete department');
            },
        });
    };

    const handleManageUsers = async (department: Department) => {
        setDepartmentToManageUsers(department);
        setLoadingUsers(true);
        setSelectedUsersToAdd([]);
        setUserSearchQuery('');

        try {
            // Fetch department users
            const deptResponse = await fetch(`/organization/${orgSlug}/admin/departments/${department.id}/users`);
            const deptData = await deptResponse.json();
            setDepartmentUsers(deptData.users || []);

            // Fetch all users for adding
            const usersResponse = await fetch(`/organization/${orgSlug}/admin/departments/list`);
            const usersData = await usersResponse.json();
            // We need to get all org users - let's use a different approach
            // For now, we'll show existing users and allow removal
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleRemoveUser = (userId: number) => {
        if (!departmentToManageUsers) return;

        router.delete(`/organization/${orgSlug}/admin/departments/${departmentToManageUsers.id}/users`, {
            data: { user_ids: [userId] },
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User removed from department');
                setDepartmentUsers((prev) => prev.filter((u) => u.id !== userId));
            },
            onError: () => {
                toast.error('Failed to remove user');
            },
        });
    };

    const filteredDepartmentUsers = departmentUsers.filter(
        (user) =>
            user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departments" />

            <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <PageHeader
                        title="Departments"
                        description="Manage departments to organize users and enable QuickInvite™ for polls."
                        actions={
                            <Button onClick={handleCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Department
                            </Button>
                        }
                    />

                    {/* Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Departments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{departments.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Default Departments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {departments.filter((d) => d.is_default).length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Custom Departments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {departments.filter((d) => !d.is_default).length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Departments Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {departments.map((department) => (
                            <Card key={department.id} className="flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-base">{department.name}</CardTitle>
                                        </div>
                                        {department.is_default && (
                                            <Badge variant="secondary" className="text-xs">
                                                Default
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="line-clamp-2 h-10">
                                        {department.description || 'No description'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>
                                            {department.users_count} member{department.users_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-2 border-t flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 gap-1"
                                        onClick={() => handleManageUsers(department)}
                                    >
                                        <Users className="h-3.5 w-3.5" />
                                        Members
                                    </Button>
                                    {!department.is_default && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => handleEdit(department)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => setDepartmentToDelete(department)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </>
                                    )}
                                    {department.is_default && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => handleEdit(department)}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {departments.length === 0 && (
                        <EmptyState
                            icon={Building2}
                            title="No departments found"
                            description="Create your first department to organize users."
                            action={{
                                label: 'Create Department',
                                onClick: handleCreate,
                                icon: Plus,
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {departmentToEdit ? 'Edit Department' : 'Create Department'}
                            </DialogTitle>
                            <DialogDescription>
                                {departmentToEdit
                                    ? 'Update the department details.'
                                    : 'Create a new department to organize users.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Department Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Engineering, Marketing"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    required
                                    disabled={departmentToEdit?.is_default}
                                />
                                {departmentToEdit?.is_default && (
                                    <p className="text-xs text-muted-foreground">
                                        Default department names cannot be changed.
                                    </p>
                                )}
                                {form.errors.name && (
                                    <p className="text-sm text-destructive">{form.errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe this department..."
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving...' : departmentToEdit ? 'Save Changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!departmentToDelete} onOpenChange={() => setDepartmentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Department?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the "{departmentToDelete?.name}" department.
                            Users in this department will be removed from it, but their accounts will remain active.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete Department
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Manage Users Modal */}
            <Dialog open={!!departmentToManageUsers} onOpenChange={() => setDepartmentToManageUsers(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            {departmentToManageUsers?.name} Members
                        </DialogTitle>
                        <DialogDescription>
                            View and manage members of this department.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search members..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Users List */}
                        <div className="max-h-80 overflow-y-auto space-y-2">
                            {loadingUsers ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : filteredDepartmentUsers.length > 0 ? (
                                filteredDepartmentUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveUser(user.id)}
                                        >
                                            <UserMinus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {userSearchQuery ? 'No members found.' : 'No members in this department yet.'}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            To add users to departments, go to User Management and edit their department assignments.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDepartmentToManageUsers(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
