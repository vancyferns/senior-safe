import React from 'react';

const Card = ({ children, className = "", onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl border-2 border-slate-200 shadow-sm p-4 hover:border-brand-blue transition-colors cursor-pointer ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
