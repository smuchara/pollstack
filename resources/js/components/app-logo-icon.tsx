import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="./images/pollstackicon_white.svg"
            alt="Pollstack Logo"
            className={`h-auto ${className}`}
            {...props}
        />
    );
}
