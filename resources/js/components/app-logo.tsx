import { ImgHTMLAttributes } from 'react';

export default function AppLogo({
    className = '',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <>
            <img
                src="/images/boardco.svg"
                alt="BoardCo Logo"
                className={`h-10 dark:hidden ${className}`}
                {...props}
            />
            <img
                src="/images/boardco_white.svg"
                alt="BoardCo Logo"
                className={`hidden h-10 dark:block ${className}`}
                {...props}
            />
        </>
    );
}
