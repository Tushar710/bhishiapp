import React, { useState } from 'react';
import { PaymentSchedule, PaymentMethod } from '../lib/types';
import { formatINR } from '../lib/formatters';
import { db } from '../lib/firebase';
import { doc, setDoc, collection, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/authContext';
import { generateReceiptNumber } from '../lib/formatters';
import { sendNotification, logAdminAction } from '../lib/activity';
import { X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PaymentSubmitModalProps {
  schedule: PaymentSchedule;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentSubmitModal: React.FC<PaymentSubmitModalProps> = ({
  schedule,
  onClose,
  onSuccess,
}) => {
  const { currentUser, userData } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (method !== 'cash' && !transactionRef.trim()) {
      setError('Please provide the UPI Transaction ID, UTR, or bank reference number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const paymentRef = doc(collection(db, 'payments'));
      const receiptNo = generateReceiptNumber();

      await setDoc(paymentRef, {
        id: paymentRef.id,
        receiptNumber: receiptNo,
        scheduleId: schedule.id,
        schemeId: schedule.schemeId,
        schemeName: schedule.schemeName || 'Monthly Bhishi Group',
        userId: currentUser.uid,
        userFullName: userData?.fullName || currentUser.email || 'Member',
        amount: schedule.scheduledAmount,
        paymentMethod: method,
        transactionRef: transactionRef.trim() || 'CASH-SUBMISSION',
        notes: notes.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // Update schedule status to partially submitted / pending review
      await updateDoc(doc(db, 'paymentSchedules', schedule.id), {
        updatedAt: new Date().toISOString(),
      });

      // Send confirmation notification to user
      await sendNotification(
        currentUser.uid,
        'Payment Submitted for Verification',
        `Your contribution of ${formatINR(schedule.scheduledAmount)} for Month ${schedule.monthIndex} was submitted. An administrator will review and verify your record shortly.`,
        'payment',
        '/payments'
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Payment submission failed:', err);
      setError(err?.message || 'Failed to submit payment. Please verify your connection.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Submit Monthly Installment</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Month #{schedule.monthIndex} · {schedule.schemeName || 'Bhishi Scheme'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Due Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-medium">Scheduled Contribution</span>
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1 text-emerald-600">
              {formatINR(schedule.scheduledAmount)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['upi', 'bank_transfer', 'cash'] as PaymentMethod[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg border transition uppercase ${
                    method === m
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m === 'bank_transfer' ? 'Bank / NEFT' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Reference Input */}
          {method !== 'cash' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {method === 'upi' ? 'UPI UTR / Reference ID' : 'Bank Transaction Reference'}
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder={method === 'upi' ? 'e.g. 428198273918' : 'e.g. AXISN00918239'}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enter the 12-digit UPI UTR number or bank transfer reference from your payment receipt.
              </p>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via PhonePe / GPay"
              className="w-full min-h-[44px] px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Regulatory & Verification Disclaimer */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Verification Requirement</p>
              <p className="mt-0.5">
                Payments are verified manually by group managers against bank records. An official receipt number is generated upon admin verification.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
