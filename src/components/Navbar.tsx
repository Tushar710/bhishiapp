import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { useLanguage } from '../lib/languageContext';
import { Bell, ShieldCheck, User as UserIcon, LogOut, Shield, Globe } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NotificationDrawer } from './NotificationDrawer';
import { PWAInstallButton } from './PWAInstallBanner';

export const Navbar: React.FC = () => {
  const { currentUser, userData, isAdmin, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [currentUser.uid, 'all']),
      where('read', '==', false)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setUnreadCount(snap.docs.length);
      },
      () => {
        // Silently handle if query has index constraints
      }
    );
    return () => unsub();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 select-none shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Single text element wordmark */}
          <Link
            to={currentUser ? (isAdmin ? '/admin' : '/dashboard') : '/'}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black shadow-sm">
              ₹
            </div>
            <div className="flex items-center gap-1.5">
              <span>{t('app_name', 'BhishiPro')}</span>
              {isAdmin && (
                <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {t('admin_portal', 'ADMIN')}
                </span>
              )}
            </div>
          </Link>

          {/* Zone 2: Concise navigation links with bilingual translation */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            {!currentUser ? (
              <>
                <Link
                  to="/schemes"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/schemes') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('explore_schemes', 'Explore Schemes')}
                </Link>
                <Link
                  to="/how-it-works"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/how-it-works') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('how_it_works', 'How It Works')}
                </Link>
                <Link
                  to="/compliance"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/compliance') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('compliance', 'Legal Disclosures')}
                </Link>
              </>
            ) : isAdmin ? (
              <>
                <Link
                  to="/admin"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/admin') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('admin_overview', 'Admin Overview')}
                </Link>
                <Link
                  to="/admin/schemes"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/admin/schemes') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('schemes', 'Schemes')}
                </Link>
                <Link
                  to="/admin/memberships"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/admin/memberships') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('memberships_approvals', 'Members & Approvals')}
                </Link>
                <Link
                  to="/admin/payments"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/admin/payments') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('collections_ledger', 'Collections & Ledger')}
                </Link>
                <Link
                  to="/admin/payouts"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/admin/payouts') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('rotation_payouts', 'Rotation Payouts')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/dashboard') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('dashboard', 'Dashboard')}
                </Link>
                <Link
                  to="/schemes"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/schemes') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('schemes', 'Schemes')}
                </Link>
                <Link
                  to="/my-bhishi"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/my-bhishi') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('my_bhishi', 'My Groups')}
                </Link>
                <Link
                  to="/payments"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/payments') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('payments', 'Installments')}
                </Link>
                <Link
                  to="/referrals"
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentPath('/referrals') ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  {t('referrals', 'Referrals')}
                </Link>
              </>
            )}
          </nav>

          {/* Zone 3: Language Switcher + Actions / Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Prominent Language Switcher Button (English / मराठी) */}
            <button
              onClick={toggleLanguage}
              title={language === 'en' ? 'मराठी मध्ये बदला' : 'Switch to English'}
              aria-label="Toggle language between English and Marathi"
              className="min-h-[40px] px-2.5 py-1.5 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span className="tracking-wide">
                {language === 'en' ? 'मराठी' : 'English'}
              </span>
            </button>

            {/* Install PWA Button */}
            <PWAInstallButton />

            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Notification Bell with Hitbox >= 44x44px */}
                <button
                  onClick={() => setShowNotifDrawer(true)}
                  aria-label="View notifications"
                  className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>

                {/* Account dropdown button with Hitbox >= 44x44px */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="min-h-[44px] px-2.5 py-1.5 flex items-center gap-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold border border-emerald-200">
                      {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate">
                      {userData?.fullName || currentUser.email}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{userData?.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAdmin ? (language === 'mr' ? 'प्रशासक (Admin)' : 'System Administrator') : (language === 'mr' ? 'नोंदणीकृत सदस्य' : 'Verified Member')}</span>
                        </div>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 font-semibold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          {t('admin_overview', 'Admin Console')}
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        {t('profile', 'My Profile')}
                      </Link>

                      {/* Language Switcher inside dropdown too */}
                      <button
                        onClick={() => {
                          toggleLanguage();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors font-medium border-t border-slate-100"
                      >
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <span>{language === 'en' ? 'मराठी भाषा निवडा' : 'Switch to English'}</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left transition-colors border-t border-slate-100 font-medium"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        {t('logout', 'Sign Out')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Dedicated Prominent Admin Login button visible on both mobile and desktop */}
                <Link
                  to="/login?portal=admin"
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl transition shadow-2xs whitespace-nowrap"
                  title="Admin Portal Login"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('admin_login', 'Admin Login')}</span>
                </Link>

                <Link
                  to="/login"
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  {t('login', 'Member Sign In')}
                </Link>

                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors shadow-xs whitespace-nowrap shrink-0"
                >
                  {language === 'mr' ? 'नोंदणी करा' : 'Register'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer Modal */}
      {showNotifDrawer && (
        <NotificationDrawer onClose={() => setShowNotifDrawer(false)} />
      )}
    </>
  );
};
