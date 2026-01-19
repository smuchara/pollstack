import { cn } from '@/lib/utils';
import { Check, FileText, Users } from 'lucide-react';

export type PollType = 'standard' | 'profile';

interface PollTypeOption {
    type: PollType;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
}

const pollTypes: PollTypeOption[] = [
    {
        type: 'standard',
        title: 'Standard Poll',
        description: 'Traditional text-based voting with multiple options',
        icon: <FileText className="h-8 w-8" />,
        features: [
            'Text-based options',
            'Quick to create',
            'Best for simple votes',
        ],
    },
    {
        type: 'profile',
        title: 'Profile Poll',
        description: 'Visual voting with photos, names, and positions',
        icon: <Users className="h-8 w-8" />,
        features: ['Candidate photos', 'Name & position', 'Best for elections'],
    },
];

interface PollTypeSelectorProps {
    selectedType: PollType | null;
    onSelect: (type: PollType) => void;
    className?: string;
}

export function PollTypeSelector({
    selectedType,
    onSelect,
    className,
}: PollTypeSelectorProps) {
    return (
        <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
            {pollTypes.map((option) => {
                const isSelected = selectedType === option.type;

                return (
                    <button
                        key={option.type}
                        type="button"
                        onClick={() => onSelect(option.type)}
                        className={cn(
                            'group relative flex flex-col rounded-xl border-2 p-6 text-left transition-all duration-200',
                            'hover:border-primary/50 hover:bg-muted/50 hover:shadow-md',
                            'focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none',
                            isSelected
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border bg-card',
                        )}
                    >
                        {isSelected && (
                            <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-4 w-4" />
                            </div>
                        )}

                        <div
                            className={cn(
                                'mb-4 flex h-14 w-14 items-center justify-center rounded-lg transition-colors',
                                isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                            )}
                        >
                            {option.icon}
                        </div>

                        <h3 className="mb-1 text-lg font-semibold text-foreground">
                            {option.title}
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            {option.description}
                        </p>

                        <ul className="mt-auto space-y-2">
                            {option.features.map((feature, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <div
                                        className={cn(
                                            'flex h-4 w-4 items-center justify-center rounded-full',
                                            isSelected
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        <Check className="h-2.5 w-2.5" />
                                    </div>
                                    <span
                                        className={cn(
                                            isSelected
                                                ? 'text-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </button>
                );
            })}
        </div>
    );
}

export default PollTypeSelector;
