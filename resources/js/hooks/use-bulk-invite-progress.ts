import { useState, useEffect } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export interface ProgressData {
    total: number;
    processed: number;
    status: 'idle' | 'processing' | 'completed';
}

export function useBulkInviteProgress() {
    const { organization_slug } = usePage<{ organization_slug?: string }>().props;
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkProgress = async () => {
            try {
                // Use manual URL construction as Ziggy is not available
                // If organization_slug exists, use tenant route, otherwise admin (though this feature is tenant only)
                const baseUrl = organization_slug
                    ? `/organization/${organization_slug}/admin`
                    : '/admin';

                const url = `${baseUrl}/invitations/bulk/progress`;

                const response = await axios.get(url);
                const data = response.data;
                console.log('Bulk Invite Progress:', data);

                if (data.status !== 'idle') {
                    setProgress(data);
                    setIsVisible(true);

                    // If completed, we can stop polling after a short delay or just let the user dismiss
                    if (data.status === 'completed') {
                        // Keep visible for a moment? Or just rely on user closing it. 
                        // We will stop polling if we reached 100% and showed it? 
                        // Actually, if we stop polling, we won't know if another job starts. 
                        // But usually bulk invite is manual.
                        // Let's keep polling but maybe slower? 
                        // For now, consistent polling.
                    }
                } else {
                    // If we were visible and now idle, maybe the cache expired or job finished long ago.
                    if (isVisible && progress?.status === 'completed') {
                        // stay visible until dismissed
                    } else {
                        setIsVisible(false);
                        setProgress(null);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch progress', error);
            }
        };

        // Poll every 2 seconds
        intervalId = setInterval(checkProgress, 2000);
        checkProgress(); // Initial check

        return () => clearInterval(intervalId);
    }, [isVisible]); // depend on isVisible to maybe adjust polling rate? Simplified for now.

    const dismiss = () => {
        setIsVisible(false);
        // Optionally tell backend to clear cache? Not necessary.
    };

    return { progress, isVisible, dismiss };
}
