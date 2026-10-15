import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PayoutRecord, BhishiScheme, Membership } from '../lib/types';
import { formatINR, formatDateTime } from '../lib/formatters';
import { useAuth } from '../lib/authContext';
import { logAdminAction, sendNotification } from '../lib/activity';
import {
  Gift,
  Plus,
  X,
  AlertCircle,
  Printer,
  FileText,
} from 'lucide-react';

export const AdminPayoutsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [schemes, setSchemes] = useState<BhishiScheme[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [monthIndex, setMonthIndex] = useState<number>(1);
  const [grossAmount, setGrossAmount] = useState<number>(100000);
  const [deductions, setDeductions] = useState<number>(0);
  const [scheduledDate, setScheduledDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Statement view modal
  const [activeStatement, setActiveStatement] = useState<PayoutRecord | null>(null);

  const fetchPayoutsAndSchemes = async () => {
    try {
      const [poSnap, scSnap, memSnap] = await Promise.all([
        getDocs(collection(db, 'payouts')),
        getDocs(collection(db, 'bhishiSchemes')),
        getDocs(collection(db, 'memberships')),
      ]);

      const poList: PayoutRecord[] = [];
      poSnap.forEach((d) => poList.push({ id: d.id, ...d.data() } as PayoutRecord));
      poList.sort((a, b) => b.monthIndex - a.monthIndex);
      setPayouts(poList);

      const scList: BhishiScheme[] = [];
      scSnap.forEach((d) => scList.push({ id: d.id, ...d.data() } as BhishiScheme));
      setSchemes(scList);

      const mList: Membership[] = [];
      memSnap.forEach((d) => mList.push({ id: d.id, ...d.data() } as Membership));
      setMemberships(mList);
    } catch (err) {
      console.warn('Error loading payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutsAndSchemes();
  }, []);

  const handleSchemeChange = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    const s = schemes.find((item) => item.id === schemeId);
    if (s) {
      setGrossAmount(s.monthlyContribution * s.totalMembers);
      // find next unscheduled month
      const schemePayouts = payouts.filter((p) => p.schemeId === schemeId);
      const nextM = schemePayouts.length + 1;
      setMonthIndex(nextM);

      // Pre-select the member whose assigned rotationIndex === nextM
      const matchingMem = memberships.find(
        (m) => m.schemeId === schemeId && m.rotationIndex === nextM
      );
      if (matchingMem) {
        setSelectedMembershipId(matchingMem.id);
      }
    }
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const scheme = schemes.find((s) => s.id === selectedSchemeId);
    const mem = memberships.find((m) => m.id === selectedMembershipId);

    if (!scheme || !mem) {
      setError('Please select a valid scheme and recipient member.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payoutRef = doc(collection(db, 'payouts'));
      const net = Math.max(0, grossAmount - deductions);

      const newPayout: PayoutRecord = {
        id: payoutRef.id,
        schemeId: scheme.id,
        schemeName: scheme.name,
        membershipId: mem.id,
        userId: mem.userId,
        userFullName: mem.userFullName || 'Member',
        monthIndex: Number(monthIndex),
        grossAmount: Number(grossAmount),
        deductions: Number(deductions),
        netAmount: net,
        paymentMethod: 'bank_transfer',
        scheduledDate,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };

      await setDoc(payoutRef, newPayout);

      await sendNotification(
        mem.userId,
        'Rotation Payout Turn Scheduled!',
        `Your rotation payout of ${formatINR(net)} for ${scheme.name} (Month #${monthIndex}) has been queued.`,
        'payout',
        '/my-bhishi'
      );

      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'SCHEDULE_PAYOUT',
        'payouts',
        payoutRef.id,
        `Scheduled payout of ${formatINR(net)} to ${mem.userFullName} for Month #${monthIndex}`
      );

      setShowScheduleModal(false);
      fetchPayoutsAndSchemes();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to schedule payout.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisbursePayout = async (po: PayoutRecord) => {
    if (!currentUser) return;
    const refNo = window.prompt('Enter Bank Disbursement Reference / UTR Number:');
    if (!refNo) return;

    try {
      await updateDoc(doc(db, 'payouts', po.id), {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        referenceNumber: refNo.trim(),
      });

      await sendNotification(
        po.userId,
        'Rotation Payout Disbursed!',
        `Your rotation pot of ${formatINR(po.netAmount)} has been credited via bank transfer. Ref: ${refNo.trim()}`,
        'payout',
        '/my-bhishi'
      );

      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'DISBURSE_PAYOUT',
        'payouts',
        po.id,
        `Disbursed payout ${po.id} of ${formatINR(po.netAmount)} to ${po.userFullName}. Ref: ${refNo.trim()}`
      );

      fetchPayoutsAndSchemes();
    } catch (err) {
      console.error(err);
    }
  };

  const eligibleMembers = memberships.filter(
    (m) => m.schemeId === selectedSchemeId && (m.status === 'active' || m.status === 'approved')
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Rotation Payouts Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage sequential monthly pot allocation, documented fee deductions, and verifiable payout statements.
          </p>
        </div>

        <button
          onClick={() => {
            setShowScheduleModal(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Rotation Payout</span>
        </button>
      </div>

      {/* Payouts Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-2xs">
          <Gift className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-900">No Payouts Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Schedule the sequential rotation turns for active Bhishi schemes according to member rotation slots.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Rotation Month</th>
                  <th className="py-3.5 px-4">Recipient Member</th>
                  <th className="py-3.5 px-4">Scheme</th>
                  <th className="py-3.5 px-4">Gross Pot</th>
                  <th className="py-3.5 px-4">Deductions</th>
                  <th className="py-3.5 px-4">Net Disbursed</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      Month #{po.monthIndex}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{po.userFullName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{po.userId.slice(0, 10)}...</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{po.schemeName}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-900">
                      {formatINR(po.grossAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-amber-700">
                      {po.deductions ? formatINR(po.deductions) : '₹0'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 tabular-nums">
                      {formatINR(po.netAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase border ${
                          po.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {po.status !== 'paid' ? (
                          <button
                            onClick={() => handleDisbursePayout(po)}
                            className="min-h-[34px] px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs"
                          >
                            Disburse
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveStatement(po)}
                            className="min-h-[34px] px-3.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px] transition inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Statement</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Payout Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Rotation Payout</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreatePayout} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Bhishi Scheme</label>
                <select
                  required
                  value={selectedSchemeId}
                  onChange={(e) => handleSchemeChange(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="">-- Choose Scheme --</option>
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.schemeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recipient Member (Eligible Active Members)
                </label>
                <select
                  required
                  value={selectedMembershipId}
                  onChange={(e) => setSelectedMembershipId(e.target.value)}
                  disabled={!selectedSchemeId}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-50"
                >
                  <option value="">-- Choose Member --</option>
                  {eligibleMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.userFullName} · Rotation Month #{m.rotationIndex || '?'} ({m.membershipNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Month Index</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={monthIndex}
                    onChange={(e) => setMonthIndex(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gross Pot (₹)</label>
                  <input
                    type="number"
                    required
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 font-mono rounded-xl bg-slate-50 border border-slate-200 text-emerald-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deductions / Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 font-mono rounded-xl bg-slate-50 border border-slate-200 text-amber-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Net Disbursement</label>
                  <div className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 font-mono font-bold text-emerald-900">
                    {formatINR(Math.max(0, grossAmount - deductions))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Payout Date</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Statement Modal */}
      {activeStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Payout Statement</h3>
                <p className="text-xs text-slate-500">BhishiPro Rotation Settlement</p>
              </div>
              <button
                onClick={() => setActiveStatement(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center">
                <p className="text-emerald-800 font-medium">Net Disbursed Amount</p>
                <p className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums mt-0.5">
                  {formatINR(activeStatement.netAmount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Recipient Member</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{activeStatement.userFullName}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Rotation Month</p>
                  <p className="font-semibold text-slate-900 mt-0.5">Month #{activeStatement.monthIndex}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Gross Pool Collection</p>
                  <p className="font-mono font-semibold text-slate-900 mt-0.5">{formatINR(activeStatement.grossAmount)}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Administrative Deduction</p>
                  <p className="font-mono font-semibold text-slate-900 mt-0.5">{formatINR(activeStatement.deductions)}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Disbursement UTR</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{activeStatement.referenceNumber || 'BANK-DISBURSED'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Disbursed Date</p>
                  <p className="text-slate-900 mt-0.5">{formatDateTime(activeStatement.paidAt)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
