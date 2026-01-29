import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen = true, onClose, title, children, showClose = true }) => {
    if (isOpen === false) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div 
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-900">{title || ''}</h2>
                        {showClose && onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 rounded-full transition-all"
                                aria-label="Close"
                            >
                                <X size={22} className="text-slate-600" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={title ? "p-5" : "p-5"}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
