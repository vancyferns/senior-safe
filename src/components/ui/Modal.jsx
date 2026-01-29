import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen = true, onClose, title, children, showClose = true }) => {
    if (isOpen === false) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-center justify-between p-4 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800">{title || ''}</h2>
                        {showClose && onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={title ? "p-4" : ""}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
