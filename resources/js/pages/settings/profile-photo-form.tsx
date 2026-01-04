import * as currentUserPhoto from '@/routes/current-user-photo';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { User } from '@/types';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
    user: User;
}

export default function ProfilePhotoForm({ user }: Props) {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoInput = useRef<HTMLInputElement>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectNewPhoto = () => {
        photoInput.current?.click();
    };

    const updatePhotoPreview = () => {
        const photo = photoInput.current?.files?.[0];

        if (!photo) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            setPhotoPreview(e.target?.result as string);
        };

        reader.readAsDataURL(photo);

        // Auto-save when photo is selected
        savePhoto(photo);
    };

    const savePhoto = (file: File) => {
        setProcessing(true);
        setErrors({});

        const formData = new FormData();
        formData.append('photo', file);

        router.post(currentUserPhoto.update.url(), formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile photo updated.');
                setProcessing(false);
                // Clear file input
                if (photoInput.current) {
                    photoInput.current.value = '';
                }
            },
            onError: (err) => {
                setErrors(err as Record<string, string>);
                setProcessing(false);
            }
        });
    };

    const deletePhoto = () => {
        setProcessing(true);
        router.delete(currentUserPhoto.destroy.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setPhotoPreview(null);
                toast.success('Profile photo removed.');
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div className="col-span-6 sm:col-span-4">
            {/* Profile Photo File Input */}
            <input
                type="file"
                className="hidden"
                ref={photoInput}
                onChange={updatePhotoPreview}
            />

            <Label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Profile Photo
            </Label>

            <div className="mt-2 flex items-center gap-x-3">
                {/* Current Profile Photo */}
                <div className="mt-2">
                    <span
                        className="block h-20 w-20 rounded-full bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url('${photoPreview ?? user.profile_photo_url}')`,
                        }}
                    />
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    className="mt-2 me-2"
                    onClick={selectNewPhoto}
                    disabled={processing}
                >
                    Select A New Photo
                </Button>

                {user.profile_photo_path && (
                    <Button
                        type="button"
                        variant="destructive"
                        className="mt-2"
                        onClick={deletePhoto}
                        disabled={processing}
                    >
                        Remove Photo
                    </Button>
                )}
            </div>

            <InputError message={errors.photo} className="mt-2" />
        </div>
    );
}
