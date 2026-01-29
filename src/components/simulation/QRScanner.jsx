import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader'; // Using the installed library
import { Camera, X } from 'lucide-react';

// NOTE: On desktop/without HTTPS, camera might fail. 
// We provide a "Simulate Scan" button for testing.
const QRScanner = ({ onScan, onClose }) => {
    const [error, setError] = useState(null);

    const handleResult = (result, error) => {
        if (result) {
            onScan(result?.text);
        }
        if (error) {
            // Only log critical errors, ignore "no code found" frame noise
            if (error?.message?.includes("Permission")) {
                setError("Camera permission denied.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white/50 p-2 rounded-full text-slate-900"
                >
                    <X size={24} />
                </button>

                <h3 className="text-center py-4 font-bold text-lg bg-slate-100">Scan QR Code</h3>

                <div className="relative h-80 bg-black">
                    {!error ? (
                        <QrReader
                            onResult={handleResult}
                            constraints={{ facingMode: 'environment' }}
                            className="w-full h-full object-cover"
                            containerStyle={{ height: '100%' }}
                            videoStyle={{ objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                            <Camera size={48} className="mb-2 text-red-500" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Overlay Guide */}
                    <div className="absolute inset-0 border-4 border-brand-blue/50 pointer-events-none m-12 rounded-lg animate-pulse" />
                </div>

                <div className="p-4 bg-slate-50 flex flex-col gap-2">
                    <p className="text-xs text-center text-slate-500">
                        Point camera at a SeniorSafe or Cash Voucher QR code.
                    </p>
                    {/* Fallback for Desktop/Testing */}
                    <button
                        onClick={() => onScan('{"type":"SENIORSAFE_CASH","amt":50}')}
                        className="text-xs text-brand-blue underline text-center"
                    >
                        [Simulate Scan: ₹50 Voucher]
                    </button>
                    <button
                        onClick={() => onScan('http://fakepayment.com')}
                        className="text-xs text-red-500 underline text-center"
                    >
                        [Simulate Scan: Fake Link]
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
