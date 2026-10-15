import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { User, ShieldCheck, LogOut, Check, AlertCircle } from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallBanner';

export const UserProfilePage: React.FC = () => {
  const { currentUser, userData, isAdmin, updateUserProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(userData?.fullName || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(fullName.trim(), phone.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Member Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal verification details, contact numbers, and security preferences.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xl font-black text-emerald-800">
            {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{userData?.fullName || 'Member'}</h2>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAdmin ? 'System Administrator' : 'Verified Member'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button
            onClick={() => logout()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Contact Information</span>
        </h3>

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Profile information updated successfully.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={currentUser?.email || ''}
              className="w-full min-h-[44px] px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Email is permanently bound to your Firebase account authentication.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WhatsApp / Contact Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full min-h-[44px] px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {userData?.referralCode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Referral Code
              </label>
              <input
                type="text"
                disabled
                value={userData.referralCode}
                className="w-full min-h-[44px] px-3.5 py-2 text-xs font-mono font-bold rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 cursor-not-allowed"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition disabled:opacity-50 shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
