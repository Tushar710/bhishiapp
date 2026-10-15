import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/authContext';
import { PaymentRecord, PaymentSchedule } from '../lib/types';
import { formatINR, formatDateTime, formatDate } from '../lib/formatters';
import { Receipt, Search, Filter, CheckCircle2, Clock, AlertCircle, Printer, Download } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';

export const UserPaymentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [activeReceipt, setActiveReceipt] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchPayments = async () => {
      try {
        const q = query(
          collection(db, 'payments'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const list: PaymentRecord[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PaymentRecord));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPayments(list);
      } catch (err) {
        console.warn('Error loading payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [currentUser]);

  const displayedPayments =
    filter === 'all' ? payments : payments.filter((p) => p.status === filter);

  const totalVerified = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Payments & Receipts Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your submitted installments, verification statuses, and download official receipts.
          </p>
        </div>

        {/* Total verified summary */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Verified Payments</p>
            <p className="text-lg font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
              {formatINR(totalVerified)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter strip */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl">
          {(['all', 'verified', 'pending'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`min-h-[36px] px-3.5 py-1.5 text-xs font-bold rounded-lg transition uppercase ${
                filter === st
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-500 px-3">
          {displayedPayments.length} records
        </span>
      </div>

      {/* Payment Records Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : displayedPayments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-xs">
          <Receipt className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-900">No Payment Records</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No payments have been recorded under the selected filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Receipt No</th>
                  <th className="py-3.5 px-4">Scheme / Group</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Mode / Ref</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {pay.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {pay.schemeName || 'Monthly Bhishi Group'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(pay.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="uppercase text-[11px] font-semibold text-slate-800">{pay.paymentMethod}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate max-w-[130px]">
                        {pay.transactionRef}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDateTime(pay.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase ${
                          pay.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : pay.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {pay.status === 'verified' ? (
                        <button
                          onClick={() => setActiveReceipt(pay)}
                          className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition inline-flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal payment={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  );
};
