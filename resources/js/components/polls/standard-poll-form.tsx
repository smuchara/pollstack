import { List, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface StandardPollOption {
    id?: number;
    text: string;
    votes_count?: number;
}

interface StandardPollFormProps {
    options: StandardPollOption[];
    onOptionsChange: (options: StandardPollOption[]) => void;
    errors?: Record<string, string>;
}


export function StandardPollForm({
    options,
    onOptionsChange,
    errors = {},
}: StandardPollFormProps) {
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], text: value };
        onOptionsChange(newOptions);
    };

    const addOption = () => {
        onOptionsChange([...options, { text: '' }]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) {
            toast.error('A poll must have at least 2 options.');
            return;
        }
        const newOptions = options.filter((_, i) => i !== index);
        onOptionsChange(newOptions);
    };

    return (
        <div className="space-y-4">
            <Label className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Poll Options
            </Label>

            <div className="space-y-3">
                {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder={`Option ${index + 1}`}
                                value={option.text}
                                onChange={(e) =>
                                    handleOptionChange(index, e.target.value)
                                }
                                required
                            />
                            {errors[`options.${index}.text`] && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors[`options.${index}.text`]}
                                </p>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            disabled={options.length <= 2}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2 text-primary hover:text-primary/90"
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
            </Button>

            <p className="text-xs text-muted-foreground">
                Minimum 2 options required. Add as many as you need.
            </p>
        </div>
    );
}

export default StandardPollForm;
