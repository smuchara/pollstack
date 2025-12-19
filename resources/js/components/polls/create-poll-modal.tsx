import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { Plus, Trash2, Calendar, Lock, Globe, Clock, AlignLeft, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { localToUTC, utcToLocalInput } from '@/lib/date-utils';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PollOption {
    text: string;
}

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    poll?: any; // We can refine this type later
    context?: 'super-admin' | 'organization'; // Add context prop
    organizationSlug?: string; // Add organization slug for org admin context
    organizationId?: number; // Add organization ID for org admin context
}

export default function CreatePollModal({ isOpen, onClose, poll, context = 'super-admin', organizationSlug, organizationId }: CreatePollModalProps) {
    const { props } = usePage();

    // Initialize options based on poll or default
    const [options, setOptions] = useState<PollOption[]>(
        poll?.options?.map((o: any) => ({ text: o.text })) || [{ text: '' }, { text: '' }]
    );

    const form = useForm({
        question: poll?.question || '',
        description: poll?.description || '',
        type: poll?.type || 'open',
        status: 'active', // Backend will determine actual status based on timing
        start_at: poll?.start_at ? utcToLocalInput(poll.start_at) : '',
        end_at: poll?.end_at ? utcToLocalInput(poll.end_at) : '',
        organization_id: poll?.organization_id || '',
        options: [] as PollOption[],
    });

    // Reset form when poll changes
    if (poll && form.data.question !== poll.question && !form.isDirty) {
        form.setData({
            question: poll.question,
            description: poll.description || '',
            type: poll.type,
            status: 'active', // Backend determines actual status
            start_at: poll.start_at ? utcToLocalInput(poll.start_at) : '',
            end_at: poll.end_at ? utcToLocalInput(poll.end_at) : '',
            organization_id: poll.organization_id || '',
            options: [],
        });
        setOptions(poll.options?.map((o: any) => ({ text: o.text })) || [{ text: '' }, { text: '' }]);
    }

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { text: '' }]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) {
            toast.error('A poll must have at least 2 options.');
            return;
        }
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (options.some(opt => !opt.text.trim())) {
            toast.error('All options must have text.');
            return;
        }

        // Prepare data with proper null handling for organization_id
        const organizationId = form.data.organization_id && form.data.organization_id !== ''
            ? form.data.organization_id
            : null;

        const dataToSubmit = {
            question: form.data.question,
            description: form.data.description || null,
            type: form.data.type,
            status: form.data.status,
            start_at: form.data.start_at ? localToUTC(form.data.start_at) : null,
            end_at: form.data.end_at ? localToUTC(form.data.end_at) : null,
            organization_id: organizationId,
            options: options,
        };

        // Determine base URL based on context
        const baseUrl = context === 'organization'
            ? `/organization/${organizationSlug}/admin/polls-management`
            : '/super-admin/polls';

        if (poll) {
            router.put(`${baseUrl}/${poll.id}`, dataToSubmit as any, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Poll updated successfully');
                    form.reset();
                    onClose();
                },
                onError: (errors: any) => {
                    toast.error('Failed to update poll.');
                    console.error(errors);
                },
            });
        } else {
            router.post(baseUrl, dataToSubmit as any, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Poll created successfully');
                    form.reset();
                    setOptions([{ text: '' }, { text: '' }]);
                    onClose();
                },
                onError: (errors: any) => {
                    toast.error('Failed to create poll.');
                    console.error(errors);
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{poll ? 'Edit Poll' : 'Create New Poll'}</DialogTitle>
                        <DialogDescription>
                            {poll ? 'Update the poll details.' : 'Configure the poll details, options, and schedule.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="question" className="flex items-center gap-2">
                                    <AlignLeft className="h-4 w-4" />
                                    Poll Question
                                </Label>
                                <Input
                                    id="question"
                                    placeholder="e.g., What is your favorite backend framework?"
                                    value={form.data.question}
                                    onChange={(e) => form.setData('question', e.target.value)}
                                    required
                                />
                                {form.errors.question && (
                                    <p className="text-sm text-destructive">{form.errors.question}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Provide more context..."
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="space-y-2">
                                <Label htmlFor="type">Ballot Type</Label>
                                <Select
                                    value={form.data.type}
                                    onValueChange={(val) => form.setData('type', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                <span>Open Ballot</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="closed">
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                <span>Closed Ballot</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <List className="h-4 w-4" />
                                Poll Options
                            </Label>
                            <div className="space-y-2">
                                {options.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder={`Option ${index + 1}`}
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            required
                                        />
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
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                            </Button>
                        </div>

                        {/* Schedule */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_at" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Start Date
                                </Label>
                                <Input
                                    id="start_at"
                                    type="datetime-local"
                                    value={form.data.start_at}
                                    onChange={(e) => form.setData('start_at', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_at" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    End Date
                                </Label>
                                <Input
                                    id="end_at"
                                    type="datetime-local"
                                    value={form.data.end_at}
                                    onChange={(e) => form.setData('end_at', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : (poll ? 'Save Changes' : 'Create Poll')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
