import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrganizationSettings } from '../lib/types';
import { useAuth } from '../lib/authContext';
import { logAdminAction } from '../lib/activity';
import {
  Shield,
  Building2,
  Save,
  Check,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [orgName, setOrgName] = useState('BhishiPro Community Ledger');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [supportEmail, setSupportEmail] = useState('support@bhishipro.com');
  const [disclaimer, setDisclaimer] = useState(
    'BhishiPro is a self-hosted community accounting ledger for rotating savings groups. Members participate on mutual agreement.'
  );

  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Admin management
  const [adminList, setAdminList] = useState<{ id: string; email: string; role: string }[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'appSettings', 'global'));
        if (snap.exists()) {
          const d = snap.data() as OrganizationSettings;
          setOrgName(d.organizationName || '');
          setCurrency(d.currency || 'INR');
          setCurrencySymbol(d.currencySymbol || '₹');
          setSupportPhone(d.supportPhone || '');
          setSupportEmail(d.supportEmail || '');
          setDisclaimer(d.disclaimerNotice || '');
        }

        // Fetch admins
        const adminSnap = await getDocs(collection(db, 'admins'));
        const aList: { id: string; email: string; role: string }[] = [];
        adminSnap.forEach((docItem) => {
          const data = docItem.data();
          aList.push({
            id: docItem.id,
            email: data.email || docItem.id,
            role: data.role || 'admin',
          });
        });
        setAdminList(aList);
      } catch (err) {
        console.warn('Error loading settings:', err);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingSettings(true);

    try {
      const data: OrganizationSettings = {
        id: 'global',
        organizationName: orgName.trim(),
        currency: currency.trim(),
        currencySymbol: currencySymbol.trim(),
        supportPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
        disclaimerNotice: disclaimer.trim(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'appSettings', 'global'), data);

      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'UPDATE_APP_SETTINGS',
        'appSettings',
        'global',
        `Updated organization name to ${data.organizationName}`
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newAdminEmail.trim()) return;
    setAdminError(null);

    try {
      const adminDocId = newAdminEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'admins', adminDocId), {
        uid: adminDocId,
        email: newAdminEmail.trim().toLowerCase(),
        role: 'admin',
        grantedAt: new Date().toISOString(),
        grantedBy: currentUser.uid,
      });

      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'GRANT_ADMIN_ROLE',
        'admins',
        adminDocId,
        `Granted admin role to ${newAdminEmail}`
      );

      setAdminList((prev) => [
        ...prev,
        { id: adminDocId, email: newAdminEmail.trim().toLowerCase(), role: 'admin' },
      ]);
      setNewAdminEmail('');
    } catch (err: any) {
      setAdminError(err?.message || 'Failed to delegate admin role.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Application & Compliance Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure branding, support touchpoints, currency standards, and manage administrator authorizations.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Application settings saved successfully.</span>
        </div>
      )}

      {/* Global Config Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <span>Organization & Legal Parameters</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Organization / Brand Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Code & Symbol</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="min-h-[44px] px-3.5 py-2 font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                />
                <input
                  type="text"
                  required
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="min-h-[44px] px-3.5 py-2 font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 text-center focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Support WhatsApp / Helpline
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Support Email Address</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Legal Disclaimer & ROSCA Disclosure Notice
            </label>
            <textarea
              rows={3}
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed font-mono text-[11px]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin Delegation Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <span>Administrator Access Control (Zero-Trust RBAC)</span>
        </h2>

        {adminError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{adminError}</span>
          </div>
        )}

        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Add new admin by email address..."
            className="flex-1 min-h-[44px] px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Grant Admin Rights</span>
          </button>
        </form>

        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Active Administrators ({adminList.length})
          </p>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs bg-slate-50">
            {adminList.map((admin) => (
              <div key={admin.id} className="p-3.5 flex items-center justify-between">
                <span className="font-mono text-slate-800 font-semibold">{admin.email}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {admin.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
