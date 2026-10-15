import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { useLanguage } from '../lib/languageContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Membership, PaymentSchedule, PaymentRecord } from '../lib/types';
import { formatINR, formatDate } from '../lib/formatters';
import {
  Layers,
  CreditCard,
  Calendar,
  Gift,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { PaymentSubmitModal } from '../components/PaymentSubmitModal';

export const UserDashboard: React.FC = () => {
  const { currentUser, userData, isAdmin } = useAuth();
  const { language, t } = useLanguage();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<PaymentSchedule | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [totalVerifiedSavings, setTotalVerifiedSavings] = useState(0);
  const [totalOutstandingDues, setTotalOutstandingDues] = useState(0);
  const [loading, setLoading] = useState(true);

  const [activeReceipt, setActiveReceipt] = useState<PaymentRecord | null>(null);
  const [submittingSchedule, setSubmittingSchedule] = useState<PaymentSchedule | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
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
        let dueSum = 0;
        let upcoming: PaymentSchedule | null = null;

        schedSnap.forEach((d) => {
          const s = { id: d.id, ...d.data() } as PaymentSchedule;
          if (s.status === 'due' || s.status === 'overdue' || s.status === 'upcoming') {
            dueSum += s.outstandingBalance || s.scheduledAmount;
            if (!upcoming || new Date(s.dueDate).getTime() < new Date(upcoming.dueDate).getTime()) {
              upcoming = s;
            }
          }
        });
        setTotalOutstandingDues(dueSum);
        setUpcomingSchedule(upcoming);

        const payQ = query(
          collection(db, 'payments'),
          where('userId', '==', currentUser.uid)
        );
        const paySnap = await getDocs(payQ);
        let verifiedSum = 0;
        const pList: PaymentRecord[] = [];

        paySnap.forEach((d) => {
          const p = { id: d.id, ...d.data() } as PaymentRecord;
          pList.push(p);
          if (p.status === 'verified') {
            verifiedSum += p.amount;
          }
        });

        pList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentPayments(pList.slice(0, 5));
        setTotalVerifiedSavings(verifiedSum);
      } catch (err) {
        console.warn('Dashboard fetch warning:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-2xl shadow-inner">
            {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {language === 'mr' ? 'नमस्ते,' : 'Namaste,'} {userData?.fullName?.split(' ')[0] || (language === 'mr' ? 'सदस्य' : 'Member')}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                {language === 'mr' ? 'पडताळणी पूर्ण' : 'Verified'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'mr'
                ? 'आपल्या वैयक्तिक भिशी बचत व पाळी वाटप खात्यामध्ये आपले स्वागत आहे'
                : 'Welcome to your personal Bhishi savings & rotation ledger'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{language === 'mr' ? 'ॲडमिन कन्सोल उघडा' : 'Open Admin Console'}</span>
          </Link>
        )}
      </div>

      {/* Primary 4-Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Total Verified Savings</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1">
            {formatINR(totalVerifiedSavings)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed by management</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Upcoming Installment</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {upcomingSchedule ? formatINR(upcomingSchedule.scheduledAmount) : '₹0'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {upcomingSchedule ? `Due by ${formatDate(upcomingSchedule.dueDate)}` : 'All clear this month'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Enrolled Bhishi Groups</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {memberships.filter((m) => m.status === 'active' || m.status === 'approved').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {memberships.length} total applications
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Outstanding Dues</p>
          <p className="text-xl sm:text-2xl font-black text-amber-600 font-mono tabular-nums mt-1">
            {formatINR(totalOutstandingDues)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled contributions</p>
        </div>
      </div>

      {/* Upcoming Action Banner if Installment is Due */}
      {upcomingSchedule && (
        <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Upcoming Contribution Due: {formatINR(upcomingSchedule.scheduledAmount)}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Month #{upcomingSchedule.monthIndex} · Due date: {formatDate(upcomingSchedule.dueDate)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubmittingSchedule(upcomingSchedule)}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-xs whitespace-nowrap"
          >
            Submit Payment Proof
          </button>
        </div>
      )}

      {/* Two-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Active Bhishi Groups */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>My Bhishi Circles</span>
            </h2>
            <Link to="/my-bhishi" className="text-xs font-bold text-emerald-700 hover:underline">
              View All Groups
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-3xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : memberships.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
              <Layers className="w-10 h-10 mx-auto text-slate-400 stroke-[1.5]" />
              <h3 className="text-sm font-bold text-slate-900">No Active Bhishi Groups</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't joined any Bhishi groups yet. Explore available schemes to apply for your first
                monthly circle.
              </p>
              <Link
                to="/schemes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-xs"
              >
                <span>Explore Open Schemes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {memberships.map((mem) => (
                <div
                  key={mem.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 flex items-center justify-between hover:border-slate-300 transition shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {mem.membershipNumber || 'ENROLLED'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase">
                        {mem.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{mem.schemeName || 'Bhishi Scheme'}</h3>
                    <p className="text-xs text-slate-500">
                      {mem.rotationIndex ? (
                        <span className="text-emerald-700 font-semibold">
                          Assigned Payout Month: #{mem.rotationIndex}
                        </span>
                      ) : (
                        <span>Rotation slot: Pending admin assignment</span>
                      )}
                    </p>
                  </div>

                  <Link
                    to="/my-bhishi"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-800"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Payments & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions Panel */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/schemes"
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 font-bold text-slate-800 transition flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Explore Bhishi</span>
              </Link>
              <Link
                to="/payments"
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 font-bold text-slate-800 transition flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>View Payments</span>
              </Link>
              <Link
                to="/referrals"
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 font-bold text-slate-800 transition flex items-center gap-2"
              >
                <Gift className="w-4 h-4 text-emerald-600" />
                <span>My Referrals</span>
              </Link>
              <Link
                to="/compliance"
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 font-bold text-slate-800 transition flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Support & Terms</span>
              </Link>
            </div>
          </div>

          {/* Recent Payment History */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Recent Payments</span>
              </h3>
              <Link to="/payments" className="text-xs font-bold text-emerald-700 hover:underline">
                All Transactions
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No transactions recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 font-mono tabular-nums">
                        {formatINR(p.amount)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-[160px]">
                        {p.receiptNumber}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          p.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.status === 'verified' && (
                        <button
                          onClick={() => setActiveReceipt(p)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-800"
                          title="View Receipt"
                        >
                          <Receipt className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeReceipt && (
        <ReceiptModal payment={activeReceipt} onClose={() => setActiveReceipt(null)} />
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
