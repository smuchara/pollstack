import { Info, X, CheckCircle2, Pin, SlidersHorizontal, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Tip {
    title: string;
    description: string;
    icon: React.ElementType;
}

interface TipsDialogProps {
    title?: string;
    tips: Tip[];
}

export function TipsDialog({ title = "Page Guide", tips }: TipsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Help & Tips</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Content */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Info className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="grid gap-4">
                        {tips.map((tip, idx) => (
                            <div key={idx} className="flex gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50">
                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border">
                                    <tip.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-foreground">{tip.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                        {tip.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border bg-muted/30 px-6 py-4">
                    <Button
                        onClick={() => setIsOpen(false)}
                        variant="default"
                        className="w-full"
                    >
                        Got it, thanks!
                    </Button>
                </div>
            </div>
        </div>
    );
}
