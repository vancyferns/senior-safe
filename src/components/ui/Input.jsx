import React from 'react';

const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    className = '',
    icon: Icon,
    ...props
}) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-semibold text-slate-900">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <Icon size={20} />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
                        w-full p-3 
                        ${Icon ? 'pl-11' : ''}
                        border-2 rounded-xl
                        transition-all duration-300
                        outline-none
                        ${error 
                            ? 'border-red-600 focus:border-red-700 bg-red-50' 
                            : 'border-slate-300 focus:border-blue-800 bg-white'
                        }
                        hover:border-slate-400
                        focus:ring-2 focus:ring-blue-100
                        disabled:bg-slate-100 disabled:cursor-not-allowed
                        text-lg text-slate-900
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                    <span>⚠</span> {error}
                </p>
            )}
        </div>
    );
};

export default Input;
