import { ConfirmPasswordDialog } from '@/components/confirm-password-dialog';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Maybe use switch for toggle look? Or stick to buttons as state management is complex
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function TwoFactorAuthenticationForm({ requiresConfirmation, twoFactorEnabled }: { requiresConfirmation: boolean, twoFactorEnabled: boolean }) {
    // We already have props passed in.
    const [processingEnable, setProcessingEnable] = useState(false);
    const [processingDisable, setProcessingDisable] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

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
        setShowPasswordDialog(true);
    };

    const handlePasswordConfirmed = () => {
        setProcessingEnable(true);
        axios.post('/user/two-factor-authentication')
            .then(() => {
                setShowSetupModal(true);
            })
            .catch(() => { })
            .finally(() => {
                setProcessingEnable(false);
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
        <section className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                <div className="space-y-0.5">
                    <Label className="text-base">2-Step Verification</Label>
                    <p className="text-sm text-muted-foreground">
                        Add an additional layer of security to your account during login.
                    </p>
                </div>
                <div>
                    {/* Toggle approach if using switch, but logic is async and complex.
                        Better to keep buttons for now to ensure reliability, or standard UI.
                        Design Image 1 shows a Switch (Toggle).
                        If I use a Switch:
                        checked={twoFactorEnabled}
                        onCheckedChange={(checked) => checked ? handleEnableClick() : handleDisable()}
                      */}
                    {/* However, disabling might require confirmation? Standard Fortify just disables.
                         Enabling requires flow.
                         I'll try using the Switch for the premium look.
                      */}

                    {twoFactorEnabled ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground mr-2">Enabled</span>
                            <Switch checked={true} onCheckedChange={handleDisable} disabled={processingDisable} />
                        </div>
                    ) : (
                        <Switch checked={false} onCheckedChange={handleEnableClick} disabled={processingEnable} />
                    )}
                </div>
            </div>

            {/* If enabled, show recovery codes or extra options */}
            {twoFactorEnabled && (
                <div className="px-4">
                    <TwoFactorRecoveryCodes
                        recoveryCodesList={recoveryCodesList}
                        fetchRecoveryCodes={fetchRecoveryCodes}
                        errors={errors}
                    />
                </div>
            )}

            {/* Setup Continuation */}
            {!twoFactorEnabled && hasSetupData && (
                <div className="px-4">
                    <Button onClick={() => setShowSetupModal(true)} variant="outline" size="sm">
                        Continue Setup
                    </Button>
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
        </section>
    );
}
