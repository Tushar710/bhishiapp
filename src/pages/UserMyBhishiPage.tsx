import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/authContext';
import { Membership, PaymentSchedule } from '../lib/types';
import { formatINR, formatDate } from '../lib/formatters';
import { Layers, Calendar, RotateCw, CheckCircle2, Clock, ArrowRight, ShieldCheck, Plus } from 'lucide-react';
import { PaymentSubmitModal } from '../components/PaymentSubmitModal';

export const UserMyBhishiPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [schedulesByMem, setSchedulesByMem] = useState<Record<string, PaymentSchedule[]>>({});
  const [loading, setLoading] = useState(true);
  const [submittingSchedule, setSubmittingSchedule] = useState<PaymentSchedule | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchMyBhishi = async () => {
      try {
        const memQ = query(
          collection(db, 'memberships'),
          where('userId', '==', currentUser.uid)
        );
        const memSnap = await getDocs(memQ);
        const mList: Membership[] = [];
        memSnap.forEach((d) => mList.push({ id: d.id, ...d.data() } as Membership));
        setMemberships(mList);

        const schedQ = query(
          collection(db, 'paymentSchedules'),
          where('userId', '==', currentUser.uid)
        );
        const schedSnap = await getDocs(schedQ);
        const schedMap: Record<string, PaymentSchedule[]> = {};

        schedSnap.forEach((d) => {
          const s = { id: d.id, ...d.data() } as PaymentSchedule;
          if (!schedMap[s.membershipId]) {
            schedMap[s.membershipId] = [];
          }
          schedMap[s.membershipId].push(s);
        });

        Object.keys(schedMap).forEach((k) => {
          schedMap[k].sort((a, b) => a.monthIndex - b.monthIndex);
        });

        setSchedulesByMem(schedMap);
      } catch (err) {
        console.warn('Error fetching user bhishis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBhishi();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Enrolled Bhishi Groups
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your rotation turn, review monthly schedules, and submit installment payments.
          </p>
        </div>

        <Link
          to="/schemes"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Join New Bhishi</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : memberships.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-xs">
          <Layers className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-900">No Enrolled Bhishi Groups</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are not participating in any active Bhishi circles yet. Browse our catalog of transparent
            schemes to apply.
          </p>
          <Link
            to="/schemes"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition mt-2 shadow-xs"
          >
            <span>Browse Open Schemes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {memberships.map((mem) => {
            const schedules = schedulesByMem[mem.id] || [];
            const paidCount = schedules.filter((s) => s.status === 'paid').length;
            const progress = schedules.length ? Math.round((paidCount / schedules.length) * 100) : 0;

            return (
              <div
                key={mem.id}
                className="rounded-3xl bg-white border border-slate-200/90 p-6 space-y-6 shadow-xs"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {mem.membershipNumber || 'ENROLLMENT-PENDING'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          mem.status === 'active' || mem.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {mem.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{mem.schemeName || 'Bhishi Group'}</h2>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                      <p className="text-[10px] text-slate-500 font-medium">Your Rotation Turn</p>
                      <p className="font-bold text-emerald-700 font-mono text-sm mt-0.5">
                        {mem.rotationIndex ? `Month #${mem.rotationIndex}` : 'Awaiting Assignment'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Cycle Progress</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {paidCount} of {schedules.length} installments paid ({progress}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Monthly Contribution Schedule List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Monthly Contribution Ledger
                  </h3>

                  {schedules.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-200">
                      Installment schedule will be generated upon administrator membership approval.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Month</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3">Scheduled Due</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {schedules.map((sch) => (
                            <tr key={sch.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 px-3 font-mono text-slate-700">Month #{sch.monthIndex}</td>
                              <td className="py-2.5 px-3 text-slate-600">{formatDate(sch.dueDate)}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-900 font-bold">
                                {formatINR(sch.scheduledAmount)}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                    sch.status === 'paid'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : sch.status === 'overdue'
                                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {sch.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {sch.status !== 'paid' ? (
                                  <button
                                    onClick={() => setSubmittingSchedule(sch)}
                                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white transition shadow-2xs"
                                  >
                                    Pay Now
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Settled</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submittingSchedule && (
        <PaymentSubmitModal
          schedule={submittingSchedule}
          onClose={() => setSubmittingSchedule(null)}
          onSuccess={() => {
            setSubmittingSchedule(null);
          }}
        />
      )}
    </div>
  );
};
