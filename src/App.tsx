import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/authContext';
import { LanguageProvider } from './lib/languageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';

// Pages
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ComplianceTermsPage } from './pages/ComplianceTermsPage';
import { SchemesPage } from './pages/SchemesPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Member Pages
import { UserDashboard } from './pages/UserDashboard';
import { UserMyBhishiPage } from './pages/UserMyBhishiPage';
import { UserPaymentsPage } from './pages/UserPaymentsPage';
import { UserReferralsPage } from './pages/UserReferralsPage';
import { UserProfilePage } from './pages/UserProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminSchemesPage } from './pages/AdminSchemesPage';
import { AdminMembershipsPage } from './pages/AdminMembershipsPage';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';
import { AdminPayoutsPage } from './pages/AdminPayoutsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

// Protected Route Guard for logged in members
const ProtectedMemberRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Protected Route Guard for administrators
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Determine if current route is authenticated dashboard area
  const isAuthArea =
    currentUser &&
    (location.pathname.startsWith('/admin') ||
      location.pathname === '/dashboard' ||
      location.pathname === '/my-bhishi' ||
      location.pathname === '/payments' ||
      location.pathname === '/referrals' ||
      location.pathname === '/profile');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar for Authenticated Users */}
        {isAuthArea && <Sidebar />}

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/compliance" element={<ComplianceTermsPage />} />
            <Route path="/schemes" element={<SchemesPage />} />
            <Route path="/schemes/:id" element={<SchemeDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin-login" element={<Navigate to="/login?portal=admin" replace />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Member protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedMemberRoute>
                  <UserDashboard />
                </ProtectedMemberRoute>
              }
            />
            <Route
              path="/my-bhishi"
              element={
                <ProtectedMemberRoute>
                  <UserMyBhishiPage />
                </ProtectedMemberRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedMemberRoute>
                  <UserPaymentsPage />
                </ProtectedMemberRoute>
              }
            />
            <Route
              path="/referrals"
              element={
                <ProtectedMemberRoute>
                  <UserReferralsPage />
                </ProtectedMemberRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedMemberRoute>
                  <UserProfilePage />
                </ProtectedMemberRoute>
              }
            />

            {/* Admin protected routes */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/schemes"
              element={
                <ProtectedAdminRoute>
                  <AdminSchemesPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/memberships"
              element={
                <ProtectedAdminRoute>
                  <AdminMembershipsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedAdminRoute>
                  <AdminPaymentsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/payouts"
              element={
                <ProtectedAdminRoute>
                  <AdminPayoutsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedAdminRoute>
                  <AdminAuditLogsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedAdminRoute>
                  <AdminSettingsPage />
                </ProtectedAdminRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Android-style Bottom Navigation for Authenticated Users */}
      <BottomNav />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
