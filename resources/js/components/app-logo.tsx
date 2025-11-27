import { ImgHTMLAttributes } from 'react';

export default function AppLogo({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="./images/pollstack.svg"
            alt="Pollstack Logo"
            className={`h-auto ${className}`}
            {...props}
        />
    );
}
