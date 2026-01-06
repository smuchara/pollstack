import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import toast from 'react-hot-toast';

export default function UpdateProfileInformationForm({ className }: { className?: string }) {
    const user = usePage<SharedData>().props.auth.user;

    const { data, setData, patch, errors, processing } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile updated successfully');
            },
        });
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        className="mt-1 block w-full bg-background"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                        placeholder="Full name"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing} variant="outline">
                        {processing ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </form>
        </section>
    );
}
