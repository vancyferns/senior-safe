import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeGenerator = ({ amount }) => {
    const [generated, setGenerated] = useState(false);
    const [createdTime] = useState(() => Date.now());

    // Create a unique voucher payload
    const voucherData = JSON.stringify({
        type: 'SENIORSAFE_CASH',
        amt: parseInt(amount) || 0,
        created: createdTime
    });

    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Cash Voucher</h3>

            <div className="p-4 bg-white border-4 border-slate-900 rounded-lg mb-2">
                {generated ? (
                    <QRCodeSVG value={voucherData} size={180} level={"H"} />
                ) : (
                    <div className="w-[180px] h-[180px] bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                        Tap to Generate
                    </div>
                )}
            </div>

            {!generated ? (
                <button
                    onClick={() => setGenerated(true)}
                    className="bg-brand-blue text-white py-2 px-6 rounded-lg font-bold shadow-md active:scale-95 transition-transform"
                >
                    Generate Code
                </button>
            ) : (
                <p className="text-sm text-green-600 font-semibold animate-pulse">
                    Ready to Scan! (Value: ₹{amount})
                </p>
            )}
        </div>
    );
};

export default QRCodeGenerator;
