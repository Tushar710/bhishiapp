import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PaymentRecord, BhishiScheme, PaymentSchedule, PaymentMethod } from '../lib/types';
import { formatINR, formatDateTime, generateReceiptNumber } from '../lib/formatters';
import { useAuth } from '../lib/authContext';
import { logAdminAction, sendNotification } from '../lib/activity';
import {
  CreditCard,
  Search,
  Plus,
  X,
  AlertCircle,
  Download,
  Receipt,
  XCircle,
} from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';

export const AdminPaymentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [schemes, setSchemes] = useState<BhishiScheme[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('all');

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<PaymentRecord | null>(null);

  // Manual payment modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [targetScheduleId, setTargetScheduleId] = useState('');
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualMethod, setManualMethod] = useState<PaymentMethod>('cash');
  const [manualRef, setManualRef] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [savingManual, setSavingManual] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [paySnap, schemeSnap, schedSnap] = await Promise.all([
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'bhishiSchemes')),
        getDocs(collection(db, 'paymentSchedules')),
      ]);

      const pList: PaymentRecord[] = [];
      paySnap.forEach((d) => pList.push({ id: d.id, ...d.data() } as PaymentRecord));
      pList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(pList);

      const sList: BhishiScheme[] = [];
      schemeSnap.forEach((d) => sList.push({ id: d.id, ...d.data() } as BhishiScheme));
      setSchemes(sList);

      const schList: PaymentSchedule[] = [];
      schedSnap.forEach((d) => schList.push({ id: d.id, ...d.data() } as PaymentSchedule));
      setSchedules(schList);
    } catch (err) {
      console.warn('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyPayment = async (pay: PaymentRecord) => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);

      // 1. Mark payment as verified
      const payRef = doc(db, 'payments', pay.id);
      batch.update(payRef, {
        status: 'verified',
        verifiedByAdminId: currentUser.uid,
        verifiedAt: new Date().toISOString(),
      });

      // 2. Update payment schedule balance
      if (pay.scheduleId) {
        const schedRef = doc(db, 'paymentSchedules', pay.scheduleId);
        const sched = schedules.find((s) => s.id === pay.scheduleId);
        if (sched) {
          const newPaid = (sched.paidAmount || 0) + pay.amount;
          const newBal = Math.max(0, sched.scheduledAmount - newPaid);
          batch.update(schedRef, {
            paidAmount: newPaid,
            outstandingBalance: newBal,
            status: newBal === 0 ? 'paid' : 'due',
            paidAt: newBal === 0 ? new Date().toISOString() : sched.paidAt,
          });
        }
      }

      await batch.commit();

      // 3. Send notification to member
      await sendNotification(
        pay.userId,
        'Payment Verified & Recorded!',
        `Your payment of ${formatINR(pay.amount)} (${pay.receiptNumber}) was verified by the administrator.`,
        'payment',
        '/payments'
      );

      // 4. Audit trail
      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'VERIFY_PAYMENT',
        'payments',
        pay.id,
        `Verified payment ${pay.receiptNumber} (${formatINR(pay.amount)})`
      );

      fetchData();
    } catch (err) {
      console.error('Error verifying payment:', err);
    }
  };

  const handleRejectPayment = async (pay: PaymentRecord) => {
    if (!currentUser) return;
    const reason = window.prompt('Enter mandatory rejection reason (e.g. UTR mismatch):');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'payments', pay.id), {
        status: 'rejected',
        notes: `Rejected: ${reason}`,
        verifiedByAdminId: currentUser.uid,
        verifiedAt: new Date().toISOString(),
      });

      await sendNotification(
        pay.userId,
        'Payment Verification Rejected',
        `Your submitted payment of ${formatINR(pay.amount)} could not be verified: ${reason}`,
        'payment',
        '/payments'
      );

      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'REJECT_PAYMENT',
        'payments',
        pay.id,
        `Rejected payment ${pay.receiptNumber}. Reason: ${reason}`
      );

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const targetSched = schedules.find((s) => s.id === targetScheduleId);
    if (!targetSched) {
      setModalError('Please select a valid scheduled due installment.');
      return;
    }

    if (!manualAmount || manualAmount <= 0) {
      setModalError('Please specify valid payment amount.');
      return;
    }

    setSavingManual(true);
    setModalError(null);

    try {
      const batch = writeBatch(db);
      const payRef = doc(collection(db, 'payments'));
      const receiptNo = generateReceiptNumber();

      const newPayment: PaymentRecord = {
        id: payRef.id,
        receiptNumber: receiptNo,
        scheduleId: targetSched.id,
        schemeId: targetSched.schemeId,
        schemeName: targetSched.schemeName || 'Monthly Bhishi Circle',
        userId: targetSched.userId,
        userFullName: 'Member',
        amount: Number(manualAmount),
        paymentMethod: manualMethod,
        transactionRef: manualRef.trim() || 'MANUAL-ADMIN-ENTRY',
        notes: manualNotes.trim(),
        status: 'verified',
        verifiedByAdminId: currentUser.uid,
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      batch.set(payRef, newPayment);

      const schedRef = doc(db, 'paymentSchedules', targetSched.id);
      const newPaid = (targetSched.paidAmount || 0) + Number(manualAmount);
      const newBal = Math.max(0, targetSched.scheduledAmount - newPaid);
      batch.update(schedRef, {
        paidAmount: newPaid,
        outstandingBalance: newBal,
        status: newBal === 0 ? 'paid' : 'due',
        paidAt: newBal === 0 ? new Date().toISOString() : targetSched.paidAt,
      });

      await batch.commit();

      await sendNotification(
        targetSched.userId,
        'Direct Payment Logged',
        `An offline payment of ${formatINR(manualAmount)} was recorded by administrator. Receipt: ${receiptNo}`,
        'payment',
        '/payments'
      );

      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'RECORD_MANUAL_PAYMENT',
        'payments',
        payRef.id,
        `Recorded manual payment ${receiptNo} of ${formatINR(manualAmount)} for schedule ${targetSched.id}`
      );

      setShowManualModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || 'Failed to record manual payment.');
    } finally {
      setSavingManual(false);
    }
  };

  // Export CSV Report of all filtered collections
  const handleExportCSV = () => {
    const headers = [
      'Receipt Number',
      'Scheme Name',
      'Member Name',
      'Amount',
      'Method',
      'Transaction Ref',
      'Status',
      'Submitted Date',
      'Verified Date',
    ];

    const rows = filteredPayments.map((p) => [
      p.receiptNumber,
      `"${p.schemeName || ''}"`,
      `"${p.userFullName || ''}"`,
      p.amount,
      p.paymentMethod,
      `"${p.transactionRef || ''}"`,
      p.status,
      p.createdAt,
      p.verifiedAt || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BhishiPro_Collections_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.userFullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionRef || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    const matchesScheme = selectedSchemeId === 'all' ? true : p.schemeId === selectedSchemeId;
    return matchesSearch && matchesStatus && matchesScheme;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Collections & Payment Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit member UPI UTRs, record direct cash receipts, and issue compliant transaction receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setShowManualModal(true);
              setModalError(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Record Cash / Bank Payment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt no, member, UTR..."
            className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Scheme dropdown filter */}
          <select
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
            className="min-h-[44px] px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="all">All Bhishi Schemes</option>
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.schemeCode})
              </option>
            ))}
          </select>

          {/* Status selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg transition uppercase ${
                  statusFilter === st
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-2xs">
          <CreditCard className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-900">No Payments in Ledger</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No transactions match the active filter criteria. Record a manual payment or wait for member submissions.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Receipt No</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Scheme</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method & UTR</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {pay.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{pay.userFullName || 'Member'}</p>
                      <p className="text-[10px] font-mono text-slate-400">{pay.userId.slice(0, 10)}...</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {pay.schemeName || 'Monthly Bhishi Group'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 tabular-nums">
                      {formatINR(pay.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="uppercase text-[10px] font-semibold text-slate-600 block">
                        {pay.paymentMethod}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 block truncate max-w-[140px]">
                        {pay.transactionRef}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDateTime(pay.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase border ${
                          pay.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : pay.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {pay.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerifyPayment(pay)}
                            className="min-h-[34px] px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs"
                          >
                            Verify & Settle
                          </button>
                          <button
                            onClick={() => handleRejectPayment(pay)}
                            className="min-h-[34px] px-2 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-650 hover:text-rose-700 text-[11px] transition border border-slate-200"
                            title="Reject Payment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveReceipt(pay)}
                          className="min-h-[34px] px-3.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px] transition inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Cash / Bank Payment</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRecordManualPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Due Schedule to Settle
                </label>
                <select
                  required
                  value={targetScheduleId}
                  onChange={(e) => {
                    setTargetScheduleId(e.target.value);
                    const s = schedules.find((item) => item.id === e.target.value);
                    if (s) setManualAmount(s.outstandingBalance || s.scheduledAmount);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="">-- Choose Schedule Item --</option>
                  {schedules
                    .filter((s) => s.status !== 'paid')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.schemeName} · Month #{s.monthIndex} ({formatINR(s.scheduledAmount)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={manualAmount}
                  onChange={(e) => setManualAmount(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value as PaymentMethod)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="cash">Direct Cash Collection</option>
                  <option value="bank_transfer">Bank / NEFT / IMPS</option>
                  <option value="upi">UPI Transfer</option>
                  <option value="cheque">Cheque Deposit</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction / UTR Reference
                </label>
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="e.g. CASH-RECD-PATIL or UTR12345"
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Remarks</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Received in person at shop"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual || !targetScheduleId}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition disabled:opacity-50 shadow-sm"
                >
                  {savingManual ? 'Recording...' : 'Record & Settle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {activeReceipt && (
        <ReceiptModal payment={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  );
};
