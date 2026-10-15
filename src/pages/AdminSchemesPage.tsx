import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BhishiScheme, SchemeStatus, PayoutMethod } from '../lib/types';
import { formatINR, formatDate } from '../lib/formatters';
import { useAuth } from '../lib/authContext';
import { useLanguage } from '../lib/languageContext';
import { logAdminAction } from '../lib/activity';
import {
  Layers,
  Plus,
  X,
  AlertCircle,
  Calendar,
  Users,
  Edit,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AdminSchemesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const [schemes, setSchemes] = useState<BhishiScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState<BhishiScheme | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [schemeCode, setSchemeCode] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [totalMembers, setTotalMembers] = useState<number>(10);
  const [durationMonths, setDurationMonths] = useState<number>(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collectionDueDay, setCollectionDueDay] = useState<number>(10);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('rotation');
  const [status, setStatus] = useState<SchemeStatus>('open');
  const [terms, setTerms] = useState(
    '1. Fixed rotation sequence assigned on enrollment.\n2. Monthly installments must be paid on or before the due date.\n3. UTR submission mandatory for verification.'
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemes = async () => {
    try {
      const snap = await getDocs(collection(db, 'bhishiSchemes'));
      const list: BhishiScheme[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as BhishiScheme));
      setSchemes(list);
    } catch (err) {
      console.warn('Error fetching schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const openCreateModal = () => {
    setEditingScheme(null);
    setName('');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setSchemeCode(`BHI-${new Date().getFullYear()}-${randomSuffix}`);
    setDescription('Community ROSCA scheme with pre-agreed sequential payout turns.');
    setMonthlyContribution(10000);
    setTotalMembers(10);
    setDurationMonths(10);

    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
    const end = new Date(today);
    end.setMonth(end.getMonth() + 10);
    setEndDate(end.toISOString().split('T')[0]);
    setCollectionDueDay(10);
    setPayoutMethod('rotation');
    setStatus('open');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (s: BhishiScheme) => {
    setEditingScheme(s);
    setName(s.name);
    setSchemeCode(s.schemeCode);
    setDescription(s.description);
    setMonthlyContribution(s.monthlyContribution);
    setTotalMembers(s.totalMembers);
    setDurationMonths(s.durationMonths);
    setStartDate(s.startDate);
    setEndDate(s.endDate);
    setCollectionDueDay(s.collectionDueDay);
    setPayoutMethod(s.payoutMethod);
    setStatus(s.status);
    setTerms(s.terms || '');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!name.trim() || !schemeCode.trim()) {
      setError('Please provide scheme name and unique code.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const schemeId = editingScheme ? editingScheme.id : doc(collection(db, 'bhishiSchemes')).id;
      const schemeData: BhishiScheme = {
        id: schemeId,
        name: name.trim(),
        schemeCode: schemeCode.trim().toUpperCase(),
        description: description.trim(),
        monthlyContribution: Number(monthlyContribution),
        totalMembers: Number(totalMembers),
        durationMonths: Number(durationMonths),
        startDate,
        endDate,
        collectionDueDay: Number(collectionDueDay),
        payoutMethod,
        status,
        terms: terms.trim(),
        createdAt: editingScheme?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingScheme) {
        await updateDoc(doc(db, 'bhishiSchemes', schemeId), {
          ...schemeData,
        });
        await logAdminAction(
          currentUser.uid,
          currentUser.email || '',
          'UPDATE_SCHEME',
          'bhishiSchemes',
          schemeId,
          `Updated scheme ${schemeData.name}`
        );
      } else {
        await setDoc(doc(db, 'bhishiSchemes', schemeId), schemeData);
        await logAdminAction(
          currentUser.uid,
          currentUser.email || '',
          'CREATE_SCHEME',
          'bhishiSchemes',
          schemeId,
          `Created new scheme ${schemeData.name} (${schemeData.schemeCode})`
        );
      }

      setShowModal(false);
      fetchSchemes();
    } catch (err: any) {
      console.error('Failed to save scheme:', err);
      setError(err?.message || 'Failed to save scheme.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (s: BhishiScheme, newStatus: SchemeStatus) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'bhishiSchemes', s.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'STATUS_CHANGE_SCHEME',
        'bhishiSchemes',
        s.id,
        `Status changed from ${s.status} to ${newStatus}`
      );
      fetchSchemes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === 'mr' ? 'भिशी योजना स्टुडिओ (Schemes)' : 'Bhishi Scheme Studio'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'mr'
              ? 'नवीन भिशी गट तयार करा, मासिक हप्ते ठरवा, मुदत व एकूण सदस्यांची मर्यादा निश्चित करा.'
              : 'Create and configure rotating savings groups, collection schedules, and member capacities.'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'mr' ? '+ नवीन योजना तयार करा' : 'Create Bhishi Scheme'}</span>
        </button>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : schemes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-2xs">
          <Layers className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-900">No Schemes Configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your first Monthly Bhishi group with custom contributions and member capacities.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Scheme</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((s) => {
            const nominalScheduledTotal = s.monthlyContribution * s.durationMonths;
            const expectedMonthlyPot = s.monthlyContribution * s.totalMembers;

            return (
              <div
                key={s.id}
                className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded tracking-wider">
                        {s.schemeCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{s.name}</h3>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase border ${
                        s.status === 'open'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : s.status === 'active'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <p className="text-[11px] text-slate-500 font-medium">Monthly Installment</p>
                      <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                        {formatINR(s.monthlyContribution)}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                      <p className="text-[11px] text-emerald-800 font-medium">Total Monthly Pot</p>
                      <p className="text-base font-black text-emerald-700 font-mono mt-0.5">
                        {formatINR(expectedMonthlyPot)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Max Capacity:</span>
                      </span>
                      <span className="font-bold text-slate-900">{s.totalMembers} Members</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cycle Duration:</span>
                      </span>
                      <span className="font-bold text-slate-900">{s.durationMonths} Months</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Collection Due Day:</span>
                      <span className="font-bold text-slate-900">{s.collectionDueDay}th of month</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nominal Scheduled Total:</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(nominalScheduledTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditModal(s)}
                    className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {s.status === 'open' && (
                      <button
                        onClick={() => handleQuickStatusChange(s, 'active')}
                        className="min-h-[40px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-2xs"
                        title="Start Cycle"
                      >
                        Activate
                      </button>
                    )}
                    {s.status === 'active' && (
                      <button
                        onClick={() => handleQuickStatusChange(s, 'completed')}
                        className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-2xs"
                        title="Mark Completed"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Create / Edit Scheme */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingScheme ? 'Edit Bhishi Scheme' : 'Create Monthly Bhishi Scheme'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bhishi Scheme Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pune Traders Circle 2026"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unique Scheme Code</label>
                  <input
                    type="text"
                    required
                    value={schemeCode}
                    onChange={(e) => setSchemeCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BHI-2026-01"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Eligibility</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe member criteria, target savings goal, and eligibility..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Financial Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Contribution (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    step={500}
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Members Capacity</label>
                  <input
                    type="number"
                    required
                    min={2}
                    max={100}
                    value={totalMembers}
                    onChange={(e) => setTotalMembers(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    required
                    min={2}
                    max={60}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Calculation Preview Strip */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-600">Total Monthly Pot: </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatINR(monthlyContribution * totalMembers)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Nominal Scheduled Total: </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(monthlyContribution * durationMonths)}
                  </span>
                </div>
              </div>

              {/* Date & Due Day */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cycle Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cycle End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Due Day (1-28)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={28}
                    value={collectionDueDay}
                    onChange={(e) => setCollectionDueDay(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Status and Payout Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payout Mechanism</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as PayoutMethod)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="rotation">Pre-Agreed Rotation Queue</option>
                    <option value="bidding">Reverse Bidding Auction</option>
                    <option value="draw">Transparent Monthly Draw</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheme Lifecycle Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SchemeStatus)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="draft">Draft (Hidden)</option>
                    <option value="open">Open (Accepting Members)</option>
                    <option value="active">Active (In Cycle)</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terms & Disclosures</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-[11px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="min-h-[44px] px-5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Saving...' : editingScheme ? 'Update Scheme' : 'Publish Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
