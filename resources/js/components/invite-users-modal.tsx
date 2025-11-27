import { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { X, Mail, UserPlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteUsersModal({ isOpen, onClose }: InviteUsersModalProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Filter out empty emails
    const validEmails = emails.filter(email => email.trim() !== '');

    if (validEmails.length === 0) {
      setErrors({ general: 'Please enter at least one email address.' });
      return;
    }

    setIsSubmitting(true);

    router.post(
      '/admin/invitations',
      { emails: validEmails },
      {
        preserveScroll: true,
        onSuccess: () => {
          onClose();
          setEmails(['']);
        },
        onError: (errors) => {
          setErrors(errors);
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      }
    );
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
        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto p-6">
            <div className="space-y-4">
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
                  <li>• Users will be assigned the default "User" role</li>
                </ul>
              </div>
            </div>
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invites
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
