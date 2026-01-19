import axios from 'axios';
import {
    AlertCircle,
    Check,
    Clock,
    Copy,
    Loader2,
    Maximize2,
    QrCode,
    RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface QrTokenData {
    success: boolean;
    token: string;
    verification_url: string;
    expires_at: string;
    remaining_seconds: number;
}

interface QrCodeDisplayProps {
    /** The poll ID */
    pollId: number;
    /** Organization slug for tenant routes */
    organizationSlug?: string;
    /** Poll question for display */
    pollQuestion?: string;
    /** Whether to auto-refresh the QR code */
    autoRefresh?: boolean;
    /** Refresh interval in seconds (default: 90) */
    refreshInterval?: number;
}

/**
 * QrCodeDisplay - Component for displaying and managing presence verification QR codes.
 * Used by poll admins to display at venues for on-premise verification.
 */
export function QrCodeDisplay({
    pollId,
    organizationSlug,
    pollQuestion,
    autoRefresh = true,
}: QrCodeDisplayProps) {
    const [qrData, setQrData] = useState<QrTokenData | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Generate QR code URL endpoint
    const generateEndpoint = organizationSlug
        ? `/organization/${organizationSlug}/admin/polls/${pollId}/presence/generate-qr`
        : `/admin/polls/${pollId}/presence/generate-qr`;

    // Fetch/generate QR token
    const generateQrToken = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(generateEndpoint);

            if (response.data.success) {
                setQrData(response.data);
                setRemainingTime(response.data.remaining_seconds);

                // Generate QR code image
                const qrCodeDataUrl = await QRCode.toDataURL(
                    response.data.verification_url,
                    {
                        width: 400,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#ffffff',
                        },
                    },
                );
                setQrCodeUrl(qrCodeDataUrl);
            } else {
                setError(response.data.message || 'Failed to generate QR code');
            }
        } catch (err: unknown) {
            let message = 'Failed to generate QR code';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [generateEndpoint]);

    // Countdown timer
    useEffect(() => {
        if (remainingTime <= 0) return;

        const timer = setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    if (autoRefresh) {
                        generateQrToken();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [remainingTime, autoRefresh, generateQrToken]);

    // Auto-refresh before expiry
    useEffect(() => {
        if (!autoRefresh || !qrData) return;

        // Refresh when 10 seconds remaining
        if (remainingTime === 10) {
            generateQrToken();
        }
    }, [remainingTime, autoRefresh, qrData, generateQrToken]);

    // Copy token to clipboard
    const handleCopy = async () => {
        if (!qrData?.token) return;

        try {
            await navigator.clipboard.writeText(qrData.token);
            setCopied(true);
            toast.success('Token copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy token');
        }
    };

    // Format remaining time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Determine urgency level
    const getUrgencyLevel = () => {
        if (remainingTime <= 10) return 'critical';
        if (remainingTime <= 30) return 'warning';
        return 'normal';
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <QrCode className="h-5 w-5" />
                            Presence Verification QR Code
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Display this QR code at the venue for attendees to
                            scan
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Auto-refresh
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {error ? (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                            <p className="font-medium text-destructive">
                                {error}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                This poll may not support on-premise
                                verification.
                            </p>
                        </div>
                        <Button
                            onClick={generateQrToken}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Try Again
                        </Button>
                    </div>
                ) : qrCodeUrl ? (
                    <div className="space-y-6">
                        {/* QR Code Display */}
                        <div className="flex flex-col items-center">
                            <div className="relative rounded-2xl border-4 border-primary/20 bg-white p-4 shadow-lg">
                                <img
                                    src={qrCodeUrl}
                                    alt="Verification QR Code"
                                    className="h-64 w-64"
                                />

                                {/* Timer overlay */}
                                <div
                                    className={`absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-medium shadow-lg ${
                                        getUrgencyLevel() === 'critical'
                                            ? 'animate-pulse bg-red-500 text-white'
                                            : getUrgencyLevel() === 'warning'
                                              ? 'bg-orange-500 text-white'
                                              : 'bg-green-500 text-white'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatTime(remainingTime)}
                                    </span>
                                </div>
                            </div>

                            {/* Fullscreen button */}
                            <Dialog
                                open={isFullscreen}
                                onOpenChange={setIsFullscreen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-6 gap-2"
                                    >
                                        <Maximize2 className="h-4 w-4" />
                                        Fullscreen Display
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="h-[90vh] max-w-[90vw]">
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-2xl">
                                            Scan to Verify Presence
                                        </DialogTitle>
                                        {pollQuestion && (
                                            <DialogDescription className="text-center text-lg">
                                                {pollQuestion}
                                            </DialogDescription>
                                        )}
                                    </DialogHeader>
                                    <div className="flex flex-1 flex-col items-center justify-center">
                                        <div className="rounded-3xl border-8 border-primary/20 bg-white p-8 shadow-2xl">
                                            <img
                                                src={qrCodeUrl}
                                                alt="Verification QR Code"
                                                className="h-[50vh] w-[50vh] max-w-full"
                                            />
                                        </div>
                                        <div
                                            className={`mt-8 rounded-full px-8 py-3 text-xl font-bold ${
                                                getUrgencyLevel() === 'critical'
                                                    ? 'animate-pulse bg-red-500 text-white'
                                                    : getUrgencyLevel() ===
                                                        'warning'
                                                      ? 'bg-orange-500 text-white'
                                                      : 'bg-green-500 text-white'
                                            }`}
                                        >
                                            {formatTime(remainingTime)}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Token display */}
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Manual Token Entry
                                    </p>
                                    <p className="mt-1 truncate font-mono text-xs">
                                        {qrData?.token}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="shrink-0 gap-1.5"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-3.5 w-3.5" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={generateQrToken}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Generate New Code
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <QrCode className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Generate QR Code</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Click below to generate a verification QR code
                                for this poll
                            </p>
                        </div>
                        <Button
                            onClick={generateQrToken}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <QrCode className="h-4 w-4" />
                            )}
                            Generate QR Code
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default QrCodeDisplay;
