import React from 'react';
import { Scale, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

export const ComplianceTermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 uppercase tracking-wider">
          <Scale className="w-4 h-4 text-emerald-600" />
          <span>Regulatory Transparency & Disclosures</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Terms, Disclosures & Code of Conduct
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last updated: October 2026 · BhishiPro Compliance Guidelines
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">Legal Classification Notice</p>
          <p className="leading-relaxed text-amber-800">
            BhishiPro provides record-keeping, accounting, and communication software for community savings
            circles and registered groups. It does not act as a custodian, bank, non-banking financial company
            (NBFC), or money market fund. Operators must adhere to their regional Chit Funds Act / ROSCA
            regulations before mobilizing public funds.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            1. Nature of Rotating Savings (ROSCA / Bhishi)
          </h2>
          <p>
            A Bhishi is a mutual aid mechanism where participants make periodic fixed contributions into a
            common pool, which is awarded sequentially to each participant over the group's lifetime.
            Scheduled nominal sums (Monthly Contribution × Duration) represent total collective installments
            paid, not an interest-bearing return, dividend, or speculative yield.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            2. Anti-Speculation & Bidding Discipline
          </h2>
          <p>
            BhishiPro strictly prohibits deceptive promises of "guaranteed profit multiplication". Where
            pre-agreed rotation is enabled, the payout sequence is transparently defined upon membership
            activation, preventing arbitrary preferential payouts or unverified lottery lotteries.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            3. Verification & Receipting Standard
          </h2>
          <p>
            Client-side claims or buttons do not validate financial transfers. All recorded transactions
            require two-party validation: submission of a valid bank transfer/UPI UTR by the contributing
            member, and manual audit confirmation by the designated group manager.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            4. Referral & Incentive Governance
          </h2>
          <p>
            Referral rewards are promotional software credits or documented administrative offsets offered
            solely for verified, approved memberships. Users may not refer themselves, create duplicate
            accounts, or misrepresent referral benefits as passive commercial income.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            5. Data Protection & Isolation
          </h2>
          <p>
            All member information is secured using zero-trust role-based access control (RBAC). Members can
            only query their own personal contribution schedules and receipts. System administrators cannot
            view other users' passwords or unverified credentials.
          </p>
        </section>
      </div>
    </div>
  );
};
