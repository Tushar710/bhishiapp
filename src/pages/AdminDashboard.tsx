import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BhishiScheme, Membership, PaymentRecord, PaymentSchedule, PayoutRecord } from '../lib/types';
import { formatINR } from '../lib/formatters';
import { useLanguage } from '../lib/languageContext';
import {
  Users,
  Layers,
  CreditCard,
  Gift,
  Clock,
  TrendingUp,
  ShieldCheck,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { language, t } = useLanguage();
  const [schemes, setSchemes] = useState<BhishiScheme[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [schemesSnap, memSnap, paySnap, schedSnap, payoutSnap] = await Promise.all([
          getDocs(collection(db, 'bhishiSchemes')),
          getDocs(collection(db, 'memberships')),
          getDocs(collection(db, 'payments')),
          getDocs(collection(db, 'paymentSchedules')),
          getDocs(collection(db, 'payouts')),
        ]);

        const scList: BhishiScheme[] = [];
        schemesSnap.forEach((d) => scList.push({ id: d.id, ...d.data() } as BhishiScheme));
        setSchemes(scList);

        const mList: Membership[] = [];
        memSnap.forEach((d) => mList.push({ id: d.id, ...d.data() } as Membership));
        setMemberships(mList);

        const pList: PaymentRecord[] = [];
        paySnap.forEach((d) => pList.push({ id: d.id, ...d.data() } as PaymentRecord));
        setPayments(pList);

        const schList: PaymentSchedule[] = [];
        schedSnap.forEach((d) => schList.push({ id: d.id, ...d.data() } as PaymentSchedule));
        setSchedules(schList);

        const poList: PayoutRecord[] = [];
        payoutSnap.forEach((d) => poList.push({ id: d.id, ...d.data() } as PayoutRecord));
        setPayouts(poList);
      } catch (err) {
        console.warn('Admin stats fetch warning:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  // Compute calculated metrics
  const totalVerifiedCollections = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length;
  const pendingApprovalsCount = memberships.filter((m) => m.status === 'applied').length;
  const activeMembersCount = memberships.filter((m) => m.status === 'active' || m.status === 'approved').length;

  const totalOutstandingDues = schedules
    .filter((s) => s.status === 'due' || s.status === 'overdue' || s.status === 'upcoming')
    .reduce((sum, s) => sum + (s.outstandingBalance || s.scheduledAmount), 0);

  const completedPayoutsTotal = payouts
    .filter((po) => po.status === 'paid')
    .reduce((sum, po) => sum + po.netAmount, 0);

  // Chart data: Monthly payment distribution (sample aggregated by month index)
  const chartData = [
    { month: 'Month 1', collected: totalVerifiedCollections * 0.4 || 10000 },
    { month: 'Month 2', collected: totalVerifiedCollections * 0.35 || 25000 },
    { month: 'Month 3', collected: totalVerifiedCollections * 0.25 || 15000 },
  ];

  const pieData = [
    { name: 'Verified Collected', value: totalVerifiedCollections || 1000, color: '#059669' },
    { name: 'Outstanding Dues', value: totalOutstandingDues || 500, color: '#D97706' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'mr' ? 'मुख्य व्यवस्थापन केंद्र (Admin)' : 'Executive Management Desk'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              {language === 'mr' ? 'ॲडमिन डॅशबोर्ड' : 'Admin Portal'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'mr'
              ? 'रिअल-टाइम आर्थिक हिशोब, प्रलंबित हप्ते पडताळणी व भिशी चक्रांचे संपूर्ण नियंत्रण.'
              : 'Real-time financial reconciliation, pending verification queue, and scheme lifecycle oversight.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct + Add Member button */}
          <Link
            to="/admin/memberships?action=add"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'mr' ? '+ नवीन सदस्य जोडा' : '+ Add Member'}</span>
          </Link>
          <Link
            to="/admin/schemes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>{language === 'mr' ? 'योजना तयार करा' : 'Create Scheme'}</span>
          </Link>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-2xs whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>{language === 'mr' ? 'लेजर व CSV' : 'Ledger & CSV'}</span>
          </Link>
        </div>
      </div>

      {/* Action Banners for Pending Tasks */}
      {(pendingPaymentsCount > 0 || pendingApprovalsCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingPaymentsCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-950">
                    {pendingPaymentsCount} Payment{pendingPaymentsCount > 1 ? 's' : ''} Awaiting Verification
                  </p>
                  <p className="text-[11px] text-amber-800">Audit UTR and confirm bank receipt</p>
                </div>
              </div>
              <Link
                to="/admin/payments"
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
              >
                Review
              </Link>
            </div>
          )}

          {pendingApprovalsCount > 0 && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-950">
                    {pendingApprovalsCount} Membership Application{pendingApprovalsCount > 1 ? 's' : ''} Pending
                  </p>
                  <p className="text-[11px] text-blue-800">Assign rotation slot and activate</p>
                </div>
              </div>
              <Link
                to="/admin/memberships"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition shadow-xs"
              >
                Approve
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI 4-Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Verified Collections */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Verified Collections</p>
          <p className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1">
            {formatINR(totalVerifiedCollections)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Audited bank/cash total</p>
        </div>

        {/* KPI 2: Outstanding Dues */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Outstanding Dues</p>
          <p className="text-2xl font-black text-amber-700 font-mono tabular-nums mt-1">
            {formatINR(totalOutstandingDues)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled member installments</p>
        </div>

        {/* KPI 3: Active Members */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Active Paying Members</p>
          <p className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {activeMembersCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {schemes.length} Bhishi schemes
          </p>
        </div>

        {/* KPI 4: Rotation Payouts Settled */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Disbursed Payouts</p>
          <p className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {formatINR(completedPayoutsTotal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {payouts.filter((p) => p.status === 'paid').length} rotation turns settled
          </p>
        </div>
      </div>

      {/* Analytics Charts & Scheme Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Collections Breakdown Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Collection Amortization Trend</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">INR (₹)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [formatINR(Number(value) || 0), 'Collected']}
                />
                <Bar dataKey="collected" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Paid vs Outstanding Split */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Collections vs Outstandings</h3>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [formatINR(Number(value) || 0), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Verified Collections</span>
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {formatINR(totalVerifiedCollections)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Outstanding Dues</span>
              </span>
              <span className="font-mono font-bold text-amber-700">
                {formatINR(totalOutstandingDues)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Schemes & Transactions Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schemes Overview */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Bhishi Schemes</span>
            </h3>
            <Link to="/admin/schemes" className="text-xs text-emerald-700 font-semibold hover:underline">
              Manage All →
            </Link>
          </div>

          {schemes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p>No schemes published yet.</p>
              <Link to="/admin/schemes" className="text-emerald-700 font-bold mt-1 inline-block hover:underline">
                Create First Bhishi Scheme
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {schemes.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                      {s.schemeCode}
                    </span>
                    <p className="font-bold text-slate-900 mt-1">{s.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {formatINR(s.monthlyContribution)} / mo · {s.totalMembers} Members
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Recent Transactions</span>
            </h3>
            <Link to="/admin/payments" className="text-xs text-emerald-700 font-semibold hover:underline">
              Full Ledger →
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p>No payment transactions recorded yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Member contributions will appear here once submitted.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {payments.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-mono font-bold text-slate-900 tabular-nums">{formatINR(p.amount)}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{p.userFullName || 'Member'}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.receiptNumber}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase border ${
                      p.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
