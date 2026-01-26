import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className = '',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/boardcoicon_white.svg"
            alt="BoardCo Logo"
            className={`h-auto ${className}`}
            {...props}
        />
    );
}
