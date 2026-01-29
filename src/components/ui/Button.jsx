import React from 'react';

const variants = {
    primary: 'bg-brand-blue text-white hover:bg-blue-600 active:bg-blue-700',
    success: 'bg-brand-green text-white hover:bg-emerald-600 active:bg-emerald-700',
    green: 'bg-brand-green text-white hover:bg-emerald-600 active:bg-emerald-700',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    outline: 'bg-white text-brand-blue border-2 border-brand-blue hover:bg-blue-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
};

const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
};

const Button = ({
    children,
    variant = 'primary',
    color, // alias for variant
    size = 'md',
    className = '',
    disabled = false,
    fullWidth = false,
    onClick,
    type = 'button',
    ...props
}) => {
    const variantKey = color || variant;
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                font-bold rounded-xl transition-all shadow-sm
                active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variantKey] || variants.primary}
                ${sizes[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
