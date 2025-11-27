import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ShieldCheck,
    Clock3,
    BarChart3,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Vote,
    Menu,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome({
                                    canRegister = true,
                                }: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            {/*
                Main Container
                Uses semantic variables (bg-background, text-foreground) from your CSS
            */}
            <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-300 selection:bg-primary/20 selection:text-primary">

                {/* Background glow / grid - Adapted for Light/Dark */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                    {/* Light Mode: Subtle gradients | Dark Mode: Deep gradients */}
                    <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
                    <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl dark:bg-purple-600/10" />

                    {/* Vignette for focus */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_0,var(--background)_70%)] opacity-80" />

                    {/* Grid Pattern: Darker lines in light mode, Lighter lines in dark mode */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.15] dark:opacity-[0.05]" />
                </div>

                {/* Top nav */}
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 dark:bg-primary/20 dark:ring-primary/40">
                            <AppLogoIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold tracking-tight text-foreground">
                                Pollstack
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                Secure Digital Voting
                            </span>
                        </div>
                    </div>

                    <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
                        <a href="#features" className="transition-colors hover:text-primary">
                            Features
                        </a>
                        <a href="#security" className="transition-colors hover:text-primary">
                            Security
                        </a>
                        <a href="#results" className="transition-colors hover:text-primary">
                            Live Results
                        </a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Link
                                href={dashboard()}
                                className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                            >
                                Dashboard
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
                                    >
                                        Get Started
                                    </Link>
                                )}
                            </>
                        )}
                        {/* Mobile Menu Trigger */}
                        <button className="md:hidden text-foreground">
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-16 pt-10 lg:flex-row lg:items-center lg:gap-20 lg:px-8 lg:pb-24 lg:pt-12">

                    {/* Left: Copy */}
                    <section className="relative z-10 mb-12 max-w-2xl lg:mb-0 lg:flex-1">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            Audited & Encrypted
                        </div>

                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                            The Future of <br className="hidden lg:block" />
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                                Decentralized Governance
                            </span>
                        </h1>

                        <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                            Launch organization-wide votes in seconds. Verify every ballot on-chain.
                            Watch results update in real-time. Secure, transparent, and built for modern teams.
                        </p>

                        {/* CTAs */}
                        <div className="mb-10 flex flex-wrap items-center gap-4">
                            <Link
                                href={isLoggedIn ? dashboard() : register()}
                                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-transform hover:scale-105 hover:bg-primary/90"
                            >
                                {isLoggedIn ? 'Start a Vote' : 'Create Free Account'}
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <a
                                href="#results"
                                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                            >
                                View Demo
                            </a>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center gap-6 border-t border-border pt-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                <span>End-to-end Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-primary" />
                                <span>Real-time Settlement</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                <span>99.9% Uptime SLA</span>
                            </div>
                        </div>
                    </section>

                    {/* Right: Visual Card (Simulates App UI) */}
                    <section className="relative z-10 w-full max-w-md lg:flex-1">

                        {/* Decorative glow behind card */}
                        <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-primary/30 to-purple-600/30 opacity-40 blur-2xl dark:opacity-30" />

                        {/* The Card Container */}
                        <div className="relative rounded-[2rem] border border-border/50 bg-background/50 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/20 dark:bg-card/40 dark:ring-white/5">
                            <div className="relative flex h-full flex-col justify-between rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">

                                {/* Card Header */}
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <BarChart3 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">AGM Election</h3>
                                            <p className="text-[10px] text-muted-foreground">Live • Block #8921</p>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Active
                                    </span>
                                </div>

                                {/* Card Body (Stats) */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-muted/50 p-3">
                                            <p className="text-[10px] font-medium text-muted-foreground">Turnout</p>
                                            <p className="mt-1 text-2xl font-bold text-primary">78.3%</p>
                                        </div>
                                        <div className="rounded-xl bg-muted/50 p-3">
                                            <p className="text-[10px] font-medium text-muted-foreground">Votes Cast</p>
                                            <p className="mt-1 text-2xl font-bold text-foreground">4,892</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar Item */}
                                    <div className="rounded-xl border border-border p-4">
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span className="text-xs font-medium text-foreground">Proposal A: New Charter</span>
                                            </div>
                                            <span className="text-xs font-bold text-foreground">68%</span>
                                        </div>

                                        <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                                            <div className="h-full w-[68%] rounded-full bg-primary" />
                                        </div>

                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>Yes: 3,326</span>
                                            <span>No: 1,174</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] text-muted-foreground">
                                                U{i}
                                            </div>
                                        ))}
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-[8px] font-medium text-primary-foreground">
                                            +4k
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Verified by Zero-Knowledge Proof
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
