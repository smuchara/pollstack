import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Poll, PollCreationDrawer } from './poll-creation-drawer';
import { Department, User } from './poll-form-shared';
import { PollType, PollTypeSelector } from './poll-type-selector';

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    poll?: Poll;
    context?: 'super-admin' | 'organization';
    organizationSlug?: string;
    departments?: Department[];
    users?: User[];
}

type ModalStage = 'select-type' | 'form';

export default function CreatePollModal({
    isOpen,
    onClose,
    poll,
    context = 'super-admin',
    organizationSlug,
    departments = [],
    users = [],
}: CreatePollModalProps) {
    const [stage, setStage] = useState<ModalStage>('select-type');
    const [selectedType, setSelectedType] = useState<PollType | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (poll) {
                const pollType = (poll.poll_type as PollType) || 'standard';
                setSelectedType(pollType);
                setStage('form');
                setIsDrawerOpen(true);
            } else {
                setSelectedType(null);
                setStage('select-type');
                setIsDrawerOpen(false);
            }
        } else {
            setSelectedType(null);
            setStage('select-type');
            setIsDrawerOpen(false);
        }
    }, [isOpen, poll?.id]);

    const handleTypeSelect = (type: PollType) => {
        setSelectedType(type);
    };

    const handleContinue = () => {
        if (selectedType) {
            setStage('form');
            setIsDrawerOpen(true);
        }
    };

    const handleDrawerClose = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            onClose();
        }, 100);
    };

    const handleModalClose = () => {
        if (stage === 'form') {
            setIsDrawerOpen(false);
            setTimeout(() => {
                onClose();
            }, 100);
        } else {
            onClose();
        }
    };

    if (poll) {
        return (
            <PollCreationDrawer
                isOpen={isDrawerOpen}
                onClose={handleDrawerClose}
                pollType={selectedType || 'standard'}
                poll={poll}
                context={context}
                organizationSlug={organizationSlug}
                departments={departments}
                users={users}
            />
        );
    }

    return (
        <>
            <Dialog
                open={isOpen && stage === 'select-type'}
                onOpenChange={handleModalClose}
            >
                <DialogContent size="lg" className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Poll</DialogTitle>
                        <DialogDescription>
                            Choose the type of poll you want to create. You can
                            select from a traditional text-based poll or a
                            visual profile poll for elections.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <PollTypeSelector
                            selectedType={selectedType}
                            onSelect={handleTypeSelect}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleContinue}
                            disabled={!selectedType}
                            className="gap-2"
                        >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PollCreationDrawer
                isOpen={isDrawerOpen}
                onClose={handleDrawerClose}
                pollType={selectedType || 'standard'}
                context={context}
                organizationSlug={organizationSlug}
                departments={departments}
                users={users}
            />
        </>
    );
}
