import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, Users, CreditCard, RotateCw, Receipt } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 uppercase tracking-wider">
          Transparent Operational Lifecycle
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
          How Monthly Bhishi Works on BhishiPro
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          A Rotating Savings and Credit Association (ROSCA) operates on community trust, predictable
          schedules, and verified audit trails.
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-sm">
            1
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Scheme Creation & Transparent Terms</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Administrators configure the Bhishi parameters upfront: monthly contribution (e.g. ₹5,000 or
              ₹10,000), total member capacity (e.g. 10 or 20 members), cycle duration, collection due day,
              and pre-agreed rotation rules.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full disclosures provided before enrollment</span>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-sm">
            2
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Member Application & Pre-Agreed Rotation</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Eligible users apply to join the Bhishi scheme. Upon admin review and approval, each member is
              assigned a unique membership number and an immutable rotation index (Month 1, Month 2... Month N).
              This guarantees that members know exactly which month they will receive the lump-sum pot.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold pt-1">
              <RotateCw className="w-4 h-4 text-emerald-600" />
              <span>Zero speculative draws or random lottery guessing</span>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-sm">
            3
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Monthly Installment Submission & Verification</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Each month before the designated collection due date, members transfer their contribution via UPI,
              NEFT/bank transfer, or cash and submit their transaction reference (UTR number). The administrator
              verifies the deposit against bank records and confirms the payment, immediately updating the status to
              'Paid'.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold pt-1">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Instant digital receipt generation with unique serial numbers</span>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-sm">
            4
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Pot Disbursement & Audit Settlement</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Once the monthly collections are verified, the full scheduled pot (Monthly Contribution × Total
              Members) is disbursed to the rotation recipient for that month. A complete disbursement statement
              is recorded in the ledger, with deductions (if any management fee was disclosed) clearly accounted
              for.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold pt-1">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Permanent audit trail for end-of-year settlement</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/schemes"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white transition shadow-sm"
        >
          <span>Explore Available Bhishi Schemes</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
