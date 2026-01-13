import { useState, useEffect, useRef } from 'react';
import { Laptop, MapPin, QrCode, Check, AlertCircle, Loader2, Camera, Keyboard } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type VotingAccessMode = 'remote_only' | 'on_premise_only' | 'hybrid';

export interface PresenceVerificationGateProps {
    /** The poll ID */
    pollId: number;
    /** The voting access mode for the poll */
    votingAccessMode: VotingAccessMode;
    /** Whether the user has already verified on-premise */
    isVerified: boolean;
    /** The verification type if already verified */
    verificationType?: 'remote' | 'on_premise' | null;
    /** Callback when verification status changes */
    onVerificationChange?: (verified: boolean, type: 'remote' | 'on_premise') => void;
    /** Callback when user chooses to proceed (vote button) */
    onProceed: (verificationType: 'remote' | 'on_premise') => void;
    /** Whether voting is disabled */
    disabled?: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Children to render when verification gating is not needed */
    children: React.ReactNode;
}

/**
 * PresenceVerificationGate - Component that gates voting based on presence verification requirements.
 * 
 * Shows different UIs based on the poll's voting access mode:
 * - Remote Only: Passes through directly (no gate)
 * - On-Premise Only: Requires QR verification before showing voting options
 * - Hybrid: Shows choice between remote voting and on-premise verification
 */
export function PresenceVerificationGate({
    pollId,
    votingAccessMode,
    isVerified,
    verificationType,
    onVerificationChange,
    onProceed,
    disabled = false,
    isLoading = false,
    children,
}: PresenceVerificationGateProps) {
    const [showQrModal, setShowQrModal] = useState(false);
    const [hasChosen, setHasChosen] = useState(false);
    const [chosenMode, setChosenMode] = useState<'remote' | 'on_premise' | null>(null);

    // Remote only - no gate needed
    if (votingAccessMode === 'remote_only') {
        return <>{children}</>;
    }

    // On-premise only - must be verified
    if (votingAccessMode === 'on_premise_only') {
        if (!isVerified) {
            return (
                <>
                    <OnPremiseRequiredPrompt
                        onShowManualEntry={() => setShowQrModal(true)}
                        disabled={disabled}
                    />
                    <QrVerificationModal
                        isOpen={showQrModal}
                        onClose={() => setShowQrModal(false)}
                        pollId={pollId}
                        onVerified={() => {
                            setShowQrModal(false);
                            onVerificationChange?.(true, 'on_premise');
                            toast.success('Presence verified! You can now vote.');
                        }}
                    />
                </>
            );
        }
        // Already verified - show voting options with badge
        return (
            <div className="space-y-4">
                <VerifiedBadge type="on_premise" />
                {children}
            </div>
        );
    }

    // Hybrid mode - show choice or proceed based on state
    if (votingAccessMode === 'hybrid') {
        // If already verified on-premise, show badge and proceed
        if (isVerified && verificationType === 'on_premise') {
            return (
                <div className="space-y-4">
                    <VerifiedBadge type="on_premise" />
                    {children}
                </div>
            );
        }

        // If user has already chosen a mode this session
        if (hasChosen) {
            if (chosenMode === 'on_premise' && !isVerified) {
                return (
                    <OnPremiseRequiredPrompt
                        onShowManualEntry={() => setShowQrModal(true)}
                        disabled={disabled}
                        showBackButton
                        onBack={() => {
                            setHasChosen(false);
                            setChosenMode(null);
                        }}
                    />
                );
            }
            return <>{children}</>;
        }

        // Show hybrid choice
        return (
            <>
                <HybridModeChoice
                    onContinueRemotely={() => {
                        setHasChosen(true);
                        setChosenMode('remote');
                        onVerificationChange?.(false, 'remote');
                    }}
                    onVerifyOnPremise={() => {
                        setShowQrModal(true);
                    }}
                    disabled={disabled}
                />

                <QrVerificationModal
                    isOpen={showQrModal}
                    onClose={() => setShowQrModal(false)}
                    pollId={pollId}
                    onVerified={() => {
                        setShowQrModal(false);
                        setHasChosen(true);
                        setChosenMode('on_premise');
                        onVerificationChange?.(true, 'on_premise');
                        toast.success('Presence verified! You can now vote.');
                    }}
                />
            </>
        );
    }

    return <>{children}</>;
}

/**
 * Shows a badge indicating the user's verification status.
 */
function VerifiedBadge({ type }: { type: 'remote' | 'on_premise' }) {
    if (type === 'on_premise') {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        On-Premise Verified
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                        Your physical presence has been verified
                    </p>
                </div>
                <Badge variant="outline" className="ml-auto border-green-300 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    <Check className="mr-1 h-3 w-3" />
                    Verified
                </Badge>
            </div>
        );
    }
    return null;
}

/**
 * Prompt shown when on-premise verification is required.
 */
function OnPremiseRequiredPrompt({
    onShowManualEntry,
    disabled,
    showBackButton,
    onBack,
}: {
    onShowManualEntry: () => void;
    disabled?: boolean;
    showBackButton?: boolean;
    onBack?: () => void;
}) {
    return (
        <div className="space-y-6 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50/50 p-6 dark:border-orange-900/50 dark:bg-orange-950/20">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <QrCode className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200">
                    Scan QR Code to Vote
                </h3>
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                    This poll requires physical presence verification.
                </p>
            </div>

            <div className="flex flex-col items-center gap-3">
                <Button
                    onClick={onShowManualEntry}
                    disabled={disabled}
                    className="w-full gap-2 bg-orange-600 hover:bg-orange-700 sm:w-auto"
                >
                    <Camera className="h-4 w-4" />
                    Open Camera Scanner
                </Button>

                {showBackButton && onBack && (
                    <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
                        Go Back
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * Choice interface for hybrid mode polls.
 */
function HybridModeChoice({
    onContinueRemotely,
    onVerifyOnPremise,
    disabled,
}: {
    onContinueRemotely: () => void;
    onVerifyOnPremise: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold">How would you like to vote?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    This poll supports both remote and on-premise voting.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Remote Option */}
                <button
                    type="button"
                    onClick={onContinueRemotely}
                    disabled={disabled}
                    className="group relative flex flex-col items-center rounded-xl border-2 border-blue-200 bg-blue-50/50 p-6 transition-all hover:border-blue-400 hover:bg-blue-100/50 dark:border-blue-900 dark:bg-blue-950/20 dark:hover:border-blue-700 dark:hover:bg-blue-950/40"
                >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 transition-transform group-hover:scale-110 dark:bg-blue-900/50">
                        <Laptop className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                        Continue Remotely
                    </h4>
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Vote from anywhere without verification
                    </p>
                </button>

                {/* On-Premise Option */}
                <button
                    type="button"
                    onClick={onVerifyOnPremise}
                    disabled={disabled}
                    className="group relative flex flex-col items-center rounded-xl border-2 border-green-200 bg-green-50/50 p-6 transition-all hover:border-green-400 hover:bg-green-100/50 dark:border-green-900 dark:bg-green-950/20 dark:hover:border-green-700 dark:hover:bg-green-950/40"
                >
                    <div className="absolute -right-1 -top-1">
                        <Badge className="bg-green-600 text-[10px]">
                            Recommended
                        </Badge>
                    </div>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 transition-transform group-hover:scale-110 dark:bg-green-900/50">
                        <MapPin className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                        I'm On-Premise
                    </h4>
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        Verify presence via QR code for stronger participation
                    </p>
                </button>
            </div>
        </div>
    );
}

/**
 * QrCameraScanner component for rendering the HTML5 QR scanner
 */
function QrCameraScanner({ onScan, onError }: { onScan: (decodedText: string) => void, onError?: (error: string) => void }) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scannerId = "reader";
        
        // Brief timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            if (!scannerRef.current) {
                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                const config = { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0 
                };

                html5QrCode.start(
                    { facingMode: "environment" }, 
                    config, 
                    (decodedText: string) => {
                        onScan(decodedText);
                    },
                    (errorMessage: string) => {
                        // Ignore frame parse errors
                    }
                ).then(() => {
                    setHasPermission(true);
                }).catch((err: any) => {
                    console.error("Error starting scanner:", err);
                    setHasPermission(false);
                    onError?.("Could not access camera. Please seek permission.");
                });
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().then(() => {
                        scannerRef.current?.clear();
                    }).catch((err: any) => console.error("Failed to stop scanner", err));
                }
            }
        };
    }, [onScan, onError]);

    return (
        <div className="w-full space-y-4">
            <div className="relative overflow-hidden rounded-xl bg-black">
                {hasPermission === null && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/70">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {/* The library renders the video element here */}
                <div id="reader" className="w-full"></div>
                
                {/* Overlay for visual scanning frame */}
                {hasPermission && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="h-64 w-64 rounded-xl border-2 border-white/50 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                             <div className="absolute top-0 left-0 h-8 w-8 border-l-4 border-t-4 border-orange-500 rounded-tl-xl -translate-x-1 -translate-y-1"></div>
                             <div className="absolute top-0 right-0 h-8 w-8 border-r-4 border-t-4 border-orange-500 rounded-tr-xl translate-x-1 -translate-y-1"></div>
                             <div className="absolute bottom-0 left-0 h-8 w-8 border-l-4 border-b-4 border-orange-500 rounded-bl-xl -translate-x-1 translate-y-1"></div>
                             <div className="absolute bottom-0 right-0 h-8 w-8 border-r-4 border-b-4 border-orange-500 rounded-br-xl translate-x-1 translate-y-1"></div>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-center text-xs text-muted-foreground">
                Point your camera at the venue QR code
            </p>
        </div>
    );
}

/**
 * Modal for entering/scanning QR verification code.
 */
function QrVerificationModal({
    isOpen,
    onClose,
    pollId,
    onVerified,
}: {
    isOpen: boolean;
    onClose: () => void;
    pollId: number;
    onVerified: () => void;
}) {
    const [token, setToken] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("scan");

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setToken('');
            setError(null);
            setIsVerifying(false);
            setActiveTab("scan");
        }
    }, [isOpen]);

    const performVerification = async (qrToken: string) => {
        // Extract token if it's a full URL
        let tokenToVerify = qrToken;
        if (qrToken.includes('/presence/scan/')) {
            const parts = qrToken.split('/presence/scan/');
            if (parts.length > 1) {
                tokenToVerify = parts[1];
            }
        }
        
        // Basic length check if it's raw token
        if (tokenToVerify.length !== 64) {
             setError('Invalid QR code format. Please try again.');
             return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            const response = await axios.post('/presence/verify', { token: tokenToVerify });
            
            if (response.data.success) {
                onVerified();
            } else {
                setError(response.data.message || 'Verification failed');
                setIsVerifying(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to verify presence');
            setIsVerifying(false);
        }
    };

    const handleManualVerify = () => {
        performVerification(token);
    };

    const handleScan = (decodedText: string) => {
        performVerification(decodedText);
    };

    const handleClose = () => {
        setToken('');
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Verify Your Presence
                    </DialogTitle>
                    <DialogDescription>
                        Scan the QR code at the venue to verify your location.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="scan" className="gap-2">
                            <Camera className="h-4 w-4" />
                            Scan Camera
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="gap-2">
                            <Keyboard className="h-4 w-4" />
                            Manual Entry
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="py-4">
                        {error && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <TabsContent value="scan" className="mt-0">
                            {isVerifying ? (
                                <div className="flex h-[250px] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed bg-muted/30">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm font-medium text-muted-foreground">Verifying scan...</p>
                                </div>
                            ) : (
                                <QrCameraScanner onScan={handleScan} />
                            )}
                        </TabsContent>

                        <TabsContent value="manual" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="qr-token">Verification Code</Label>
                                <Input
                                    id="qr-token"
                                    placeholder="Enter the 64-character code..."
                                    value={token}
                                    onChange={(e) => {
                                        setToken(e.target.value);
                                        setError(null);
                                    }}
                                    className="font-mono text-sm"
                                    disabled={isVerifying}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {token.length}/64 characters
                                </p>
                            </div>
                            
                            <Button
                                onClick={handleManualVerify}
                                disabled={token.length !== 64 || isVerifying}
                                className="w-full gap-2"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Verify Code
                                    </>
                                )}
                            </Button>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

export default PresenceVerificationGate;
