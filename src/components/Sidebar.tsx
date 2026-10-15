import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  UserCheck,
  CreditCard,
  Gift,
  Users,
  FileText,
  Settings,
  Scale,
  Shield,
  Globe,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useLanguage } from '../lib/languageContext';

export const Sidebar: React.FC = () => {
  const { isAdmin, userData } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-50/70 border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] p-4 select-none">
      <div className="flex-1 space-y-6">
        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-bold text-slate-900 truncate">{userData?.fullName || 'User'}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isAdmin
                ? (language === 'mr' ? 'प्रशासक (Admin)' : 'System Administrator')
                : (language === 'mr' ? 'नोंदणीकृत सदस्य' : 'Active Member')}
            </span>
          </div>
          {userData?.referralCode && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{language === 'mr' ? 'रेफरल कोड:' : 'Referral:'}</span>
              <span className="font-mono text-emerald-700 font-bold">{userData.referralCode}</span>
            </div>
          )}
        </div>

        {/* Language Selection Card in Sidebar */}
        <div className="p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>{language === 'mr' ? 'भाषा: मराठी' : 'Language: English'}</span>
          </div>
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            {language === 'mr' ? 'English' : 'मराठी'}
          </button>
        </div>

        {/* Admin Navigation Group */}
        {isAdmin && (
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === 'mr' ? 'ॲडमिन व्यवस्थापन' : 'Management Desk'}
            </p>
            <nav className="space-y-1">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>{t('admin_overview', 'Executive Overview')}</span>
              </NavLink>

              <NavLink
                to="/admin/schemes"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>{t('bhishi_schemes', 'Bhishi Schemes')}</span>
              </NavLink>

              <NavLink
                to="/admin/memberships"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>{t('memberships_approvals', 'Membership & Approvals')}</span>
              </NavLink>

              <NavLink
                to="/admin/payments"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{t('collections_ledger', 'Collections & Receipts')}</span>
              </NavLink>

              <NavLink
                to="/admin/payouts"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Gift className="w-4 h-4 text-emerald-600" />
                <span>{t('rotation_payouts', 'Rotation Payouts')}</span>
              </NavLink>

              <NavLink
                to="/admin/audit-logs"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{t('audit_logs', 'Audit Trail')}</span>
              </NavLink>

              <NavLink
                to="/admin/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>{t('settings', 'App Settings')}</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* Member Navigation Group */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {language === 'mr' ? 'सदस्य विभाग' : 'Member Portal'}
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              <span>{t('dashboard', 'Personal Dashboard')}</span>
            </NavLink>

            <NavLink
              to="/schemes"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{language === 'mr' ? 'उपलब्ध भिशी योजना' : 'Available Bhishis'}</span>
            </NavLink>

            <NavLink
              to="/my-bhishi"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{language === 'mr' ? 'माझे भिशी गट' : 'My Enrolled Groups'}</span>
            </NavLink>

            <NavLink
              to="/payments"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{language === 'mr' ? 'हप्ते व पावत्या' : 'Installments & Receipts'}</span>
            </NavLink>

            <NavLink
              to="/referrals"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>{t('referrals', 'Refer & Earn')}</span>
            </NavLink>

            <NavLink
              to="/compliance"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Scale className="w-4 h-4 text-slate-500" />
              <span>{t('compliance', 'Legal Disclosures')}</span>
            </NavLink>
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>BhishiPro v2.5</span>
        <span className="text-emerald-700 flex items-center gap-1 font-mono font-semibold">
          <Shield className="w-3 h-3 text-emerald-600" /> Secure
        </span>
      </div>
    </aside>
  );
};
