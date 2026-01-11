import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { SlideDrawer } from '@/components/ui/slide-drawer';
import { localToUTC, utcToLocalInput } from '@/lib/date-utils';

import {
    Department,
    PollFormData,
    PollFormShared,
    User,
} from './poll-form-shared';
import { PollType } from './poll-type-selector';
import { ProfilePollForm, ProfilePollOption } from './profile-poll-form';
import { StandardPollForm, StandardPollOption } from './standard-poll-form';

export interface Poll {
    id?: number;
    question: string;
    description?: string | null;
    type: string;
    poll_type?: string;
    visibility?: string;
    status?: string;
    start_at?: string | null;
    end_at?: string | null;
    organization_id?: number | string | null;
    options?: Array<{
        id?: number;
        text: string;
        image_url?: string | null;
        image_full_url?: string | null;
        name?: string | null;
        position?: string | null;
        votes_count?: number;
    }>;
    invited_users?: User[];
    invited_departments?: Department[];
}

interface PollCreationDrawerProps {
    /** Whether the drawer is open */
    isOpen: boolean;
    /** Callback when the drawer should close */
    onClose: () => void;
    /** The poll type being created/edited */
    pollType: PollType;
    /** Existing poll data (for edit mode) */
    poll?: Poll;
    /** Context (super-admin vs organization) */
    context?: 'super-admin' | 'organization';
    /** Organization slug (for organization context) */
    organizationSlug?: string;
    /** Available departments for invite-only polls */
    departments?: Department[];
    /** Available users for invite-only polls */
    users?: User[];
}

/**
 * Creates empty standard poll options.
 */
function createEmptyStandardOptions(): StandardPollOption[] {
    return [{ text: '' }, { text: '' }];
}

/**
 * Creates empty profile poll options.
 */
function createEmptyProfileOptions(): ProfilePollOption[] {
    return [
        { text: '', image: null, name: '', position: '' },
        { text: '', image: null, name: '', position: '' },
    ];
}

/**
 * PollCreationDrawer - Drawer component for poll creation/editing.
 *
 * Orchestrates the form experience based on poll type.
 * Contains shared form fields and type-specific options.
 */
export function PollCreationDrawer({
    isOpen,
    onClose,
    pollType,
    poll,
    context = 'super-admin',
    organizationSlug,
    departments = [],
    users = [],
}: PollCreationDrawerProps) {
    const isEditMode = !!poll?.id;

    // Form data state
    const [formData, setFormData] = useState<PollFormData>({
        question: '',
        description: '',
        type: 'open',
        visibility: 'public',
        start_at: '',
        end_at: '',
    });

    // Options state
    const [standardOptions, setStandardOptions] = useState<
        StandardPollOption[]
    >(createEmptyStandardOptions());
    const [profileOptions, setProfileOptions] = useState<ProfilePollOption[]>(
        createEmptyProfileOptions(),
    );

    // Invitation state
    const [selectedDepartments, setSelectedDepartments] = useState<number[]>(
        [],
    );
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset/sync form when drawer opens or poll changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (isOpen) {
            if (poll) {
                // Edit mode: populate from existing poll
                setFormData({
                    question: poll.question,
                    description: poll.description || '',
                    type: poll.type,
                    visibility: poll.visibility || 'public',
                    start_at: poll.start_at
                        ? utcToLocalInput(poll.start_at)
                        : '',
                    end_at: poll.end_at ? utcToLocalInput(poll.end_at) : '',
                });

                // Set options based on poll type
                if (poll.poll_type === 'profile' || pollType === 'profile') {
                    setProfileOptions(
                        poll.options?.map((o) => ({
                            id: o.id,
                            text: o.text,
                            image: null,
                            image_url: o.image_url,
                            name: o.name || '',
                            position: o.position || '',
                        })) || createEmptyProfileOptions(),
                    );
                } else {
                    setStandardOptions(
                        poll.options?.map((o) => ({
                            id: o.id,
                            text: o.text,
                        })) || createEmptyStandardOptions(),
                    );
                }

                setSelectedDepartments(
                    poll.invited_departments?.map((d) => d.id) || [],
                );
                setSelectedUsers(poll.invited_users?.map((u) => u.id) || []);
            } else {
                // Create mode: reset to defaults
                setFormData({
                    question: '',
                    description: '',
                    type: 'open',
                    visibility: 'public',
                    start_at: '',
                    end_at: '',
                });
                setStandardOptions(createEmptyStandardOptions());
                setProfileOptions(createEmptyProfileOptions());
                setSelectedDepartments([]);
                setSelectedUsers([]);
            }
            setErrors({});
        }
    }, [isOpen, poll?.id]);

    const handleFormDataChange = <K extends keyof PollFormData>(
        field: K,
        value: PollFormData[K],
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate question
        if (!formData.question.trim()) {
            newErrors.question = 'Poll question is required.';
        }

        // Validate options
        const options =
            pollType === 'profile' ? profileOptions : standardOptions;
        if (options.length < 2) {
            newErrors.options = 'At least 2 options are required.';
        }

        if (pollType === 'standard') {
            standardOptions.forEach((opt, index) => {
                if (!opt.text.trim()) {
                    newErrors[`options.${index}.text`] =
                        'Option text is required.';
                }
            });
        } else {
            profileOptions.forEach((opt, index) => {
                if (!opt.name.trim()) {
                    newErrors[`options.${index}.name`] = 'Name is required.';
                }
                if (!opt.position.trim()) {
                    newErrors[`options.${index}.position`] =
                        'Position is required.';
                }
            });
        }

        // Validate invite-only polls have invitations
        if (
            formData.visibility === 'invite_only' &&
            selectedDepartments.length === 0 &&
            selectedUsers.length === 0
        ) {
            newErrors.visibility =
                'Invite-only polls must have at least one invited user or department.';
            toast.error(
                'Invite-only polls must have at least one invited user or department.',
            );
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting.');
            return;
        }

        setIsSubmitting(true);

        // Build the form data
        const formDataToSend = new FormData();
        formDataToSend.append('question', formData.question);
        formDataToSend.append('description', formData.description || '');
        formDataToSend.append('type', formData.type);
        formDataToSend.append('poll_type', pollType);
        formDataToSend.append('visibility', formData.visibility);
        formDataToSend.append('status', 'active');

        // Handle dates - only append if they have values
        const startAtUtc = formData.start_at
            ? localToUTC(formData.start_at)
            : null;
        const endAtUtc = formData.end_at ? localToUTC(formData.end_at) : null;
        if (startAtUtc) {
            formDataToSend.append('start_at', startAtUtc);
        }
        if (endAtUtc) {
            formDataToSend.append('end_at', endAtUtc);
        }

        // Add options based on poll type
        if (pollType === 'profile') {
            profileOptions.forEach((opt, index) => {
                formDataToSend.append(`options[${index}][text]`, opt.name);
                if (opt.id) {
                    formDataToSend.append(
                        `options[${index}][id]`,
                        String(opt.id),
                    );
                }
                formDataToSend.append(`options[${index}][name]`, opt.name);
                formDataToSend.append(
                    `options[${index}][position]`,
                    opt.position,
                );
                if (opt.image) {
                    formDataToSend.append(
                        `options[${index}][image]`,
                        opt.image,
                    );
                }
            });
        } else {
            standardOptions.forEach((opt, index) => {
                formDataToSend.append(`options[${index}][text]`, opt.text);
                if (opt.id) {
                    formDataToSend.append(
                        `options[${index}][id]`,
                        String(opt.id),
                    );
                }
            });
        }

        // Add invitations for invite-only polls
        if (formData.visibility === 'invite_only') {
            selectedUsers.forEach((id, index) => {
                formDataToSend.append(`invite_user_ids[${index}]`, String(id));
            });
            selectedDepartments.forEach((id, index) => {
                formDataToSend.append(
                    `invite_department_ids[${index}]`,
                    String(id),
                );
            });
        }

        // Determine base URL based on context
        const baseUrl =
            context === 'organization'
                ? `/organization/${organizationSlug}/admin/polls-management`
                : '/super-admin/polls';

        const url = isEditMode ? `${baseUrl}/${poll!.id}` : baseUrl;

        // For edit mode with FormData, we need to use POST with _method override
        if (isEditMode) {
            formDataToSend.append('_method', 'PUT');
        }

        router.post(url, formDataToSend, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success(
                    isEditMode
                        ? 'Poll updated successfully'
                        : 'Poll created successfully',
                );
                onClose();
            },
            onError: (responseErrors) => {
                toast.error(
                    isEditMode
                        ? 'Failed to update poll.'
                        : 'Failed to create poll.',
                );
                setErrors(responseErrors as Record<string, string>);
                console.error(responseErrors);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const title = isEditMode
        ? `Edit ${pollType === 'profile' ? 'Profile' : 'Standard'} Poll`
        : `Create ${pollType === 'profile' ? 'Profile' : 'Standard'} Poll`;

    const description = isEditMode
        ? 'Update your poll details and options.'
        : pollType === 'profile'
          ? 'Create a visual poll with candidate photos, names, and positions.'
          : 'Create a traditional text-based poll with multiple options.';

    return (
        <SlideDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            w="4xl"
            isLoading={isSubmitting}
            footer={
                <>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="poll-form"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? 'Saving...'
                            : isEditMode
                              ? 'Save Changes'
                              : 'Create Poll'}
                    </Button>
                </>
            }
        >
            <form id="poll-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Shared Form Fields */}
                <PollFormShared
                    formData={formData}
                    errors={errors}
                    onFormDataChange={handleFormDataChange}
                    departments={departments}
                    users={users}
                    selectedDepartments={selectedDepartments}
                    selectedUsers={selectedUsers}
                    onDepartmentsChange={setSelectedDepartments}
                    onUsersChange={setSelectedUsers}
                />

                {/* Type-Specific Options */}
                <div className="border-t pt-6">
                    {pollType === 'profile' ? (
                        <ProfilePollForm
                            options={profileOptions}
                            onOptionsChange={setProfileOptions}
                            errors={errors}
                        />
                    ) : (
                        <StandardPollForm
                            options={standardOptions}
                            onOptionsChange={setStandardOptions}
                            errors={errors}
                        />
                    )}
                </div>
            </form>
        </SlideDrawer>
    );
}

export default PollCreationDrawer;
