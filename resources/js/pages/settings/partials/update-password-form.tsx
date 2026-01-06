import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react'; // Using useForm helper for better form handling
import { useRef } from 'react';
import toast from 'react-hot-toast';

export default function UpdatePasswordForm() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, put, errors, processing, reset, clearErrors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Use the existing route defined in routes/settings.php
        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Password updated successfully');
                reset();
                clearErrors();
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className="space-y-6">
            {/* Header is handled by parent or visually separated */}

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="current_password">Current password</Label>
                    <Input
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        placeholder="Current password"
                    />
                    <InputError message={errors.current_password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                        id="password"
                        ref={passwordInput} // Focus here on error
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        placeholder="New password"
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">Confirm password</Label>
                    <Input
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        placeholder="Confirm password"
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing} variant="secondary">
                        {/* Design shows 'Change password' button, maybe variant outline or secondary? Using secondary for now */}
                        {processing ? 'Saving...' : 'Change password'}
                    </Button>
                </div>
            </form>
        </section>
    );
}
