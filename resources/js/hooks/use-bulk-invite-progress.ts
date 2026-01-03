import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export interface ProgressData {
    total: number;
    queued?: number;
    sent?: number;
    processed: number;
    status: 'idle' | 'processing' | 'sending' | 'completed';
}

const BULK_INVITE_ACTIVE_KEY = 'bulk_invite_active';
const BULK_INVITE_EVENT = 'bulk-invite-triggered';
const MAX_IDLE_RETRIES = 5;

/**
 * Call this to trigger the progress widget immediately after submitting bulk invite
 */
export function triggerBulkInviteProgress() {
    sessionStorage.setItem(BULK_INVITE_ACTIVE_KEY, 'true');
    window.dispatchEvent(new CustomEvent(BULK_INVITE_EVENT));
}

export function useBulkInviteProgress() {
    const { organization_slug } = usePage<{ organization_slug?: string }>().props;
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [pollKey, setPollKey] = useState(0);
    const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const idleCountRef = useRef<number>(0);
    const hasSeenProgressRef = useRef<boolean>(false);

    const baseUrl = organization_slug
        ? `/organization/${organization_slug}/admin`
        : '/admin';

    const clearProgress = useCallback(async () => {
        if (autoDismissTimerRef.current) {
            clearTimeout(autoDismissTimerRef.current);
            autoDismissTimerRef.current = null;
        }
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        try {
            await axios.delete(`${baseUrl}/invitations/bulk/progress`);
        } catch (error) {
            // Ignore errors
        }
        sessionStorage.removeItem(BULK_INVITE_ACTIVE_KEY);
        setIsVisible(false);
        setProgress(null);
        idleCountRef.current = 0;
        hasSeenProgressRef.current = false;
    }, [baseUrl]);

    const dismiss = useCallback(() => {
        clearProgress();
    }, [clearProgress]);

    // Listen for trigger event
    useEffect(() => {
        const handleTrigger = () => {
            idleCountRef.current = 0;
            hasSeenProgressRef.current = false;
            setIsVisible(true);
            setProgress({ total: 0, processed: 0, status: 'processing' });
            setPollKey(prev => prev + 1);
        };
        window.addEventListener(BULK_INVITE_EVENT, handleTrigger);
        return () => window.removeEventListener(BULK_INVITE_EVENT, handleTrigger);
    }, []);

    // Check on mount for active session
    useEffect(() => {
        if (sessionStorage.getItem(BULK_INVITE_ACTIVE_KEY) === 'true') {
            setIsVisible(true);
            setProgress({ total: 0, processed: 0, status: 'processing' });
            setPollKey(prev => prev + 1);
        }
    }, []);

    // Polling effect
    useEffect(() => {
        if (!isVisible) return;

        const checkProgress = async () => {
            try {
                const response = await axios.get(`${baseUrl}/invitations/bulk/progress`);
                const data = response.data;

                if (data.status === 'processing' || data.status === 'sending') {
                    idleCountRef.current = 0;
                    hasSeenProgressRef.current = true;
                    setProgress(data);
                } else if (data.status === 'completed') {
                    idleCountRef.current = 0;
                    hasSeenProgressRef.current = true;
                    setProgress(data);
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                    if (!autoDismissTimerRef.current) {
                        autoDismissTimerRef.current = setTimeout(() => clearProgress(), 5000);
                    }
                } else if (data.status === 'idle') {
                    idleCountRef.current += 1;
                    if (hasSeenProgressRef.current || idleCountRef.current >= MAX_IDLE_RETRIES) {
                        sessionStorage.removeItem(BULK_INVITE_ACTIVE_KEY);
                        setIsVisible(false);
                        setProgress(null);
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch progress', error);
            }
        };

        pollingIntervalRef.current = setInterval(checkProgress, 1500);
        checkProgress();

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
        };
    }, [baseUrl, clearProgress, pollKey, isVisible]);

    return { progress, isVisible, dismiss };
}

