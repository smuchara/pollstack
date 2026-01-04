import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import axios, { AxiosError } from 'axios';
import { useState } from 'react';

interface ConfirmPasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmed: () => void;
    title?: string;
    description?: string;
}

export function ConfirmPasswordDialog({
    isOpen,
    onClose,
    onConfirmed,
    title = 'Confirm your password',
    description = 'For your security, please confirm your password to continue.',
}: ConfirmPasswordDialogProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setProcessing(true);

        axios.post('/user/confirm-password', { password })
            .then(() => {
                setPassword('');
                setError(null);
                onClose();
                onConfirmed();
            })
            .catch((error: AxiosError<{ errors?: { password?: string[] } }>) => {
                if (error.response?.data?.errors?.password) {
                    setError(error.response.data.errors.password[0]);
                } else {
                    setError('The password is incorrect.');
                }
            })
            .finally(() => {
                setProcessing(false);
            });
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setPassword('');
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                autoFocus
                            />
                            {error && <InputError message={error} />}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || !password}>
                            {processing && <Spinner className="mr-2" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
