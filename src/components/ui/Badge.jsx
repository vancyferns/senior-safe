import React from 'react';

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
    // Senior-friendly badge colors - high contrast
    const variants = {
        default: 'bg-slate-200 text-slate-900',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-emerald-100 text-emerald-600',
        danger: 'bg-red-100 text-red-600',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
        gradient: 'bg-blue-800 text-white shadow-md',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    return (
        <span
            className={`
                inline-flex items-center justify-center
                font-semibold rounded-full
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
        >
            {children}
        </span>
    );
};

export default Badge;
