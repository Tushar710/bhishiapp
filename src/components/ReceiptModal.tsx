import React from 'react';
import { PaymentRecord } from '../lib/types';
import { formatINR, formatDateTime } from '../lib/formatters';
import { Printer, X, CheckCircle, ShieldCheck, Download } from 'lucide-react';

interface ReceiptModalProps {
  payment: PaymentRecord;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-250 animate-in fade-in zoom-in-95 duration-200 text-slate-900 my-8">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight">Official Payment Receipt</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              aria-label="Print receipt"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-medium px-2.5 gap-1.5"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="p-6 sm:p-8 space-y-6 bg-white">
          {/* Header & Logo */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  ₹
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">BhishiPro</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">Community Savings & Rotation Ledger</p>
              <p className="text-[11px] text-slate-400">ISO-Compliant Verified Transaction</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified & Settled
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1.5">
                {payment.receiptNumber}
              </p>
            </div>
          </div>

          {/* Amount Showcase */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-center">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Amount Paid</p>
            <p className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1 text-emerald-600">
              {formatINR(payment.amount)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Indian Rupees (INR)
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Member Name</p>
              <p className="font-semibold text-slate-800 mt-0.5">{payment.userFullName || 'Authorized Member'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Bhishi Scheme</p>
              <p className="font-semibold text-slate-800 mt-0.5">{payment.schemeName || 'Monthly Bhishi Group'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Payment Mode</p>
              <p className="font-semibold text-slate-800 uppercase mt-0.5">{payment.paymentMethod}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Transaction Reference</p>
              <p className="font-mono font-semibold text-slate-800 mt-0.5 truncate">
                {payment.transactionRef || 'MANUAL-CASH-CONFIRM'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Date & Time</p>
              <p className="text-slate-800 mt-0.5">{formatDateTime(payment.createdAt)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Verification Status</p>
              <p className="text-emerald-700 font-semibold mt-0.5">Admin Verified</p>
            </div>
          </div>

          {payment.notes && (
            <div className="text-xs p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-500">Remarks: </span>
              <span className="text-slate-700">{payment.notes}</span>
            </div>
          )}

          {/* Verification Stamp & Notice */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              <p>Computer generated verified receipt.</p>
              <p>Preserve this document for end-of-scheme audit.</p>
            </div>
            <div className="text-right">
              <div className="inline-block p-1.5 border border-dashed border-emerald-500/80 rounded text-emerald-700 font-bold text-[10px] tracking-wider uppercase">
                BhishiPro Verified
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download / Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
