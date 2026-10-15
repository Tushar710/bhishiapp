import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Layers, CreditCard, Users, User } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useLanguage } from '../lib/languageContext';

export const BottomNav: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { language, t } = useLanguage();

  // Show bottom nav on mobile if user is authenticated
  if (!currentUser) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        {/* Tab 1: Home / Dashboard */}
        <NavLink
          to={isAdmin ? '/admin' : '/dashboard'}
          className={({ isActive }) =>
            `min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1">{t('home', 'Home')}</span>
        </NavLink>

        {/* Tab 2: My Bhishi / Schemes */}
        <NavLink
          to={isAdmin ? '/admin/schemes' : '/my-bhishi'}
          className={({ isActive }) =>
            `min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1">
            {isAdmin ? (language === 'mr' ? 'योजना' : 'Schemes') : (language === 'mr' ? 'माझी भिशी' : 'My Bhishi')}
          </span>
        </NavLink>

        {/* Tab 3: Payments */}
        <NavLink
          to={isAdmin ? '/admin/payments' : '/payments'}
          className={({ isActive }) =>
            `min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1">{t('payments', 'Payments')}</span>
        </NavLink>

        {/* Tab 4: Members / Referrals */}
        <NavLink
          to={isAdmin ? '/admin/memberships' : '/referrals'}
          className={({ isActive }) =>
            `min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1">
            {isAdmin ? (language === 'mr' ? 'सदस्य' : 'Members') : (language === 'mr' ? 'रेफरल्स' : 'Referrals')}
          </span>
        </NavLink>

        {/* Tab 5: Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1">{t('profile', 'Profile')}</span>
        </NavLink>
      </div>
    </nav>
  );
};
