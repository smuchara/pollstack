import * as React from 'react';
import { Loader2, XIcon } from 'lucide-react';
import * as SheetPrimitive from '@radix-ui/react-dialog';

import { cn } from '@/lib/utils';


const widthClasses = {
    md: 'sm:max-w-md',      // 448px
    lg: 'sm:max-w-lg',      // 512px
    xl: 'sm:max-w-xl',      // 576px
    '2xl': 'sm:max-w-2xl',  // 672px
    '3xl': 'sm:max-w-3xl',  // 768px
    '4xl': 'sm:max-w-4xl',  // 896px
    '5xl': 'sm:max-w-5xl',  // 1024px
    '6xl': 'sm:max-w-6xl',  // 1152px
    '7xl': 'sm:max-w-7xl',  // 1280px
    full: 'sm:max-w-full',  // 100%
} as const;

export type SlideDrawerWidth = keyof typeof widthClasses;

export interface SlideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    w?: SlideDrawerWidth;
    side?: 'left' | 'right';
    children: React.ReactNode;
    footer?: React.ReactNode;
    isLoading?: boolean;
    contentClassName?: string;
}

export function SlideDrawer({
    isOpen,
    onClose,
    title,
    description,
    w = '3xl',
    side = 'right',
    children,
    footer,
    isLoading = false,
    contentClassName,
}: SlideDrawerProps) {
    return (
        <SheetPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetPrimitive.Portal>
                <SheetPrimitive.Overlay
                    className={cn(
                        'fixed inset-0 z-50 bg-black/80',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    )}
                />

                {/* Content */}
                <SheetPrimitive.Content
                    className={cn(
                        'bg-background fixed z-50 flex h-full flex-col shadow-lg transition ease-in-out',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:duration-300 data-[state=open]:duration-500',
                        // Side-specific styles
                        side === 'right' && [
                            'inset-y-0 right-0 w-full border-l',
                            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
                        ],
                        side === 'left' && [
                            'inset-y-0 left-0 w-full border-r',
                            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
                        ],
                        widthClasses[w],
                    )}
                >
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">Loading...</span>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="border-b px-6 py-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1 pr-8">
                                <SheetPrimitive.Title className="text-lg font-semibold text-foreground">
                                    {title}
                                </SheetPrimitive.Title>
                                {description && (
                                    <SheetPrimitive.Description className="text-sm text-muted-foreground">
                                        {description}
                                    </SheetPrimitive.Description>
                                )}
                            </div>
                            <SheetPrimitive.Close className="ring-offset-background focus:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
                                <XIcon className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </SheetPrimitive.Close>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className={cn('flex-1 overflow-y-auto px-6 py-4', contentClassName)}>{children}</div>

                    {/* Footer */}
                    {footer && (
                        <div className="border-t bg-muted/30 px-6 py-4">
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>
                        </div>
                    )}
                </SheetPrimitive.Content>
            </SheetPrimitive.Portal>
        </SheetPrimitive.Root>
    );
}

export default SlideDrawer;
