import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const { url } = usePage<{ url: string }>().props;

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Dynamic breadcrumbs based on current URL
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Password settings',
            href: url || '/settings/password',
        },
    ];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const formData = new FormData(e.currentTarget);

        router.put(url || '/settings/password', Object.fromEntries(formData), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Password updated successfully');
                formRef.current?.reset();
                setProcessing(false);
            },
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                if (errors.password) {
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    currentPasswordInput.current?.focus();
                }
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} scrollable={false}>
            <Head title="Password settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Update password"
                        description="Ensure your account is using a long, random password to stay secure"
                    />

                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">
                                Current password
                            </Label>

                            <Input
                                id="current_password"
                                ref={currentPasswordInput}
                                name="current_password"
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                placeholder="Current password"
                            />

                            <InputError
                                message={errors.current_password}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                New password
                            </Label>

                            <Input
                                id="password"
                                ref={passwordInput}
                                name="password"
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                placeholder="New password"
                            />

                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
                            </Label>

                            <Input
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                placeholder="Confirm password"
                            />

                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                type="submit"
                                disabled={processing}
                                data-test="update-password-button"
                            >
                                {processing ? 'Saving...' : 'Save password'}
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

