import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BhishiScheme } from '../lib/types';
import { formatINR } from '../lib/formatters';
import {
  ShieldCheck,
  RotateCw,
  Users,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Lock,
  Award,
  Shield,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [featuredSchemes, setFeaturedSchemes] = useState<BhishiScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const q = query(
          collection(db, 'bhishiSchemes'),
          where('status', 'in', ['open', 'active']),
          limit(3)
        );
        const snap = await getDocs(q);
        const list: BhishiScheme[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as BhishiScheme));
        setFeaturedSchemes(list);
      } catch (e) {
        console.warn('Could not load landing schemes:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Compliant & Transparent ROSCA Ledger</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Manage Monthly Bhishi Groups with Bank-Grade Precision
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Ditch fragile paper diaries and messy messaging groups. BhishiPro provides an immutable,
              audited ledger for monthly contributions, pre-agreed rotation payouts, verified transaction
              receipts, and member referral tracking.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <span>Start Your Bhishi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/schemes"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 font-bold text-sm text-slate-700 transition-colors whitespace-nowrap shadow-2xs"
              >
                Browse Open Schemes
              </Link>
              <Link
                to="/login?portal=admin"
                className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-sm text-white transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Admin Login Portal</span>
              </Link>
            </div>

            {/* Key trust markers */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-slate-500">Payout Model</p>
                <p className="font-bold text-slate-900 mt-0.5">Pre-Agreed Rotation</p>
              </div>
              <div>
                <p className="text-slate-500">Verification</p>
                <p className="font-bold text-slate-900 mt-0.5">Admin-Audited UTR</p>
              </div>
              <div>
                <p className="text-slate-500">Receipts</p>
                <p className="font-bold text-slate-900 mt-0.5">Printable GST/Audit</p>
              </div>
            </div>
          </div>

          {/* Hero Interactive Card Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monthly Group Amortization</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sample ₹10,000 / month · 10 Members</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-lg">
                  ₹
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-slate-500 font-medium">Monthly Contribution</p>
                  <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">₹10,000</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                  <p className="text-emerald-700 font-medium">Total Monthly Pot</p>
                  <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">₹1,00,000</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-slate-500 font-medium">Cycle Duration</p>
                  <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">10 Months</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-slate-500 font-medium">Rotation Schedule</p>
                  <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">1 Payout/Mo</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <p>
                  Zero lottery speculation. Every member receives exactly their designated full monthly pot
                  once in the 10-month lifecycle.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/register"
                  className="w-full min-h-[44px] flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                >
                  Join as Member
                </Link>
                <Link
                  to="/login?portal=admin"
                  className="w-full min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-200"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for Complete Accountability
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Every installment, withdrawal, and approval is verified by administrators and permanently
              recorded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <RotateCw className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pre-Agreed Rotation Queue</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Members know their assigned payout month before enrollment begins. Eliminates disputes,
                bidding friction, and speculative lottery draws.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verified Ledger & Receipts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Payments require administrator UTR verification before transitioning to 'Paid'. Generates
                official numbered receipts with print and export capabilities.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Referral Incentives</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Members receive unique tracking codes and share links. Qualifying enrollments are tracked
                transparently with anti-self-referral validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Open Schemes Preview */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Active & Open Schemes</h2>
            <p className="text-xs text-slate-500 mt-1">
              Browse current Bhishi groups accepting member applications.
            </p>
          </div>
          <Link
            to="/schemes"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All Schemes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : featuredSchemes.length === 0 ? (
          <div className="text-center py-12 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs">
            <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">Clean Database Initialized</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No Bhishi schemes have been published yet. Log in as an administrator to create your first
              Bhishi group, configure contributions, and publish for enrollment.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                to="/login?portal=admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition shadow-sm"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Admin Login to Create Scheme</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 hover:border-slate-300 transition shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
                      {scheme.schemeCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{scheme.name}</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold uppercase border border-emerald-200">
                    {scheme.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <p className="text-slate-500 text-[11px]">Monthly Due</p>
                    <p className="font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {formatINR(scheme.monthlyContribution)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <p className="text-slate-500 text-[11px]">Group Capacity</p>
                    <p className="font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {scheme.totalMembers} Members
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Duration: {scheme.durationMonths} Mos</span>
                  <Link
                    to={`/schemes/${scheme.id}`}
                    className="font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Compliance & Regulatory Disclosure */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Regulatory Disclosure Notice
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            BhishiPro is a management software platform designed to record contributions and organize
            rotation schedules. Nominated total collections are nominal aggregate scheduled contributions
            and are not guaranteed investment returns. Ensure your group complies with applicable local
            Chit Fund and mutual credit regulations before operating real-money pools.
          </p>
          <div className="pt-2">
            <Link to="/compliance" className="text-xs font-semibold text-emerald-700 hover:underline">
              Read Complete Legal Disclosures & Code of Conduct
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
