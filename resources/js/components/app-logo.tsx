import { ImgHTMLAttributes } from 'react';

export default function AppLogo({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <>
            <img
                src="/images/pollstack.svg"
                alt="Pollstack Logo"
                className={`h-10 dark:hidden ${className}`}
                {...props}
            />
            <img
                src="/images/pollstack_white.svg"
                alt="Pollstack Logo"
                className={`h-10 hidden dark:block ${className}`}
                {...props}
            />
        </>
    );
}
