import AppLogoIcon from '@/components/app-logo-icon';
import AppLogo from '@/components/app-logo';
import { Toaster } from '@/components/ui/toaster';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
                                             children,
                                             title,
                                             description,
                                         }: PropsWithChildren<AuthLayoutProps>) {
    // Handle flash message toasts
    useToastNotifications();
    
    return (
        <>
        <div className="min-h-screen w-full bg-white dark:bg-zinc-950 lg:grid lg:grid-cols-2">

            {/* Left Side: Gradient Card */}
            {/* We use padding here so the gradient card floats inside the left column */}
            <div className="relative hidden h-full p-3 lg:flex lg:flex-col">
                <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#d946ef] p-12 text-white">

                    {/* Top Left: Glassy Logo */}
                    <div className="relative z-10">
                        <Link href={home()} className="flex items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
                                <AppLogoIcon className="size-6 fill-white text-white" />
                            </div>
                        </Link>
                    </div>

                    {/* Background Effects (Noise & Blurs) */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                    <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl"></div>

                    {/* Bottom Left: Marketing Text */}
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <p className="text-sm font-medium tracking-wide text-white/80 uppercase">
                            Streamline your decisions
                        </p>
                        <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl lg:text-[3.25rem]">
                            Create polls, invite voters, and unlock powerful analytics.
                        </h2>
                    </div>
                </div>
            </div>

            {/* Right Side: Form Content */}
            <div className="flex h-full w-full flex-col items-center justify-center p-8 lg:p-14">
                <div className="w-full max-w-[420px] space-y-8">

                    {/* Header Group */}
                    <div className="space-y-6">
                        <Link
                            href={home()}
                            className="inline-flex"
                        >
                            <AppLogo className="size-40 fill-white text-white" />
                        </Link>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
                                {title}
                            </h1>
                            <p className="text-base text-zinc-500 dark:text-zinc-400">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="pt-2">
                        {children}
                    </div>
                </div>
            </div>
        </div>
        <Toaster />
        </>
    );
}
