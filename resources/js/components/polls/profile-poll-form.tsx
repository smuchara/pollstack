import { Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { ProfileOptionCard, ProfilePollOption } from './profile-option-card';

interface ProfilePollFormProps {
    options: ProfilePollOption[];
    onOptionsChange: (options: ProfilePollOption[]) => void;
    errors?: Record<string, string>;
}

function createEmptyOption(): ProfilePollOption {
    return {
        text: '',
        image: null,
        name: '',
        position: '',
    };
}

export function ProfilePollForm({
    options,
    onOptionsChange,
    errors = {},
}: ProfilePollFormProps) {
    const handleOptionChange = (index: number, option: ProfilePollOption) => {
        const newOptions = [...options];
        newOptions[index] = option;
        onOptionsChange(newOptions);
    };

    const addOption = () => {
        onOptionsChange([...options, createEmptyOption()]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) {
            toast.error('A poll must have at least 2 candidates.');
            return;
        }
        const newOptions = options.filter((_, i) => i !== index);
        onOptionsChange(newOptions);
    };

    const getOptionErrors = (index: number) => {
        return {
            name: errors[`options.${index}.name`],
            position: errors[`options.${index}.position`],
            image: errors[`options.${index}.image`],
        };
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Candidates
                </Label>
                <span className="text-sm text-muted-foreground">
                    {options.length} candidate{options.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {options.map((option, index) => (
                    <ProfileOptionCard
                        key={index}
                        option={option}
                        index={index}
                        onChange={handleOptionChange}
                        onRemove={removeOption}
                        canRemove={options.length > 2}
                        errors={getOptionErrors(index)}
                    />
                ))}

                <button
                    type="button"
                    onClick={addOption}
                    className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 hover:text-primary"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Add Candidate</span>
                </button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                    Minimum 2 candidates required. Add photos, names, and
                    positions.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Candidate
                </Button>
            </div>
        </div>
    );
}

export default ProfilePollForm;

export type { ProfilePollOption } from './profile-option-card';
