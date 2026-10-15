import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { useLanguage } from '../lib/languageContext';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Shield, Zap, Globe } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, loginAdminQuick, bootstrapAdminEmail, isAdmin, currentUser } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab: 'member' or 'admin'
  const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL query param e.g. /login?portal=admin
  useEffect(() => {
    if (searchParams.get('portal') === 'admin') {
      setActiveTab('admin');
      setEmail(bootstrapAdminEmail);
      setPassword('Admin@123456');
    }
  }, [searchParams, bootstrapAdminEmail]);

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (currentUser) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, isAdmin, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email.trim(), password);
      if (activeTab === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (language === 'mr' ? 'अवैध ईमेल किंवा पासवर्ड.' : 'Invalid email or password.'));
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAdminQuick('Admin@123456');
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (language === 'mr' ? 'ॲडमिन लॉगिन अयशस्वी झाले.' : 'Admin sign-in failed. Please verify credentials.'));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (language === 'mr' ? 'गुगल लॉगिन अयशस्वी झाले.' : 'Google sign-in failed. Please try again.'));
      setLoading(false);
    }
  };

  const handleFillAdminDemo = () => {
    setEmail(bootstrapAdminEmail);
    setPassword('Admin@123456');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Language switch quick pill */}
        <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t('app_name', 'BhishiPro')}
          </span>
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold border border-emerald-200 transition"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'en' ? 'मराठी' : 'English'}</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center mx-auto text-xl shadow-md shadow-emerald-600/20">
            ₹
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            {activeTab === 'admin'
              ? (language === 'mr' ? 'प्रशासक (Admin) प्रवेश पोर्टल' : 'Administrator Login Portal')
              : (language === 'mr' ? 'सदस्य लॉगिन' : 'Member Sign In')}
          </h1>
          <p className="text-xs text-slate-500">
            {activeTab === 'admin'
              ? (language === 'mr'
                  ? 'भिशी योजना निर्मिती, सदस्य पडताळणी व हिशोब व्यवस्थापनासाठी ॲडमिन डेस्क'
                  : 'Executive control desk for Bhishi scheme creation, member approvals, and verified collections')
              : (language === 'mr'
                  ? 'आपल्या भिशी हप्त्यांचा हिशोब व पावत्या पाहण्यासाठी लॉगिन करा'
                  : 'Sign in to access your personal contribution ledger and verified receipts')}
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('member');
              setError(null);
            }}
            className={`flex-1 min-h-[42px] flex items-center justify-center gap-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'member'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{language === 'mr' ? 'सदस्य लॉगिन' : 'Member Login'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError(null);
              if (!email) setEmail(bootstrapAdminEmail);
              if (!password) setPassword('Admin@123456');
            }}
            className={`flex-1 min-h-[42px] flex items-center justify-center gap-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'admin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'ॲडमिन पोर्टल' : 'Admin Portal'}</span>
          </button>
        </div>

        {/* Admin Callout Banner & 1-Click Access */}
        {activeTab === 'admin' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-xs text-emerald-950 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{language === 'mr' ? 'सुपर ॲडमिन अधिकार' : 'Super Admin Privileges'}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 font-bold">
                ROOT
              </span>
            </div>

            <p className="text-[11px] text-emerald-800 leading-relaxed">
              {language === 'mr' ? 'मुख्य ॲडमिन ईमेल:' : 'Super Admin account:'}{' '}
              <strong className="font-mono text-emerald-950 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                {bootstrapAdminEmail}
              </strong>
            </p>

            {/* Instant 1-Click Admin Access Button */}
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={loading}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>
                {loading
                  ? (language === 'mr' ? 'प्रवेश करत आहे...' : 'Authenticating Admin...')
                  : (language === 'mr' ? '⚡ १-क्लिक झटपट ॲडमिन प्रवेश' : '1-Click Instant Admin Sign In')}
              </span>
            </button>

            <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-[11px]">
              <span className="text-emerald-700">
                {language === 'mr' ? 'पासवर्ड:' : 'Password:'}{' '}
                <code className="font-mono text-emerald-900 font-bold">Admin@123456</code>
              </span>
              <button
                type="button"
                onClick={handleFillAdminDemo}
                className="font-bold text-emerald-900 underline hover:text-emerald-950 flex items-center gap-0.5"
              >
                {language === 'mr' ? 'ऑटो-भरा' : 'Auto-fill'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Google One-Click Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full min-h-[44px] flex items-center justify-center gap-3 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition disabled:opacity-50 shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{language === 'mr' ? 'गुगलने सुरू ठेवा' : 'Continue with Google'}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider relative">
            {language === 'mr' ? 'किंवा ईमेल व पासवर्डने' : 'Or with email & password'}
          </span>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'mr' ? 'ईमेल पत्ता' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full min-h-[44px] pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {language === 'mr' ? 'पासवर्ड' : 'Password'}
              </label>
              <Link to="/compliance" className="text-[11px] text-emerald-600 hover:underline">
                {language === 'mr' ? 'सुरक्षा नियम' : 'Security info'}
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[44px] pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full min-h-[44px] rounded-xl text-xs font-bold text-white transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              activeTab === 'admin'
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {loading
              ? (language === 'mr' ? 'तपासत आहे...' : 'Authenticating...')
              : activeTab === 'admin'
              ? (language === 'mr' ? 'ॲडमिन म्हणून प्रवेश करा' : 'Sign In as Administrator')
              : (language === 'mr' ? 'सदस्य म्हणून प्रवेश करा' : 'Sign In as Member')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          <span>{language === 'mr' ? 'नवीन खाते हवे आहे का? ' : 'Need a new account? '}</span>
          <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
            {language === 'mr' ? 'येथे नोंदणी करा' : 'Register here'}
          </Link>
        </div>
      </div>
    </div>
  );
};
