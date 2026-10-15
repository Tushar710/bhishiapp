import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BhishiScheme, Membership } from '../lib/types';
import { formatINR, formatDate } from '../lib/formatters';
import { useAuth } from '../lib/authContext';
import { sendNotification } from '../lib/activity';
import {
  ArrowLeft,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RotateCw,
} from 'lucide-react';

export const SchemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin } = useAuth();

  const [scheme, setScheme] = useState<BhishiScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingMembership, setExistingMembership] = useState<Membership | null>(null);
  const [enrolledMembers, setEnrolledMembers] = useState<Membership[]>([]);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const docRef = doc(db, 'bhishiSchemes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setScheme({ id: docSnap.id, ...docSnap.data() } as BhishiScheme);
        }

        // Fetch enrolled members
        const mq = query(collection(db, 'memberships'), where('schemeId', '==', id));
        const mSnap = await getDocs(mq);
        const mList: Membership[] = [];
        mSnap.forEach((d) => {
          const m = { id: d.id, ...d.data() } as Membership;
          mList.push(m);
          if (currentUser && m.userId === currentUser.uid) {
            setExistingMembership(m);
          }
        });
        setEnrolledMembers(mList);
      } catch (err) {
        console.error('Error fetching scheme details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, currentUser]);

  const handleApply = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!scheme) return;

    if (existingMembership) {
      setError('You have already applied or enrolled in this Bhishi scheme.');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      const memRef = doc(collection(db, 'memberships'));
      const newMembership: Membership = {
        id: memRef.id,
        schemeId: scheme.id,
        schemeName: scheme.name,
        userId: currentUser.uid,
        userFullName: userData?.fullName || currentUser.email || 'Member',
        userPhone: userData?.phone || '',
        userEmail: currentUser.email || '',
        status: 'applied',
        appliedAt: new Date().toISOString(),
      };

      await setDoc(memRef, newMembership);
      setExistingMembership(newMembership);
      setApplySuccess(true);

      await sendNotification(
        currentUser.uid,
        'Membership Application Submitted',
        `Your application for ${scheme.name} (${scheme.schemeCode}) was received. An administrator will review your rotation slot.`,
        'membership',
        '/my-bhishi'
      );
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      setError(err?.message || 'Application failed. Please verify your connection.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-8 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <p className="text-slate-500">Bhishi scheme not found.</p>
        <Link to="/schemes" className="mt-4 text-emerald-700 font-bold hover:underline">
          Return to Schemes Catalog
        </Link>
      </div>
    );
  }

  const expectedMonthlyPot = scheme.monthlyContribution * scheme.totalMembers;
  const nominalScheduledTotal = scheme.monthlyContribution * scheme.durationMonths;
  const activeMembersCount = enrolledMembers.filter((m) => m.status === 'active' || m.status === 'approved').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 pb-20 md:pb-8">
      {/* Back button */}
      <div>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Schemes Catalog</span>
        </Link>
      </div>

      {/* Main Scheme Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
                {scheme.schemeCode}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {scheme.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {scheme.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              {scheme.description || 'Verified monthly community savings circle with fixed pre-agreed rotation.'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 font-medium">Monthly Due / Member</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tabular-nums">
              {formatINR(scheme.monthlyContribution)}
            </div>
            <span className="text-[11px] text-slate-400">Due by Day #{scheme.collectionDueDay}</span>
          </div>
        </div>

        {/* Calculation Metrics 4-Column Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
            <p className="text-slate-500 text-xs">Total Monthly Pot</p>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {formatINR(expectedMonthlyPot)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Disbursed per month</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
            <p className="text-slate-500 text-xs">Nominal Scheduled Total</p>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {formatINR(nominalScheduledTotal)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Over {scheme.durationMonths} months</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
            <p className="text-slate-500 text-xs">Enrolled Members</p>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {activeMembersCount} / {scheme.totalMembers}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {scheme.totalMembers - activeMembersCount} slots remaining
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
            <p className="text-slate-500 text-xs">Cycle Timeline</p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatDate(scheme.startDate)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Through {formatDate(scheme.endDate)}</p>
          </div>
        </div>

        {/* Application status / CTA */}
        <div className="pt-2">
          {existingMembership ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    Membership Status:{' '}
                    <span className="uppercase text-emerald-700 font-bold">
                      {existingMembership.status}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {existingMembership.rotationIndex
                      ? `Assigned Payout Month: #${existingMembership.rotationIndex}`
                      : 'Pending admin review and rotation assignment.'}
                  </p>
                </div>
              </div>
              <Link
                to="/my-bhishi"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs"
              >
                Go to My Bhishi
              </Link>
            </div>
          ) : applySuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Application Submitted Successfully!</p>
                <p className="mt-0.5 text-emerald-800">
                  Your application has been logged. The group administrator will assign your rotation slot.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <p className="font-bold text-slate-900">Ready to commit to this monthly circle?</p>
                  <p className="text-[11px]">Installments are due by the {scheme.collectionDueDay}th of each month.</p>
                </div>
                <button
                  onClick={handleApply}
                  disabled={applying || scheme.status !== 'open'}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition disabled:opacity-50 shadow-sm whitespace-nowrap"
                >
                  {applying ? 'Submitting...' : 'Apply for Membership'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rotation Rules & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <RotateCw className="w-4 h-4 text-emerald-600" />
            <span>Pre-Agreed Rotation Policy</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Payout order is sequentially determined upon enrollment approval. The member assigned to Month 1
            receives the first monthly pot, followed by Month 2, continuing until all {scheme.totalMembers}{' '}
            members have received their designated turn.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Transparent Disclosures</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nominal total scheduled contributions ({formatINR(nominalScheduledTotal)}) represent aggregate
            member savings installments and carry zero speculative interest. All payments must be verified
            via bank transfer UTR.
          </p>
        </div>
      </div>
    </div>
  );
};
