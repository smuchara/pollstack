import { qrCode, recoveryCodes, secretKey } from '@/routes/two-factor';
import axios from 'axios';
import { useCallback, useMemo, useState } from 'react';

interface TwoFactorSetupData {
    svg: string;
    url: string;
}

interface TwoFactorSecretKey {
    secretKey: string;
}

export const OTP_MAX_LENGTH = 6;

export const useTwoFactorAuth = () => {
    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const hasSetupData = useMemo<boolean>(
        () => qrCodeSvg !== null && manualSetupKey !== null,
        [qrCodeSvg, manualSetupKey],
    );

    const fetchQrCode = useCallback(async (): Promise<void> => {
        try {
            const { data } = await axios.get<TwoFactorSetupData>(qrCode.url());
            setQrCodeSvg(data.svg);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch QR code']);
            setQrCodeSvg(null);
        }
    }, []);

    const fetchSetupKey = useCallback(async (): Promise<void> => {
        try {
            const { data } = await axios.get<TwoFactorSecretKey>(
                secretKey.url(),
            );
            setManualSetupKey(data.secretKey);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch a setup key']);
            setManualSetupKey(null);
        }
    }, []);

    const clearErrors = useCallback((): void => {
        setErrors([]);
    }, []);

    const clearSetupData = useCallback((): void => {
        setManualSetupKey(null);
        setQrCodeSvg(null);
        clearErrors();
    }, [clearErrors]);

    const fetchRecoveryCodes = useCallback(async (): Promise<void> => {
        try {
            clearErrors();
            const { data } = await axios.get<string[]>(recoveryCodes.url());
            setRecoveryCodesList(data);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch recovery codes']);
            setRecoveryCodesList([]);
        }
    }, [clearErrors]);

    const fetchSetupData = useCallback(async (): Promise<void> => {
        try {
            clearErrors();
            await Promise.all([fetchQrCode(), fetchSetupKey()]);
        } catch {
            setQrCodeSvg(null);
            setManualSetupKey(null);
        }
    }, [clearErrors, fetchQrCode, fetchSetupKey]);

    return {
        qrCodeSvg,
        manualSetupKey,
        recoveryCodesList,
        hasSetupData,
        errors,
        clearErrors,
        clearSetupData,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
    };
};
