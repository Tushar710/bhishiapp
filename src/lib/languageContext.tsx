import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'mr';

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = 'bhishi_preferred_language';

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Brand & General
    app_name: 'BhishiPro',
    tagline: 'Transparent Digital Chit Fund & Bhishi Management',
    admin_portal: 'Admin Portal',
    member_portal: 'Member Portal',
    home: 'Home',
    dashboard: 'Dashboard',
    schemes: 'Schemes',
    explore_schemes: 'Explore Schemes',
    my_bhishi: 'My Bhishi',
    my_groups: 'My Groups',
    payments: 'Payments',
    installments: 'Installments',
    referrals: 'Referrals',
    profile: 'Profile',
    how_it_works: 'How It Works',
    compliance: 'Legal Disclosures',
    login: 'Login',
    logout: 'Logout',
    admin_login: 'Admin Login',
    quick_admin_access: '⚡ Instant 1-Click Admin Access',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    status: 'Status',
    actions: 'Actions',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    language: 'Language',
    switch_lang: 'मराठी',

    // Admin Navigation & Sections
    admin_overview: 'Admin Overview',
    executive_desk: 'Executive Management Desk',
    bhishi_schemes: 'Bhishi Schemes',
    create_scheme: 'Create Scheme',
    memberships_approvals: 'Memberships & Members',
    add_member: '+ Add Member',
    add_new_member: 'Add New Member',
    how_to_add_member: 'How to Add Members?',
    collections_ledger: 'Collections & Ledger',
    rotation_payouts: 'Rotation Payouts',
    audit_logs: 'Audit Logs',
    settings: 'Settings',

    // Member Management
    member_name: 'Member Full Name',
    member_phone: 'Phone / Mobile Number',
    member_email: 'Email Address',
    select_scheme: 'Select Bhishi Scheme',
    rotation_month: 'Assigned Rotation Month (Turn)',
    membership_number: 'Membership ID / Number',
    member_type: 'Member Mode',
    existing_user: 'Select Registered User',
    walk_in_user: 'New / Walk-in Member (Direct Entry)',
    notes: 'Internal Notes',
    member_added_success: 'Member enrolled successfully! Monthly payment schedule created.',
    member_approved_success: 'Member application approved successfully!',
    search_members_placeholder: 'Search member name, phone, email or group...',
    pending_approvals: 'Pending Approvals',
    active_members: 'Active Members',
    all_members: 'All Members',
    approve: 'Approve',
    reject: 'Reject',
    view_details: 'View Details',
    rotation_assigned: 'Assigned Turn (Month #)',
    no_members_found: 'No members found matching your search.',

    // How to add member guide
    guide_title: 'Quick Guide: How to Add & Manage Members',
    guide_step_1: '1. Click "+ Add Member" at top right to register an offline or online member.',
    guide_step_2: '2. Select the target Bhishi scheme & enter member name and mobile number.',
    guide_step_3: '3. Set the payout rotation month (e.g. Month 1, Month 2, or lucky draw ticket).',
    guide_step_4: '4. Submit! The system automatically creates their schedule and assigns their Membership ID.',
    guide_step_5: 'Note: Members who apply from the website appear in "Pending Approvals" for 1-click verification.',

    // Financial & Schemes
    monthly_contribution: 'Monthly Contribution',
    pool_pot_size: 'Total Pool / Pot',
    duration: 'Duration',
    months: 'Months',
    members_count: 'Members',
    payout_method: 'Payout Method',
    due_day: 'Collection Due Day',
    next_due_date: 'Next Due Date',
    total_collected: 'Total Collected',
    outstanding_dues: 'Outstanding Dues',
    disbursed_payouts: 'Disbursed Payouts',

    // Badges & Statuses
    status_active: 'Active',
    status_applied: 'Applied',
    status_approved: 'Approved',
    status_rejected: 'Rejected',
    status_completed: 'Completed',
    status_due: 'Due',
    status_paid: 'Paid',
    status_overdue: 'Overdue',
    status_upcoming: 'Upcoming',
    status_verified: 'Verified',
    status_pending: 'Pending',

    // Payouts
    record_payout: 'Record Payout',
    draw_lucky_winner: 'Roll Lucky Draw',
    payout_recipient: 'Payout Beneficiary',
    utr_number: 'UTR / Transaction Reference',
  },
  mr: {
    // Brand & General
    app_name: 'भिशीप्रो (BhishiPro)',
    tagline: 'पारदर्शक डिजिटल भिशी व चिटफंड व्यवस्थापन प्रणाली',
    admin_portal: 'ॲडमिन पोर्टल',
    member_portal: 'सदस्य पोर्टल',
    home: 'मुख्यपृष्ठ',
    dashboard: 'डॅशबोर्ड',
    schemes: 'भिशी योजना',
    explore_schemes: 'योजना पहा',
    my_bhishi: 'माझी भिशी',
    my_groups: 'माझे गट',
    payments: 'देयके / हफ्ते',
    installments: 'मासिक हफ्ते',
    referrals: 'रेफरल्स',
    profile: 'माझे प्रोफाइल',
    how_it_works: 'भिशी कशी चालते?',
    compliance: 'कायदेशीर नियम व अटी',
    login: 'लॉगिन करा',
    logout: 'लॉगआउट',
    admin_login: 'ॲडमिन लॉगिन',
    quick_admin_access: '⚡ १-क्लिक झटपट ॲडमिन प्रवेश',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    confirm: 'नक्की करा',
    close: 'बंद करा',
    submit: 'सादर करा',
    search: 'शोधा',
    filter: 'फिल्टर',
    all: 'सर्व',
    status: 'स्थिती',
    actions: 'क्रिया',
    loading: 'लोड होत आहे...',
    success: 'यशस्वी',
    error: 'त्रुटी',
    language: 'भाषा (Language)',
    switch_lang: 'English',

    // Admin Navigation & Sections
    admin_overview: 'ॲडमिन आढावा',
    executive_desk: 'मुख्य व्यवस्थापन केंद्र',
    bhishi_schemes: 'भिशी योजना व्यवस्थापन',
    create_scheme: 'नवीन योजना तयार करा',
    memberships_approvals: 'सदस्य व अर्ज पडताळणी',
    add_member: '+ नवीन सदस्य जोडा',
    add_new_member: 'नवीन सदस्य जोडा',
    how_to_add_member: 'सदस्य कसे जोडावे?',
    collections_ledger: 'हप्ता संकलन व लेजर',
    rotation_payouts: 'उठाव / पाळी वाटप (Payouts)',
    audit_logs: 'ऑडिट लॉग्स',
    settings: 'सेटिंग्ज',

    // Member Management
    member_name: 'सदस्याचे पूर्ण नाव',
    member_phone: 'मोबाईल नंबर',
    member_email: 'ईमेल आयडी',
    select_scheme: 'भिशी योजना निवडा',
    rotation_month: 'वाटप महिना / पाळी नंबर',
    membership_number: 'सदस्य क्रमांक (Membership ID)',
    member_type: 'सदस्य नोंदणी प्रकार',
    existing_user: 'नोंदणीकृत वापरकर्ता निवडा',
    walk_in_user: 'ऑफलाइन / थेट नवीन सदस्य',
    notes: 'टिपण्णी (Notes)',
    member_added_success: 'नवीन सदस्य यशस्वीरित्या जोडला गेला! सर्व महिन्यांचे हफ्ते तयार झाले.',
    member_approved_success: 'सदस्याचा अर्ज मंजूर केला गेला!',
    search_members_placeholder: 'सदस्याचे नाव, मोबाईल नंबर किंवा योजना शोधा...',
    pending_approvals: 'प्रलंबित अर्ज (Approvals)',
    active_members: 'सक्रिय सदस्य',
    all_members: 'सर्व सदस्य',
    approve: 'मंजूर करा',
    reject: 'नाकारा',
    view_details: 'तपशील पहा',
    rotation_assigned: 'नेमून दिलेली पाळी (महिना क्र.)',
    no_members_found: 'कोणतेही सदस्य सापडले नाहीत.',

    // How to add member guide
    guide_title: 'ॲडमिन पॅनेलमधून सदस्य कसे जोडावे? (मार्गदर्शिका)',
    guide_step_1: '१. वरील "+ नवीन सदस्य जोडा" बटणावर क्लिक करा.',
    guide_step_2: '२. ज्या योजनेत सदस्याला सहभागी करायचे आहे ती भिशी योजना निवडा.',
    guide_step_3: '३. सदस्याचे पूर्ण नाव, मोबाईल नंबर आणि पाळी (महिना क्र.) टाका.',
    guide_step_4: '४. "सदस्य जोडा" वर क्लिक करा. सिस्टीम आपोआप सभासद नंबर व हप्त्याचे शेड्युल तयार करेल!',
    guide_step_5: 'टीप: ज्या सदस्यांनी वेबसाइटवरून अर्ज केला आहे, ते "प्रलंबित अर्ज" टॅबमध्ये दिसतात. तिथे एका क्लिकवर "मंजूर करा" करू शकता.',

    // Financial & Schemes
    monthly_contribution: 'मासिक हप्ता',
    pool_pot_size: 'एकूण भिशी रक्कम (Pot)',
    duration: 'कालावधी',
    months: 'महिने',
    members_count: 'एकूण सदस्य',
    payout_method: 'उठाव पद्धत (लकी ड्रॉ / पाळी)',
    due_day: 'हप्ता जमा करण्याची तारीख',
    next_due_date: 'पुढील हप्ता तारीख',
    total_collected: 'एकूण जमा रक्कम',
    outstanding_dues: 'थकीत रक्कम',
    disbursed_payouts: 'वाटप केलेली रक्कम',

    // Badges & Statuses
    status_active: 'सक्रिय',
    status_applied: 'अर्ज केला',
    status_approved: 'मंजूर',
    status_rejected: 'नाकारला',
    status_completed: 'पूर्ण',
    status_due: 'देय',
    status_paid: 'भरला',
    status_overdue: 'थकीत',
    status_upcoming: 'आगामी',
    status_verified: 'पडताळणी पूर्ण',
    status_pending: 'प्रलंबित',

    // Payouts
    record_payout: 'उठाव नोंदवा',
    draw_lucky_winner: 'लकी ड्रॉ काढा',
    payout_recipient: 'रक्कम घेणारा सदस्य',
    utr_number: 'UTR / बँक संदर्भ क्रमांक',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mr' || saved === 'en') {
      return saved;
    }
    // Default to Marathi if user's browser is Marathi, else English default with quick switch
    const browserLang = navigator.language || '';
    if (browserLang.toLowerCase().includes('mr')) {
      return 'mr';
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'mr' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English dictionary
    if (TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
