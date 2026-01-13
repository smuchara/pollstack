import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Home, QrCode, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    message: string;
}

export default function VerificationFailed({ message }: Props) {
    return (
        <>
            <Head title="Verification Failed" />
            
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl text-destructive">
                            Verification Failed
                        </CardTitle>
                        <CardDescription className="text-base">
                            We couldn't verify your presence
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                            <p className="text-sm text-destructive">
                                {message}
                            </p>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p className="font-medium">Common reasons for failure:</p>
                            <ul className="list-inside list-disc space-y-1">
                                <li>The QR code has expired (codes refresh every 2 minutes)</li>
                                <li>The QR code has already been used</li>
                                <li>The poll is not currently active</li>
                                <li>You're not eligible to vote in this poll</li>
                            </ul>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            variant="default"
                            className="w-full gap-2"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Scanning Again
                        </Button>
                        
                        <div className="flex w-full gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                asChild
                            >
                                <Link href="/polls">
                                    <QrCode className="h-4 w-4" />
                                    View Polls
                                </Link>
                            </Button>
                            
                            <Button
                                variant="ghost"
                                className="flex-1 gap-2"
                                asChild
                            >
                                <Link href="/dashboard">
                                    <Home className="h-4 w-4" />
                                    Dashboard
                                </Link>
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
