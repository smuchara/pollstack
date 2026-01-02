import { ConfirmPasswordDialog } from '@/components/confirm-password-dialog';
import HeadingSmall from '@/components/heading-small';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface TwoFactorProps {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
}

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: TwoFactorProps) {
    const { url } = usePage<{ url: string }>().props;
    const [processingEnable, setProcessingEnable] = useState(false);
    const [processingDisable, setProcessingDisable] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Two-Factor Authentication',
            href: url || '/settings/two-factor',
        },
    ];

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    const handleEnableClick = () => {
        // Show password confirmation dialog first
        setShowPasswordDialog(true);
    };

    const handlePasswordConfirmed = () => {
        // Password confirmed, now enable 2FA
        setProcessingEnable(true);
        router.post('/user/two-factor-authentication', {}, {
            preserveScroll: true,
            onSuccess: () => {
                setShowSetupModal(true);
            },
            onFinish: () => {
                setProcessingEnable(false);
            },
        });
    };

    const handleDisable = () => {
        setProcessingDisable(true);
        router.delete('/user/two-factor-authentication', {
            preserveScroll: true,
            onFinish: () => {
                setProcessingDisable(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two-Factor Authentication" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Two-Factor Authentication"
                        description="Manage your two-factor authentication settings"
                    />
                    {twoFactorEnabled ? (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <Badge variant="default">Enabled</Badge>
                            <p className="text-muted-foreground">
                                With two-factor authentication enabled, you will
                                be prompted for a secure, random pin during
                                login, which you can retrieve from the
                                TOTP-supported application on your phone.
                            </p>

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={recoveryCodesList}
                                fetchRecoveryCodes={fetchRecoveryCodes}
                                errors={errors}
                            />

                            <div className="relative inline">
                                <Button
                                    variant="destructive"
                                    type="button"
                                    disabled={processingDisable}
                                    onClick={handleDisable}
                                >
                                    <ShieldBan /> {processingDisable ? 'Disabling...' : 'Disable 2FA'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <Badge variant="destructive">Disabled</Badge>
                            <p className="text-muted-foreground">
                                When you enable two-factor authentication, you
                                will be prompted for a secure pin during login.
                                This pin can be retrieved from a TOTP-supported
                                application on your phone.
                            </p>

                            <div>
                                {hasSetupData ? (
                                    <Button
                                        onClick={() => setShowSetupModal(true)}
                                    >
                                        <ShieldCheck />
                                        Continue Setup
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        disabled={processingEnable}
                                        onClick={handleEnableClick}
                                    >
                                        <ShieldCheck />
                                        {processingEnable ? 'Enabling...' : 'Enable 2FA'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                    />

                    <ConfirmPasswordDialog
                        isOpen={showPasswordDialog}
                        onClose={() => setShowPasswordDialog(false)}
                        onConfirmed={handlePasswordConfirmed}
                        title="Confirm your password"
                        description="For your security, please confirm your password to enable two-factor authentication."
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

