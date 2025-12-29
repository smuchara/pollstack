import { useState, FormEvent, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Role } from '@/types/role';
import { useRole } from '@/components/role-guard';

interface PermissionGroup {
    id: number;
    name: string;
    label: string;
    scope: 'system' | 'client';
    description?: string;
}

interface BulkInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    permissionGroups?: PermissionGroup[];
}

export function BulkInviteModal({ isOpen, onClose, permissionGroups = [] }: BulkInviteModalProps) {
    const { organization_slug } = usePage<{ organization_slug?: string }>().props;
    const { isSuperAdmin } = useRole();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contactedFile, setContactedFile] = useState<File | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>(Role.USER);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dragActive, setDragActive] = useState(false);

    // Build base URL
    const baseUrl = isSuperAdmin()
        ? '/super-admin'
        : (organization_slug ? `/organization/${organization_slug}/admin` : '/admin');

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file: File) => {
        // Check extension
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
        // Extensions check as fallback for some browsers/OS reporting weird mime types
        const validExtensions = ['xlsx', 'xls', 'csv'];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (validTypes.includes(file.type) || (extension && validExtensions.includes(extension))) {
            setContactedFile(file);
            if (errors.file) {
                const newErrors = { ...errors };
                delete newErrors.file;
                setErrors(newErrors);
            }
        } else {
            setErrors({ ...errors, file: 'Invalid file type. Please upload .xlsx, .xls, or .csv.' });
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!contactedFile) {
            setErrors({ ...errors, file: 'Please select a file to upload.' });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        const formData = new FormData();
        formData.append('file', contactedFile);

        // Determine role/permission logic (similar to single invite)
        if (selectedRole === Role.ADMIN) {
            formData.append('role', Role.ADMIN);
        } else if (selectedRole === Role.USER) {
            formData.append('role', Role.USER);
        } else {
            // It's a permission group ID
            const groupId = parseInt(selectedRole);
            if (!isNaN(groupId)) {
                formData.append('role', Role.USER);
                formData.append('permission_group_ids[]', groupId.toString());
            }
        }

        router.post(`${baseUrl}/invitations/bulk`, formData, {
            forceFormData: true,
            onSuccess: () => {
                onClose();
                setContactedFile(null);
            },
            onError: (errs: any) => {
                setErrors(errs);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setContactedFile(null);
            setErrors({});
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Bulk Invite Users</h3>
                            <p className="text-xs text-muted-foreground">Upload an Excel file to invite multiple users</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* File Upload Area */}
                    <div className="space-y-2">
                        <Label>Upload File</Label>
                        <div
                            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                                } ${errors.file ? 'border-destructive/50 bg-destructive/5' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={handleFileChange}
                                disabled={isSubmitting}
                            />

                            {contactedFile ? (
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{contactedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">{(contactedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 h-8 text-xs text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setContactedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        Remove file
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <UploadCloud className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        Click or drag file to upload
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Supports .xlsx, .xls, .csv
                                    </p>
                                </div>
                            )}
                        </div>
                        {errors.file && <p className="text-xs text-destructive">{errors.file}</p>}
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Example: Column 'email' required.</span>
                            <a href={`${baseUrl}/invitations/bulk/template`} target="_blank" className="underline hover:text-primary">Download Template</a>
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-3">
                        <Label>Assign Role</Label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            disabled={isSubmitting}
                        >
                            <option value={Role.USER}>User (Default)</option>
                            <option value={Role.ADMIN}>Admin</option>
                            {permissionGroups.map(group => (
                                <option key={group.id} value={group.id.toString()}>
                                    {group.label} (Group)
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                            All users in this file will be assigned this role.
                        </p>
                    </div>

                    {/* Error Message */}
                    {errors.general && (
                        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p>{errors.general}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !contactedFile}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Upload & Invite'
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
