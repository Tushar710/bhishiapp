import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Membership, BhishiScheme, PaymentSchedule, AppUser } from '../lib/types';
import { formatINR, formatDate } from '../lib/formatters';
import { useAuth } from '../lib/authContext';
import { useLanguage } from '../lib/languageContext';
import { logAdminAction, sendNotification } from '../lib/activity';
import {
  Users,
  Search,
  X,
  AlertCircle,
  Plus,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AdminMembershipsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [schemesMap, setSchemesMap] = useState<Record<string, BhishiScheme>>({});
  const [schemesList, setSchemesList] = useState<BhishiScheme[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'applied' | 'active'>('all');
  const [search, setSearch] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Approval modal state (for existing applications)
  const [approvingMem, setApprovingMem] = useState<Membership | null>(null);
  const [assignedRotation, setAssignedRotation] = useState<number>(1);
  const [membershipNo, setMembershipNo] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Member Modal State (Direct Admin Enrollment)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [enrollMode, setEnrollMode] = useState<'walkin' | 'registered'>('walkin');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberNotes, setNewMemberNotes] = useState('');
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newRotationIndex, setNewRotationIndex] = useState(1);
  const [newMembershipNo, setNewMembershipNo] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchMembershipsAndSchemes = async () => {
    try {
      const [memSnap, schemeSnap, userSnap] = await Promise.all([
        getDocs(collection(db, 'memberships')),
        getDocs(collection(db, 'bhishiSchemes')),
        getDocs(collection(db, 'users')),
      ]);

      const sMap: Record<string, BhishiScheme> = {};
      const sList: BhishiScheme[] = [];
      schemeSnap.forEach((d) => {
        const scheme = { id: d.id, ...d.data() } as BhishiScheme;
        sMap[d.id] = scheme;
        sList.push(scheme);
      });
      setSchemesMap(sMap);
      setSchemesList(sList);

      const mList: Membership[] = [];
      memSnap.forEach((d) => {
        mList.push({ id: d.id, ...d.data() } as Membership);
      });
      mList.sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
      setMemberships(mList);

      const uList: AppUser[] = [];
      userSnap.forEach((d) => {
        uList.push({ uid: d.id, ...d.data() } as AppUser);
      });
      setRegisteredUsers(uList);

      // Default selected scheme for add modal if available
      if (sList.length > 0 && !selectedSchemeId) {
        setSelectedSchemeId(sList[0].id);
      }
    } catch (err) {
      console.warn('Error fetching memberships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipsAndSchemes();
  }, []);

  // Check URL query param ?action=add to automatically open add modal
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAddMemberModal();
    }
  }, [searchParams, schemesList]);

  const openApproveModal = (m: Membership) => {
    setApprovingMem(m);
    setError(null);
    const existingInScheme = memberships.filter(
      (item) => item.schemeId === m.schemeId && (item.status === 'active' || item.status === 'approved')
    );
    const nextRotation = existingInScheme.length + 1;
    setAssignedRotation(nextRotation);
    setMembershipNo(`MEM-${String(existingInScheme.length + 1).padStart(3, '0')}`);
  };

  const openAddMemberModal = () => {
    setAddError(null);
    const defaultScheme = schemesList[0];
    const targetSchemeId = selectedSchemeId || (defaultScheme ? defaultScheme.id : '');
    setSelectedSchemeId(targetSchemeId);

    const existingInScheme = memberships.filter(
      (m) => m.schemeId === targetSchemeId && (m.status === 'active' || m.status === 'approved')
    );
    const nextIndex = existingInScheme.length + 1;
    setNewRotationIndex(nextIndex);
    setNewMembershipNo(`MEM-${String(memberships.length + 1).padStart(3, '0')}`);
    setIsAddModalOpen(true);
  };

  // Recalculate default rotation and membership number when scheme selection changes in Add modal
  const handleSchemeChangeInAddModal = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    const existingInScheme = memberships.filter(
      (m) => m.schemeId === schemeId && (m.status === 'active' || m.status === 'approved')
    );
    setNewRotationIndex(existingInScheme.length + 1);
  };

  const handleApprove = async () => {
    if (!currentUser || !approvingMem) return;
    const scheme = schemesMap[approvingMem.schemeId];
    if (!scheme) {
      setError(language === 'mr' ? 'योजना सापडली नाही.' : 'Target scheme configuration could not be resolved.');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      // 1. Update membership document
      const memRef = doc(db, 'memberships', approvingMem.id);
      batch.update(memRef, {
        status: 'active',
        rotationIndex: assignedRotation,
        membershipNumber: membershipNo.trim().toUpperCase(),
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.uid,
      });

      // 2. Generate monthly contribution schedules for this member
      const startDate = new Date(scheme.startDate || Date.now());
      for (let i = 1; i <= scheme.durationMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        dueDate.setDate(scheme.collectionDueDay || 10);

        const scheduleRef = doc(collection(db, 'paymentSchedules'));
        const scheduleItem: PaymentSchedule = {
          id: scheduleRef.id,
          schemeId: scheme.id,
          schemeName: scheme.name,
          membershipId: approvingMem.id,
          userId: approvingMem.userId,
          monthIndex: i,
          scheduledAmount: scheme.monthlyContribution,
          dueDate: dueDate.toISOString(),
          paidAmount: 0,
          outstandingBalance: scheme.monthlyContribution,
          status: i === 1 ? 'due' : 'upcoming',
        };
        batch.set(scheduleRef, scheduleItem);
      }

      // 3. Update enrolledCount in scheme
      const schemeRef = doc(db, 'bhishiSchemes', scheme.id);
      batch.update(schemeRef, {
        enrolledCount: (scheme.enrolledCount || 0) + 1,
      });

      await batch.commit();

      // 4. Notify member in-app
      await sendNotification(
        approvingMem.userId,
        language === 'mr' ? 'भिशी सभासदत्व मंजूर!' : 'Bhishi Membership Approved!',
        language === 'mr'
          ? `${scheme.name} साठी आपला अर्ज मंजूर झाला! सभासद क्र.: ${membershipNo}, पाळी महिना: #${assignedRotation}`
          : `Your application for ${scheme.name} was approved! Membership ID: ${membershipNo}. Assigned Rotation Month: #${assignedRotation}.`,
        'membership',
        '/my-bhishi'
      );

      // 5. Audit log
      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'APPROVE_MEMBERSHIP',
        'memberships',
        approvingMem.id,
        `Approved ${approvingMem.userFullName} for ${scheme.name} (Rotation #${assignedRotation})`
      );

      setApprovingMem(null);
      setSuccessToast(
        language === 'mr'
          ? `सभासद ${approvingMem.userFullName} चा अर्ज मंजूर केला गेला!`
          : `Application for ${approvingMem.userFullName} approved successfully!`
      );
      setTimeout(() => setSuccessToast(null), 4000);
      fetchMembershipsAndSchemes();
    } catch (err: any) {
      console.error('Error approving membership:', err);
      setError(err?.message || (language === 'mr' ? 'मंजूर करताना त्रुटी आली.' : 'Failed to approve application.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const scheme = schemesMap[selectedSchemeId];
    if (!scheme) {
      setAddError(language === 'mr' ? 'कृपया भिशी योजना निवडा.' : 'Please select a valid Bhishi Scheme.');
      return;
    }

    setAddLoading(true);
    setAddError(null);

    try {
      let finalUserId = '';
      let finalFullName = '';
      let finalPhone = '';
      let finalEmail = '';

      if (enrollMode === 'registered') {
        const foundUser = registeredUsers.find((u) => u.uid === selectedUserId);
        if (!foundUser) {
          setAddError(language === 'mr' ? 'कृपया नोंदणीकृत वापरकर्ता निवडा.' : 'Please select a registered user.');
          setAddLoading(false);
          return;
        }
        finalUserId = foundUser.uid;
        finalFullName = foundUser.fullName || 'Member';
        finalPhone = foundUser.phone || '';
        finalEmail = foundUser.email || '';
      } else {
        // Direct walk-in / manual entry
        if (!newMemberName.trim()) {
          setAddError(language === 'mr' ? 'सदस्याचे पूर्ण नाव आवश्यक आहे.' : 'Member full name is required.');
          setAddLoading(false);
          return;
        }
        if (!newMemberPhone.trim()) {
          setAddError(language === 'mr' ? 'मोबाईल नंबर आवश्यक आहे.' : 'Mobile number is required.');
          setAddLoading(false);
          return;
        }

        // Generate synthetic or walk-in user doc in Firestore
        const newUserRef = doc(collection(db, 'users'));
        finalUserId = newUserRef.id;
        finalFullName = newMemberName.trim();
        finalPhone = newMemberPhone.trim();
        finalEmail = newMemberEmail.trim() || `member_${finalPhone.replace(/\D/g, '')}@bhishipro.local`;

        const newUserData: AppUser = {
          uid: finalUserId,
          fullName: finalFullName,
          phone: finalPhone,
          email: finalEmail,
          role: 'member',
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        await setDoc(newUserRef, newUserData);
      }

      // Check if user is already enrolled in this scheme
      const alreadyJoined = memberships.some(
        (m) => m.schemeId === scheme.id && m.userId === finalUserId && m.status !== 'rejected'
      );
      if (alreadyJoined) {
        setAddError(
          language === 'mr'
            ? 'हा सदस्य आधीच या भिशी योजनेमध्ये समाविष्ट आहे.'
            : 'This member is already registered in this Bhishi scheme.'
        );
        setAddLoading(false);
        return;
      }

      const batch = writeBatch(db);

      // 1. Create membership document
      const memRef = doc(collection(db, 'memberships'));
      const finalMemNo =
        newMembershipNo.trim().toUpperCase() ||
        `MEM-${String(memberships.length + 1).padStart(3, '0')}`;

      const newMembership: Membership = {
        id: memRef.id,
        schemeId: scheme.id,
        schemeName: scheme.name,
        userId: finalUserId,
        userFullName: finalFullName,
        userPhone: finalPhone,
        userEmail: finalEmail,
        membershipNumber: finalMemNo,
        rotationIndex: Number(newRotationIndex) || 1,
        status: 'active',
        appliedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.uid,
      };

      batch.set(memRef, newMembership);

      // 2. Generate monthly contribution schedules
      const startDate = new Date(scheme.startDate || Date.now());
      for (let i = 1; i <= scheme.durationMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        dueDate.setDate(scheme.collectionDueDay || 10);

        const scheduleRef = doc(collection(db, 'paymentSchedules'));
        const scheduleItem: PaymentSchedule = {
          id: scheduleRef.id,
          schemeId: scheme.id,
          schemeName: scheme.name,
          membershipId: memRef.id,
          userId: finalUserId,
          monthIndex: i,
          scheduledAmount: scheme.monthlyContribution,
          dueDate: dueDate.toISOString(),
          paidAmount: 0,
          outstandingBalance: scheme.monthlyContribution,
          status: i === 1 ? 'due' : 'upcoming',
        };
        batch.set(scheduleRef, scheduleItem);
      }

      // 3. Update enrolledCount in scheme
      const schemeRef = doc(db, 'bhishiSchemes', scheme.id);
      batch.update(schemeRef, {
        enrolledCount: (scheme.enrolledCount || 0) + 1,
      });

      await batch.commit();

      // 4. Log admin audit action
      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'ADMIN_ENROLL_MEMBER',
        'memberships',
        memRef.id,
        `Admin directly enrolled ${finalFullName} in ${scheme.name} (Member ID: ${finalMemNo}, Turn #${newRotationIndex})`
      );

      // Reset form
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberEmail('');
      setNewMemberNotes('');
      setIsAddModalOpen(false);

      setSuccessToast(
        language === 'mr'
          ? `सदस्य "${finalFullName}" यशस्वीरित्या भिशीमध्ये जोडला गेला!`
          : `Member "${finalFullName}" successfully added to ${scheme.name}!`
      );
      setTimeout(() => setSuccessToast(null), 5000);

      fetchMembershipsAndSchemes();
    } catch (err: any) {
      console.error('Error adding member:', err);
      setAddError(
        err?.message ||
          (language === 'mr' ? 'सदस्य जोडताना त्रुटी आली.' : 'Failed to enroll member.')
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleReject = async (m: Membership) => {
    if (!currentUser) return;
    const confirmPrompt =
      language === 'mr'
        ? `तुम्हाला खात्री आहे का की "${m.userFullName}" चा अर्ज नाकारायचा आहे?`
        : `Are you sure you want to reject the application for ${m.userFullName}?`;

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'memberships', m.id), {
        status: 'rejected',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.uid,
      });

      await sendNotification(
        m.userId,
        language === 'mr' ? 'भिशी अर्ज स्थिती' : 'Membership Application Status',
        language === 'mr'
          ? `${m.schemeName || 'भिशी गट'} साठी आपला अर्ज सध्या स्वीकारला जाऊ शकला नाही.`
          : `Your application for ${m.schemeName || 'Bhishi Group'} could not be approved at this time.`,
        'membership',
        '/schemes'
      );

      await logAdminAction(
        currentUser.uid,
        currentUser.email || '',
        'REJECT_MEMBERSHIP',
        'memberships',
        m.id,
        `Rejected application of ${m.userFullName}`
      );

      fetchMembershipsAndSchemes();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = memberships.filter((m) => {
    const matchesFilter = filter === 'all' ? true : m.status === filter;
    const matchesSearch =
      (m.userFullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.userPhone || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.membershipNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.schemeName || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = memberships.filter((m) => m.status === 'applied').length;
  const activeCount = memberships.filter((m) => m.status === 'active' || m.status === 'approved').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Success Notification Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Title and Primary "+ Add Member" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'mr' ? 'सदस्य व्यवस्थापन व पाळी वाटप' : 'Membership Approvals & Rotation Desk'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              {memberships.length} {language === 'mr' ? 'नोंदणी' : 'Members'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'mr'
              ? 'नवीन सदस्य जोडा, ऑनलाइन अर्जांची पडताळणी करा, लकी ड्रॉ/पाळी महिना नेमून द्या आणि मासिक हप्त्यांचे शेड्युल तयार करा.'
              : 'Add members directly, review applications, assign rotation months, and generate contribution amortization schedules.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Help Guide Toggle Button */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-2xs whitespace-nowrap"
            title={language === 'mr' ? 'मार्गदर्शिका पहा' : 'View Guide'}
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>{language === 'mr' ? 'कसे जोडावे?' : 'How to Add?'}</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Primary "+ Add Member" Button */}
          <button
            onClick={openAddMemberModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'mr' ? '+ नवीन सदस्य जोडा' : '+ Add New Member'}</span>
          </button>
        </div>
      </div>

      {/* Helpful Step-by-Step Guide Banner (Answering user: "admin panel se kaise members add kare") */}
      {showGuide && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs text-slate-800 relative space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('guide_title')}</span>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 space-y-1.5 shadow-2xs">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                  A
                </span>
                {language === 'mr' ? 'पद्धत १: ॲडमिन पॅनेलमधून थेट सदस्य जोडा' : 'Method 1: Direct Admin Enrollment'}
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {language === 'mr'
                  ? 'वरील "+ नवीन सदस्य जोडा" बटणावर क्लिक करा. योजनेची निवड करा, सदस्याचे नाव व मोबाईल नंबर टाका आणि त्याची पाळी (महिना क्र.) निवडून सबमिट करा. सिस्टीम आपोआप सभासद नंबर व हप्त्याचे शेड्युल तयार करते.'
                  : 'Click "+ Add New Member" button at top. Choose scheme, type member name & mobile number, select rotation payout month, and click Submit. System auto-generates membership number and payment schedules.'}
              </p>
            </div>

            <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 space-y-1.5 shadow-2xs">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                  B
                </span>
                {language === 'mr' ? 'पद्धत २: सदस्यांच्या ऑनलाइन अर्जांची मंजुरी' : 'Method 2: Approve Online Applicants'}
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {language === 'mr'
                  ? 'जेव्हा सदस्य ॲपमधून भिशीसाठी अप्लाय करतात, तेव्हा ते खालील "प्रलंबित अर्ज" टॅबमध्ये दिसतात. तिथे "मंजूर करा" वर क्लिक करून एका क्लिकमध्ये पाळी क्रमांक देऊन मंजूर करू शकता.'
                  : 'When users apply via the app, they appear under "Pending Applications" tab below. Simply click "Assign & Approve" to assign their rotation slot and activate.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_members_placeholder', 'Search member name, phone or group...')}
            className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === 'all'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'mr' ? `सर्व सदस्य (${memberships.length})` : `All (${memberships.length})`}
          </button>

          <button
            onClick={() => setFilter('applied')}
            className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              filter === 'applied'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{language === 'mr' ? 'प्रलंबित अर्ज' : 'Pending'}</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === 'active'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'mr' ? `सक्रिय सदस्य (${activeCount})` : `Active (${activeCount})`}
          </button>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-2xs">
          <Users className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-900">
            {language === 'mr' ? 'कोणतेही सदस्य सापडले नाहीत' : 'No Membership Records'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'mr'
              ? 'निवडलेल्या फिल्टरनुसार कोणताही सदस्य रेकॉर्ड उपलब्ध नाही. नवीन सदस्य जोडण्यासाठी खालील बटण दाबा.'
              : 'No member applications found for the selected filter. Click below to add a member.'}
          </p>
          <button
            onClick={openAddMemberModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'mr' ? '+ नवीन सदस्य जोडा' : '+ Add New Member'}</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{language === 'mr' ? 'सदस्याचे नाव व तपशील' : 'Member Details'}</th>
                  <th className="py-3.5 px-4">{language === 'mr' ? 'भिशी योजना' : 'Bhishi Scheme'}</th>
                  <th className="py-3.5 px-4">{language === 'mr' ? 'सदस्य क्र. (ID)' : 'Member ID'}</th>
                  <th className="py-3.5 px-4">{language === 'mr' ? 'पाळी / महिना क्र.' : 'Rotation Slot'}</th>
                  <th className="py-3.5 px-4">{language === 'mr' ? 'स्थिती' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'mr' ? 'क्रिया' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{m.userFullName || 'Member'}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {m.userPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {m.userPhone}
                          </span>
                        )}
                        {m.userEmail && !m.userEmail.includes('@bhishipro.local') && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {m.userEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 font-semibold">{m.schemeName || 'Bhishi Circle'}</p>
                      <p className="text-[10px] font-mono text-emerald-700">
                        {schemesMap[m.schemeId] ? formatINR(schemesMap[m.schemeId].monthlyContribution) + '/mo' : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {m.membershipNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {m.rotationIndex ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {language === 'mr' ? `महिना #${m.rotationIndex}` : `Month #${m.rotationIndex}`}
                        </span>
                      ) : (
                        <span className="text-slate-400">{language === 'mr' ? 'नेमलेले नाही' : 'Unassigned'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase border ${
                          m.status === 'active' || m.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : m.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {m.status === 'active'
                          ? (language === 'mr' ? 'सक्रिय' : 'Active')
                          : m.status === 'applied'
                          ? (language === 'mr' ? 'प्रलंबित अर्ज' : 'Applied')
                          : m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.status === 'applied' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openApproveModal(m)}
                            className="min-h-[36px] px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs"
                          >
                            {language === 'mr' ? 'मंजूर करा' : 'Assign & Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(m)}
                            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[11px] transition border border-slate-200"
                            title={language === 'mr' ? 'नाकारा' : 'Reject'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {language === 'mr' ? 'नोंदणीकृत' : 'Enrolled'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. ADD NEW MEMBER MODAL (Direct Admin Enrollment)       */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'mr' ? 'नवीन सदस्य जोडा (Add Member)' : 'Add New Member to Bhishi'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'mr'
                      ? 'सदस्याला थेट भिशीमध्ये जोडा आणि हप्त्याचे शेड्युल तयार करा'
                      : 'Enroll a member directly and auto-generate contribution schedules'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-xs">
              {/* Member Entry Mode Toggle */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {language === 'mr' ? 'सदस्य प्रकार' : 'Member Type'}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEnrollMode('walkin')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      enrollMode === 'walkin'
                        ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'mr' ? 'ऑफलाइन / थेट सदस्य' : 'New / Walk-in Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnrollMode('registered')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      enrollMode === 'registered'
                        ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'mr' ? 'नोंदणीकृत युझर निवडा' : 'Select Registered User'}
                  </button>
                </div>
              </div>

              {/* Mode 1: Walk-in / Direct Fields */}
              {enrollMode === 'walkin' ? (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'mr' ? 'सदस्याचे पूर्ण नाव *' : 'Member Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder={language === 'mr' ? 'उदा. राहुल रमेश पाटील' : 'e.g. Rahul Patil'}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {language === 'mr' ? 'मोबाईल नंबर *' : 'Mobile Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {language === 'mr' ? 'ईमेल (ऐच्छिक)' : 'Email (Optional)'}
                      </label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="e.g. member@gmail.com"
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: Existing User Dropdown */
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block font-semibold text-slate-700">
                    {language === 'mr' ? 'नोंदणीकृत युझर निवडा *' : 'Select Registered App User *'}
                  </label>
                  {registeredUsers.length === 0 ? (
                    <p className="text-slate-500 text-xs">
                      {language === 'mr' ? 'कोणतेही युझर्स आढळले नाहीत.' : 'No registered users found.'}
                    </p>
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">
                        {language === 'mr' ? '-- वापरकर्ता निवडा --' : '-- Choose User --'}
                      </option>
                      {registeredUsers.map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.fullName || 'User'} ({u.phone || u.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Target Bhishi Scheme Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'mr' ? 'भिशी योजना निवडा *' : 'Target Bhishi Scheme *'}
                </label>
                {schemesList.length === 0 ? (
                  <p className="text-rose-600 text-xs">
                    {language === 'mr'
                      ? 'कोणतीही भिशी योजना उपलब्ध नाही. कृपया आधी योजना तयार करा.'
                      : 'No schemes available. Please create a scheme first.'}
                  </p>
                ) : (
                  <select
                    value={selectedSchemeId}
                    onChange={(e) => handleSchemeChangeInAddModal(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {schemesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {formatINR(s.monthlyContribution)}/mo ({s.durationMonths} {language === 'mr' ? 'महिने' : 'Months'})
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected Scheme Quick Details Badge */}
                {schemesMap[selectedSchemeId] && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>{language === 'mr' ? 'हप्ता:' : 'Due:'}</strong> {formatINR(schemesMap[selectedSchemeId].monthlyContribution)} / {language === 'mr' ? 'महिना' : 'mo'}
                    </span>
                    <span>
                      <strong>{language === 'mr' ? 'कालावधी:' : 'Duration:'}</strong> {schemesMap[selectedSchemeId].durationMonths} {language === 'mr' ? 'महिने' : 'months'}
                    </span>
                    <span>
                      <strong>{language === 'mr' ? 'एकूण रक्कम:' : 'Pot Size:'}</strong> {formatINR(schemesMap[selectedSchemeId].monthlyContribution * schemesMap[selectedSchemeId].totalMembers)}
                    </span>
                    <span>
                      <strong>{language === 'mr' ? 'तारीख:' : 'Day:'}</strong> {schemesMap[selectedSchemeId].collectionDueDay || 10}
                    </span>
                  </div>
                )}
              </div>

              {/* Rotation Slot & Membership Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'mr' ? 'पाळी / महिना क्र. *' : 'Rotation Month (Turn) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={schemesMap[selectedSchemeId]?.durationMonths || 60}
                    value={newRotationIndex}
                    onChange={(e) => setNewRotationIndex(Number(e.target.value))}
                    className="w-full min-h-[42px] px-3.5 py-2 font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'mr'
                      ? `या महिन्यामध्ये सदस्याला भिशीचा उठाव मिळेल`
                      : `Month when member receives payout`}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'mr' ? 'सदस्य क्रमांक (Membership ID)' : 'Membership Number'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newMembershipNo}
                    onChange={(e) => setNewMembershipNo(e.target.value.toUpperCase())}
                    placeholder="e.g. MEM-001"
                    className="w-full min-h-[42px] px-3.5 py-2 font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'mr' ? 'आपोआप निर्माण केलेला आयडी' : 'Auto-generated or custom'}
                  </p>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'mr' ? 'टिपण्णी / संदर्भ (ऐच्छिक)' : 'Notes / Reference (Optional)'}
                </label>
                <input
                  type="text"
                  value={newMemberNotes}
                  onChange={(e) => setNewMemberNotes(e.target.value)}
                  placeholder={language === 'mr' ? 'उदा. ओळख: सचिन पाटील, रोख हप्ता देणार' : 'e.g. Referred by member, cash payment'}
                  className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {addLoading
                      ? (language === 'mr' ? 'जोडत आहे...' : 'Enrolling Member...')
                      : (language === 'mr' ? 'सदस्य जोडा व शेड्युल बनवा' : 'Enroll & Generate Schedule')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. APPROVAL MODAL (For Online Applicant Requests)       */}
      {/* ======================================================== */}
      {approvingMem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {language === 'mr' ? 'अर्ज मंजूर करा व पाळी नेमून द्या' : 'Approve & Assign Rotation'}
              </h3>
              <button
                onClick={() => setApprovingMem(null)}
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

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <p className="font-bold text-slate-900">{approvingMem.userFullName}</p>
              <p className="text-slate-600">
                {language === 'mr' ? 'योजना:' : 'Target Scheme:'} {approvingMem.schemeName}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'mr' ? 'सदस्य क्रमांक (Membership ID)' : 'Assigned Membership Number'}
                </label>
                <input
                  type="text"
                  required
                  value={membershipNo}
                  onChange={(e) => setMembershipNo(e.target.value.toUpperCase())}
                  placeholder="e.g. MEM-001"
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'mr' ? 'पाळी महिना क्रमांक (1 ते एकूण महिने)' : 'Assigned Payout Rotation Month'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={schemesMap[approvingMem.schemeId]?.durationMonths || 60}
                  value={assignedRotation}
                  onChange={(e) => setAssignedRotation(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'mr'
                    ? `या सदस्याला महिना #${assignedRotation} मध्ये भिशीची एकूण रक्कम दिली जाईल.`
                    : `This member will receive the lump-sum pot in Month #${assignedRotation} of the cycle.`}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setApprovingMem(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition disabled:opacity-50 shadow-sm"
              >
                {actionLoading
                  ? (language === 'mr' ? 'मंजूर होत आहे...' : 'Activating...')
                  : (language === 'mr' ? 'मंजूर करा व शेड्युल बनवा' : 'Confirm & Generate Schedule')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
