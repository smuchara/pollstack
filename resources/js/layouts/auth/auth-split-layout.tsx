import AppLogoIcon from '@/components/app-logo-icon';
import { Toaster } from '@/components/ui/toaster';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;
    useToastNotifications();

    return (
        <div className="relative grid min-h-dvh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left Panel - Hero Section */}
            <div className="relative hidden h-full flex-col justify-between bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-10 text-gray-800 lg:flex dark:border-r dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white">
                {/* Logo */}
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-2 text-xl font-semibold transition-transform hover:scale-105"
                >
                    <AppLogoIcon className="size-10 fill-current text-indigo-600 drop-shadow-sm dark:text-indigo-400" />
                    <span className="drop-shadow-sm dark:text-white">{name}</span>
                </Link>

                {/* Center Content with Dashboard Preview */}
                <div className="relative z-20 flex flex-col items-center justify-center space-y-6">
                    <div className="space-y-3 text-center">
                        <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl dark:text-white">
                            Manage Your Polls
                            <br />
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                                Effortlessly
                            </span>
                        </h2>
                        <p className="text-base text-gray-600 dark:text-gray-300">
                            Create, distribute, and analyze polls with powerful insights and real-time results.
                        </p>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="w-full max-w-2xl">
                        <img
                            src="/images/onboarding.png"
                            alt="Onboarding Dashboard"
                            className="w-full rounded-xl border border-gray-200/20 shadow-2xl"
                        />
                    </div>
                </div>

                {/* Quote */}
                {quote && (
                    <div className="relative z-20">
                        <blockquote className="space-y-2 rounded-lg border-l-4 border-indigo-300 bg-white/50 p-5 backdrop-blur-sm dark:border-indigo-600 dark:bg-slate-800/50">
                            <p className="text-sm italic leading-relaxed text-gray-700 dark:text-gray-300">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                — {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
                    {/* Mobile Logo */}
                    <Link
                        href={home()}
                        className="flex items-center justify-center gap-2 lg:hidden"
                    >
                        <AppLogoIcon className="size-10 fill-current text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">
                            {name}
                        </span>
                    </Link>

                    {/* Title & Description */}
                    <div className="flex flex-col gap-3 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {title}
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {/* Form Content */}
                    {children}
                </div>
            </div>
            <Toaster />
        </div>
    );
}
