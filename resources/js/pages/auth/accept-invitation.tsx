import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock, Lock, Mail, User } from 'lucide-react';
import { FormEvent, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';

interface Invitation {
    token: string;
    email: string;
    name?: string;
    role: string;
    inviter: {
        name: string;
    };
    expires_at: string;
}

interface Props {
    invitation: Invitation;
}

export default function AcceptInvitation({ invitation }: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        name: invitation.name || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(`/invitations/accept/${invitation.token}`, formData, {
            onError: (errors) => {
                setErrors(errors);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    // Calculate time remaining on component mount
    const [timeRemaining] = useState(() => {
        const expiresAt = new Date(invitation.expires_at);
        return Math.ceil(
            (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
    });

    return (
        <AuthSplitLayout
            title="Accept Your Invitation"
            description={`${invitation.inviter.name} has invited you to join BoardCo`}
        >
            <Head title="Accept Invitation" />

            {/* Invitation Info Card */}
            <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                You've been invited!
                            </p>
                            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                Create your account to join as a{' '}
                                <span className="font-semibold capitalize">
                                    {invitation.role}
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                            <Clock className="h-3 w-3" />
                            <span>
                                Expires in {timeRemaining}{' '}
                                {timeRemaining === 1 ? 'day' : 'days'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    {/* Email (Read-only) */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                value={invitation.email}
                                disabled
                                className="bg-muted/50 pl-10"
                            />
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            This email will be automatically verified
                        </p>
                    </div>

                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                            <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className="pl-10"
                                disabled={processing}
                            />
                        </div>
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    {/* Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={2}
                                autoComplete="new-password"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                className="pl-10"
                                disabled={processing}
                            />
                        </div>
                        <InputError
                            message={errors.password}
                            className="mt-1"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                                value={formData.password_confirmation}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password_confirmation: e.target.value,
                                    })
                                }
                                className="pl-10"
                                disabled={processing}
                            />
                        </div>
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-1"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={4}
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Create Account & Join
                    </Button>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href="/login" tabIndex={5}>
                        Log in instead
                    </TextLink>
                </div>
            </form>
        </AuthSplitLayout>
    );
}
