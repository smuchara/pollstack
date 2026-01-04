import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import ProfilePhotoForm from './profile-photo-form';
import TwoFactorAuthenticationForm from './partials/two-factor-authentication-form';
import UpdateEmailForm from './partials/update-email-form';
import UpdatePasswordForm from './partials/update-password-form';
import UpdateProfileInformationForm from './partials/update-profile-information-form';

interface ProfileProps {
    mustVerifyEmail: boolean;
    status?: string;
    twoFactorEnabled: boolean;
    requiresConfirmation: boolean;
}

export default function Profile({
    mustVerifyEmail,
    status,
    twoFactorEnabled,
    requiresConfirmation,
}: ProfileProps) {
    const { auth, url } = usePage<SharedData & { url: string }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Account Settings',
            href: url || '/settings/profile',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} scrollable={false}>
            <Head title="Account Settings" />

            <SettingsLayout>
                <div className="space-y-10">
                    {/* My Profile Section */}
                    <div className="space-y-6">
                        <HeadingSmall title="My Profile" />
                        <div className="flex flex-col gap-6">
                            <ProfilePhotoForm user={auth.user} />
                            <UpdateProfileInformationForm />
                        </div>
                    </div>

                    <Separator />

                    {/* Account Security Section */}
                    <div className="space-y-6">
                        <HeadingSmall title="Account Security" />
                        <div className="space-y-8">
                            <UpdateEmailForm />
                            <UpdatePasswordForm />
                            <TwoFactorAuthenticationForm
                                requiresConfirmation={requiresConfirmation}
                                twoFactorEnabled={twoFactorEnabled}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Support Access Section */}
                    <div className="space-y-6">
                        <HeadingSmall title="Support Access" />
                        <div className="space-y-6">
                            <DeleteUser />
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

