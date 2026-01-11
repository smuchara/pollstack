import { ImagePlus, Trash2, User, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface ProfilePollOption {
    id?: number;
    text: string;
    image: File | null;
    image_url?: string | null;
    name: string;
    position: string;
    votes_count?: number;
}

interface ProfileOptionCardProps {
    option: ProfilePollOption;
    index: number;
    onChange: (index: number, option: ProfilePollOption) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
    errors?: {
        name?: string;
        position?: string;
        image?: string;
    };
}

export function ProfileOptionCard({
    option,
    index,
    onChange,
    onRemove,
    canRemove,
    errors = {},
}: ProfileOptionCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFieldChange = (
        field: keyof ProfilePollOption,
        value: string | File | null,
    ) => {
        const updatedOption = { ...option, [field]: value };
        if (field === 'name') {
            updatedOption.text = value as string;
        }
        onChange(index, updatedOption);
    };

    const handleImageSelect = (file: File) => {
        const validTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/jpg',
        ];
        if (!validTypes.includes(file.type)) {
            return;
        }

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            return;
        }

        handleFieldChange('image', file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const removeImage = () => {
        handleFieldChange('image', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getImageSrc = (): string | null => {
        if (option.image) {
            return URL.createObjectURL(option.image);
        }
        if (option.image_url) {
            return option.image_url;
        }
        return null;
    };

    const imageSrc = getImageSrc();

    return (
        <div className="relative rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                disabled={!canRemove}
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <div className="absolute top-4 left-4">
                <span className="text-xs font-medium text-muted-foreground">
                    #{index + 1}
                </span>
            </div>

            <div className="mt-6 space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                        Profile Image
                    </Label>

                    {imageSrc ? (
                        <div className="relative mx-auto h-32 w-32">
                            <img
                                src={imageSrc}
                                alt={option.name || 'Profile'}
                                className="h-32 w-32 rounded-full object-cover ring-2 ring-border"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                'mx-auto flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed transition-colors',
                                isDragging
                                    ? 'border-primary bg-primary/10'
                                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50',
                            )}
                        >
                            <ImagePlus className="mb-1 h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                Upload
                            </span>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />

                    {errors.image && (
                        <p className="text-center text-xs text-destructive">
                            {errors.image}
                        </p>
                    )}
                    <p className="text-center text-xs text-muted-foreground">
                        JPG, PNG, or WebP. Max 2MB.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label
                        htmlFor={`name-${index}`}
                        className="flex items-center gap-1.5 text-xs"
                    >
                        <User className="h-3 w-3" />
                        Name
                    </Label>
                    <Input
                        id={`name-${index}`}
                        placeholder="Candidate name"
                        value={option.name}
                        onChange={(e) =>
                            handleFieldChange('name', e.target.value)
                        }
                        required
                    />
                    {errors.name && (
                        <p className="text-xs text-destructive">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor={`position-${index}`} className="text-xs">
                        Position
                    </Label>
                    <Input
                        id={`position-${index}`}
                        placeholder="e.g., President, Secretary"
                        value={option.position}
                        onChange={(e) =>
                            handleFieldChange('position', e.target.value)
                        }
                        required
                    />
                    {errors.position && (
                        <p className="text-xs text-destructive">
                            {errors.position}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileOptionCard;
