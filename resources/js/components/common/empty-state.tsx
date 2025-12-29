import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12 rounded-lg border border-dashed bg-muted/20">
            <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
            {action && (
                <Button onClick={action.onClick} className="mt-4 gap-2">
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                </Button>
            )}
        </div>
    );
}
