import React from 'react';

const Loader = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-6 h-6 border-2',
        md: 'w-10 h-10 border-3',
        lg: 'w-16 h-16 border-4',
    };

    return (
        <div className={`inline-block ${sizes[size]} border-blue-800 border-t-transparent rounded-full animate-spin ${className}`}></div>
    );
};

export const LoaderDots = ({ className = '' }) => {
    return (
        <div className={`flex gap-1 ${className}`}>
            <div className="w-2 h-2 bg-blue-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    );
};

export const LoaderPulse = ({ className = '' }) => {
    return (
        <div className={`relative w-16 h-16 ${className}`}>
            <div className="absolute inset-0 bg-blue-800 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 bg-blue-800 rounded-full"></div>
        </div>
    );
};

export default Loader;
