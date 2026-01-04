import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
    const { auth } = usePage<SharedData>().props;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div role="button" className="flex items-center gap-2 cursor-pointer p-2 hover:bg-accent rounded-full md:rounded-lg md:px-3 md:py-2 transition-colors">
                    <UserInfo user={auth.user} />
                    <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56"
                align="end"
                forceMount
            >
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
