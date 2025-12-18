import { useState, FormEvent } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, Mail, UserPlus, Loader2, Plus, Trash2, Shield, ShieldCheck, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PermissionGroup {
  id: number;
  name: string;
  label: string;
  scope: 'system' | 'client';
  description?: string;
}

interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionGroups?: PermissionGroup[];
}

import { Role } from '@/types/role';
import { useRole } from '@/components/role-guard';

export function InviteUsersModal({ isOpen, onClose, permissionGroups = [] }: InviteUsersModalProps) {
  const { organization_slug } = usePage<{ organization_slug?: string }>().props;
  const { isSuperAdmin } = useRole();
  const [inviteType, setInviteType] = useState<'user' | 'client'>('user');

  // System User Form State
  const [selectedRole, setSelectedRole] = useState<string>(Role.USER);
  const [emails, setEmails] = useState<string[]>(['']);

  // Client Provisioning Form State
  const [clientForm, setClientForm] = useState({
    company_name: '',
    slug: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build base URL for tenant context
  const baseUrl = isSuperAdmin
    ? '/super-admin'
    : (organization_slug ? `/organization/${organization_slug}/admin` : '/admin');

  if (!isOpen) return null;

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    // Clear error for this field
    if (errors[`emails.${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`emails.${index}`];
      setErrors(newErrors);
    }
  };

  const addEmailField = () => {
    if (emails.length < 50) {
      setEmails([...emails, '']);
    }
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    if (inviteType === 'user') {
      // Filter out empty emails
      const validEmails = emails.filter(email => email.trim() !== '');

      if (validEmails.length === 0) {
        setErrors({ general: 'Please enter at least one email address.' });
        setIsSubmitting(false);
        return;
      }

      // Determine actual role and permission group IDs
      let role = Role.USER; // Default to user
      let permission_group_ids: number[] = [];

      if (selectedRole === Role.ADMIN) {
        role = Role.ADMIN;
      } else if (selectedRole === Role.USER) {
        role = Role.USER;
      } else {
        // It's a permission group ID
        const groupId = parseInt(selectedRole);
        if (!isNaN(groupId)) {
          role = Role.USER; // Base role is user
          permission_group_ids = [groupId];
        }
      }

      router.post(
        `${baseUrl}/invitations`,
        { emails: validEmails, role, permission_group_ids },
        {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            setEmails(['']);
            // Keep role selection or reset it? Let's keep it to allow mass invite with same role.
          },
          onError: (errors) => {
            setErrors(errors);
          },
          onFinish: () => {
            setIsSubmitting(false);
          },
        }
      );
    } else {
      // Client Provisioning
      router.post('/super-admin/onboarding', clientForm, {
        onSuccess: () => {
          onClose();
          // Reset form
          setClientForm({
            company_name: '',
            slug: '',
            admin_name: '',
            admin_email: '',
            admin_phone: '',
          });
        },
        onError: (errors) => {
          setErrors(errors);
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmails(['']);
      setErrors({});
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Invite Users</h3>
              <p className="text-xs text-muted-foreground">Send invitations to join your workspace</p>
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

        {/* Body */}
        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto p-6">

            {/* Invite Type Toggle (Super Admin Only) */}
            {isSuperAdmin() && (
              <div className="mb-6 flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setInviteType('user')}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${inviteType === 'user'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  System User
                </button>
                <button
                  type="button"
                  onClick={() => setInviteType('client')}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${inviteType === 'client'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  New Client
                </button>
              </div>
            )}

            {inviteType === 'user' ? (
              <div className="space-y-4">

                {/* Role Selection Cards */}
                <div className="space-y-3">
                  <Label>Select Role</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Standard Roles */}
                    <div
                      onClick={() => setSelectedRole(Role.USER)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-primary/5 ${selectedRole === Role.USER
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'bg-card'
                        }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium">User</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Basic access to view content and participate.
                      </p>
                    </div>

                    <div
                      onClick={() => setSelectedRole(Role.ADMIN)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-primary/5 ${selectedRole === Role.ADMIN
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'bg-card'
                        }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Admin</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Full access to manage the organization.
                      </p>
                    </div>

                    {/* System Roles (Super Admin Only) */}
                    {permissionGroups
                      .filter(g => g.scope === 'system')
                      .map(group => (
                        <div
                          key={group.id}
                          onClick={() => setSelectedRole(group.id.toString())}
                          className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-primary/5 ${selectedRole === group.id.toString()
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'bg-card'
                            }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{group.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {group.description || 'Specific system permission.'}
                          </p>
                        </div>
                      ))}

                    {/* Client Roles */}
                    {permissionGroups
                      .filter(g => g.scope === 'client')
                      .map(group => (
                        <div
                          key={group.id}
                          onClick={() => setSelectedRole(group.id.toString())}
                          className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-primary/5 ${selectedRole === group.id.toString()
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'bg-card'
                            }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <Users className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{group.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {group.description || 'Specific client role.'}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <Label className="text-sm font-medium">Email Addresses</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter email addresses of users you want to invite (max 50)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmailField}
                    disabled={emails.length >= 50 || isSubmitting}
                    className="shrink-0"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Email
                  </Button>
                </div>

                {/* General Error */}
                {errors.general && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {errors.general}
                  </div>
                )}

                {/* Emails Error */}
                {errors.emails && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {errors.emails}
                  </div>
                )}

                {/* Email Fields */}
                <div className="space-y-3">
                  {emails.map((email, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder={`user${index + 1}@example.com`}
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            disabled={isSubmitting}
                            className={`pl-10 ${errors[`emails.${index}`] ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          />
                        </div>
                        {errors[`emails.${index}`] && (
                          <p className="text-xs text-destructive mt-1">{errors[`emails.${index}`]}</p>
                        )}
                      </div>
                      {emails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmailField(index)}
                          disabled={isSubmitting}
                          className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Info Box */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                  <p className="font-medium mb-1">📧 What happens next?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Invitations will be sent to the provided email addresses</li>
                    <li>• Users will receive a link to create their account</li>
                    <li>• Invitation links expire after 7 days</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Organization Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={clientForm.company_name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setClientForm({
                          ...clientForm,
                          company_name: name,
                          slug: name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
                        });
                      }}
                      required
                    />
                    {errors.company_name && <p className="text-sm text-destructive">{errors.company_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Portal Domain (Slug)</Label>
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                        /organization/
                      </span>
                      <Input
                        id="slug"
                        value={clientForm.slug}
                        onChange={(e) => setClientForm({ ...clientForm, slug: e.target.value })}
                        className="rounded-l-none"
                        required
                      />
                    </div>
                    {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                  </div>
                </div>

                {/* Admin Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_name">Admin Full Name</Label>
                    <Input
                      id="admin_name"
                      value={clientForm.admin_name}
                      onChange={(e) => setClientForm({ ...clientForm, admin_name: e.target.value })}
                      required
                    />
                    {errors.admin_name && <p className="text-sm text-destructive">{errors.admin_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={clientForm.admin_email}
                      onChange={(e) => setClientForm({ ...clientForm, admin_email: e.target.value })}
                      required
                    />
                    {errors.admin_email && <p className="text-sm text-destructive">{errors.admin_email}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/30 px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {inviteType === 'client' ? 'Provisioning...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    {inviteType === 'client' ? <Plus className="mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4" />}
                    {inviteType === 'client' ? 'Provision Tenant' : 'Send Invites'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
