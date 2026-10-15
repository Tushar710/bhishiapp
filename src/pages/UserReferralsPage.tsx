import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ReferralRecord } from '../lib/types';
import { formatINR, formatDate } from '../lib/formatters';
import { Copy, Check, Share2, Users, ShieldAlert } from 'lucide-react';

export const UserReferralsPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralCode = userData?.referralCode || 'BHISPRO';
  const shareUrl = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    if (!currentUser) return;

    const fetchReferrals = async () => {
      try {
        const q = query(
          collection(db, 'referrals'),
          where('referrerId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const list: ReferralRecord[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ReferralRecord));
        setReferrals(list);
      } catch (err) {
        console.warn('Error loading referrals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [currentUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Monthly Bhishi on BhishiPro',
          text: `Join our verified monthly Bhishi savings circle using my referral code ${referralCode}:`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const qualifiedCount = referrals.filter((r) => r.status === 'qualified' || r.status === 'rewarded').length;
  const totalRewardValue = referrals
    .filter((r) => r.status === 'rewarded' && r.rewardAmount)
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Referral & Rewards Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Invite trusted friends or business colleagues to join verified Bhishi groups and track reward credits.
        </p>
      </div>

      {/* Referral Link Showcase Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 uppercase tracking-wider">
              Your Personal Referral Code
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-widest mt-2">
              {referralCode}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Give your friends this code or share your unique registration link directly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-800 transition flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* Share URL read-only box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-slate-700 truncate">{shareUrl}</span>
          <button
            onClick={handleCopy}
            className="text-emerald-700 hover:text-emerald-800 font-bold shrink-0 ml-2"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Statistics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Total Referrals Registered</p>
          <p className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {referrals.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Members joined with your link</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Qualified Enrollments</p>
          <p className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1">
            {qualifiedCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Approved into active schemes</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Total Rewards Credited</p>
          <p className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1">
            {formatINR(totalRewardValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Offset against maintenance dues</p>
        </div>
      </div>

      {/* Compliance / Qualification Policy */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">Referral Attribution Rules</p>
          <p className="text-amber-800 leading-relaxed">
            Rewards are qualified upon administrator approval of a referred member's initial active Bhishi
            enrollment. Self-referrals and duplicate accounts are automatically blocked. Reward credits are
            promotional fee offsets and not guaranteed commercial cash returns.
          </p>
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Referred Members Activity</span>
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No referral registrations yet. Share your code to begin tracking!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
                  <th className="pb-3 px-3">Referee ID</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Reward Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono text-slate-800">{ref.refereeId.slice(0, 10)}...</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(ref.createdAt)}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                      {ref.rewardAmount ? formatINR(ref.rewardAmount) : 'Pending Qualification'}
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
};
