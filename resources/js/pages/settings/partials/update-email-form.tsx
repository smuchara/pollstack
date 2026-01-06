import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { send } from '@/routes/verification';
import { SharedData } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';

export default function UpdateEmailForm({ className }: { className?: string }) {
    const { auth, mustVerifyEmail, status } = usePage<SharedData & { mustVerifyEmail: boolean; status?: string }>().props;
    const user = auth.user;

    const { data, setData, patch, errors, processing } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Email updated successfully');
            },
        });
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="grid gap-2 flex-1 w-full">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            className="mt-1 block w-full bg-background"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="Email address"
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    <Button type="submit" disabled={processing} variant="secondary">
                        {processing ? 'Saving...' : 'Change email'}
                    </Button>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="-mt-4 text-sm text-muted-foreground">
                            Your email address is unverified.{' '}
                            <Link
                                href={send()}
                                as="button"
                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500"
                            >
                                Click here to resend the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}
            </form>
        </section>
    );
}
