import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Mail, Lock, User, Phone, Gift, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('You must accept the Bhishi terms and transparent disclosures.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerWithEmail(
        email.trim(),
        password,
        fullName.trim(),
        phone.trim(),
        referralCode.trim()
      );
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Registration failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center mx-auto text-xl shadow-md shadow-emerald-600/20">
            ₹
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Create Your Account</h1>
          <p className="text-xs text-slate-500">Join verified monthly Bhishi circles or register as manager</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Patil"
                className="w-full min-h-[44px] pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full min-h-[44px] pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full min-h-[44px] pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referral Code (Optional)
            </label>
            <div className="relative">
              <Gift className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. BHIS8391"
                className="w-full min-h-[44px] pl-10 pr-3 py-2 text-xs font-mono uppercase rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 font-bold placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            {referralCode && (
              <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                Referral code applied. Your inviter will receive reward credit upon approved enrollment.
              </p>
            )}
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="terms" className="text-xs text-slate-600">
              I agree to the{' '}
              <Link to="/compliance" className="text-emerald-700 font-semibold hover:underline">
                ROSCA Terms & Legal Disclosures
              </Link>{' '}
              and understand contributions are verified manually.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 flex flex-col items-center gap-2 text-xs text-slate-500">
          <div>
            <span>Already registered? </span>
            <Link to="/login" className="text-emerald-700 font-bold hover:underline">
              Sign in here
            </Link>
          </div>
          <Link
            to="/login?portal=admin"
            className="text-[11px] font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1 mt-1"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Are you an Administrator? Access Admin Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
