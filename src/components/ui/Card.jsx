import React from 'react';

// Senior-friendly card variants - clean separation from white background
const Card = ({ children, className = "", onClick, variant = "default", hover = true }) => {
    const variants = {
        // Default - Slate-100 background separates from white page
        default: "bg-slate-100 border border-slate-200 hover:border-blue-800 shadow-sm hover:shadow-md",
        // White card with border - for forms and inputs
        white: "bg-white border-2 border-slate-200 hover:border-blue-800 shadow-sm hover:shadow-md",
        // Gradient - subtle highlight for important sections
        gradient: "bg-slate-50 border-2 border-blue-100 shadow-md hover:shadow-lg hover:border-blue-800",
        // Elevated - stands out more
        elevated: "bg-white border border-slate-200 shadow-lg hover:shadow-xl",
    };

    return (
        <div
            onClick={onClick}
            className={`
                rounded-2xl p-4 transition-all duration-300
                ${variants[variant]}
                ${hover ? 'cursor-pointer' : ''}
                ${onClick ? 'active:scale-[0.98]' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default Card;
