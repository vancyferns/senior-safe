import React from 'react';

// Senior-friendly button variants - solid colors, high contrast, clear actions
const variants = {
    // Royal Blue - Primary action ("If it's blue, I can click it")
    primary: 'bg-blue-800 text-white hover:bg-blue-900 shadow-lg hover:shadow-xl',
    // Emerald Green - Success actions
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl',
    // Signal Red - Danger/Alert actions
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl',
    // Outline - Secondary actions with clear border
    outline: 'bg-white text-blue-800 border-2 border-blue-800 hover:bg-blue-800 hover:text-white shadow-md hover:shadow-lg',
    // Ghost - Subtle actions
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 shadow-none hover:shadow-md',
    // Glass - For overlays (less common)
    glass: 'bg-white/90 text-blue-800 border border-slate-200 hover:bg-white shadow-lg hover:shadow-xl',
};

const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
};

const Button = React.forwardRef(({
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
}, ref) => {
    const variantKey = color || variant;
    return (
        <button
            ref={ref}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative font-bold rounded-xl transition-all duration-300
                active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                ${variants[variantKey] || variants.primary}
                ${sizes[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            {...props}
        >
            <span className="relative z-10">{children}</span>
        </button>
    );
});

export default Button;
