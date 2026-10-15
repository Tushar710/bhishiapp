# Monthly Bhishi Management System (BhishiPro)

A production-grade, full-stack Monthly Bhishi (Chit Fund / Rotating Savings & Credit Association - ROSCA) management platform built with React, Vite, Tailwind CSS, and Firebase. The system delivers a native-feeling Android PWA experience on mobile touch devices with a fixed bottom navigation bar and touch ergonomics, alongside a high-density, multi-column administrative SaaS console for desktop operations.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions were confirmed during the interactive clarification phase:
> - **Payout Allocation Model**: Pre-agreed monthly rotation queue (fixed orderly rotation schedule assigned transparently upon membership activation, with administrator verification and audit log).
> - **Initial Database State**: Start with an empty, clean database (with interactive onboarding to establish schemes, members, and initial settings without dummy clutter).
> - **Currency & Number Formatting**: Indian Rupee (INR - ₹) with standard Indian numbering system (`₹1,00,000` Lakh / Crore format) and tabular figures (`tabular-nums`) across all financial tables, metrics, and receipts.

---

### 1. Overview & Core Concept

- **What It Does**: Digitizes community and commercial monthly bhishi (chit fund) operations. Enables administrators to design customized bhishi schemes, screen and approve applicants, record verified monthly contributions, generate verifiable transaction receipts, track member queues and payouts, coordinate referral attribution, and send real-time notifications. Members can track their upcoming dues, download payment receipts, monitor their payout turn, and earn rewards via unique referral links.
- **Target Audience & Roles**:
  - *Super Admin / Platform Owner*: Global settings, admin delegation, audit trails, and platform integrity checks.
  - *Admin / Bhishi Manager*: Scheme creation, membership approvals, manual payment verification, rotation payout recording, announcement broadcasting, and financial reconciliation.
  - *User / Member*: Scheme discovery, membership application, installment status checking, receipt generation, rotation schedule viewing, and referral tracking.
- **Key Value**: Replaces disorganized paper ledgers and chat screenshots with an immutable, auditable, and transparent financial ledger that upholds strict data isolation and regulatory disclosures.

---

### 2. User Experience & Visual Design

- **Dual Mobile & Desktop Layout Architecture**:
  - **Mobile Experience (Android-native Touch Feel)**:
    - Fixed bottom tab bar (`h-16 pb-safe`): *Home*, *My Bhishi*, *Payments*, *Referrals*, *Profile*.
    - Compact sticky top bar ($54\text{px}$) with notification bell badge, user avatar, and contextual title.
    - Full-screen slide-over modals and bottom sheets for payment submissions, receipt previews, and filter drawers.
    - Touch targets guaranteed at $\ge 44 \times 44\text{px}$, with natural thumb reach zone optimization for primary CTAs.
  - **Desktop Experience (High-Density Fintech SaaS)**:
    - Collapsible left sidebar ($260\text{px}$) with grouped navigation (Operations, Finance, Members, Compliance, Settings).
    - Top breadcrumb bar with contextual action buttons, search, and user profile menu.
    - Multi-column metric grids, searchable data tables with column sorting, date range filters, and export tools.
- **Visual Identity & Color Strategy (60-30-10 Rule)**:
  - **60% Neutral Canvas**: Pure crisp light backgrounds (`#F8FAFC` slate-50 / `#FFFFFF`) and deep navy-tinted dark mode (`#0B132B` / `#1C2541`).
  - **30% Structural Surfaces**: Deep navy slate headers and cards (`#0F172A` / `#1E293B`), subtle hairline borders (`border-slate-200 dark:border-slate-800`), and clean unboxed metadata.
  - **10% High-Intent Accents**: Emerald Green (`#059669` / `#10B981`) for verified collections, timely payments, and confirmed payouts; Royal Navy/Indigo (`#1E40AF` / `#2563EB`) for primary navigation and focus actions; Amber (`#D97706`) for pending verifications; Crimson (`#DC2626`) for overdue installments.
- **Typography & Formatting**:
  - Primary typeface: `Plus Jakarta Sans` for clean, contemporary fintech headings and body prose.
  - Monospace numeric figures: Strict `tabular-nums` formatting for all amounts, percentages, installment numbers, dates, and transaction references.
  - Zero-pill discipline: Metadata rendered as quiet unboxed text separated by typographic dots (`·`). Interactive controls use clean segmented controls.
- **Interactive Feedback**:
  - Skeleton loaders matching target table rows and cards during Firestore reads.
  - Non-intrusive offline connectivity status pill (`Offline mode — cached data active`).
  - Printable and downloadable PDF/image styled HTML receipts for every verified transaction.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Verified Multi-Step Payment Workflow vs Instant Approval**
  - *Chosen Approach*: Users submit payment references/proofs -> status becomes `Pending Verification` -> Admins verify bank/cash receipt and confirm -> status transitions to `Paid`, generating an immutable receipt number.
  - *Why*: In community chit funds, accidental or fraudulent client-side confirmations destroy trust. Financial entries must be administrator-verified.
  - *Alternatives Considered*: Automatic client-side approval was rejected as unsafe; third-party payment gateway webhooks can be wired without changing this verification core.
- **Decision 2: Rotation Queue Payout Model with Documented Audit Trail**
  - *Chosen Approach*: Sequential month-by-month member payout rotation with administrator sign-off, deduction calculations (processing fee or bid discount), and net payout recording.
  - *Why*: Matches user-requested clarification; eliminates gambling or lottery ambiguities, complying with transparent mutual-aid ROSCA requirements.
- **Decision 3: Server-Enforced Security & Rules via Firestore Blueprint**
  - *Chosen Approach*: Declarative `firebase-blueprint.json` coupled with hardened `firestore.rules` preventing identity spoofing, client role escalation, and unauthorized reads of PII.
  - *Why*: Financial records require zero-trust access control. Members can only query their own memberships and payment histories; admin operations require explicit server-side role validation.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BHISHIPRO APPLICATION ARCHITECTURE                    │
├──────────────────────────────────────┬──────────────────────────────────────┤
│        DESKTOP WEB VIEWPORT          │       MOBILE ANDROID PWA VIEWPORT    │
│  ┌────────────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ Left Sidebar (260px)           │  │  │ Compact Header (54px)          │  │
│  │ Top Breadcrumb & Action Bar    │  │  │ Scrollable Feed & Tab Views    │  │
│  │ Multi-Column Analytics & Grids │  │  │ Bottom Action Sheets & Drawers │  │
│  └────────────────────────────────┘  │  │ Fixed Bottom Nav Bar (5 tabs)  │  │
│                                      │  └────────────────────────────────┘  │
├──────────────────────────────────────┴──────────────────────────────────────┤
│                         REACT APPLICATION CORE (Vite)                       │
│  - React Router (Role Guards & Lazy Route Boundaries)                       │
│  - Auth Context & RBAC Provider (SuperAdmin / Admin / Member)               │
│  - PWA Integration (VitePWA, Service Worker, Web App Manifest)              │
│  - Financial Calculations Engine (Lakh/Crore INR formatter, amortization)   │
│  - Export Engine (CSV reports, Printable Transaction Receipts)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                          FIREBASE DATA & CLOUD SERVICES                     │
│  ┌───────────────────────┬───────────────────────┬───────────────────────┐  │
│  │ Firebase Auth         │ Cloud Firestore       │ Firebase Cloud        │  │
│  │ - Email/Password      │ - users               │ Messaging (FCM) & PWA │  │
│  │ - Google OAuth Popup  │ - bhishiSchemes       │ - In-app badge alerts │  │
│  │ - Session persistence │ - memberships         │ - Scheduled dues      │  │
│  │                       │ - paymentSchedules    │ - Install prompts     │  │
│  │                       │ - payments & receipts │                       │  │
│  │                       │ - payouts & queues    │                       │  │
│  │                       │ - referrals & rewards │                       │  │
│  │                       │ - auditLogs           │                       │  │
│  └───────────────────────┴───────────────────────┴───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key Firestore Collections & Schema:
- **`users`**: `{ uid, fullName, email, phone, role: 'superadmin'|'admin'|'member', referralCode, referredBy, status: 'active'|'suspended', createdAt }`
- **`admins`**: `{ uid, grantedBy, createdAt }` (Dedicated lookup collection for fast, secure `isAdmin()` rules without client token tampering)
- **`bhishiSchemes`**: `{ id, schemeCode, name, description, monthlyContribution, totalMembers, durationMonths, startDate, endDate, collectionDueDay, payoutMethod: 'rotation', status: 'draft'|'open'|'active'|'completed'|'cancelled', terms, rules }`
- **`memberships`**: `{ id, schemeId, userId, membershipNumber, rotationIndex, status: 'applied'|'approved'|'active'|'completed'|'rejected', appliedAt, approvedAt }`
- **`paymentSchedules`**: `{ id, schemeId, membershipId, userId, monthIndex, scheduledAmount, dueDate, paidAmount, outstandingBalance, status: 'upcoming'|'due'|'paid'|'overdue'|'waived' }`
- **`payments`**: `{ id, receiptNumber, scheduleId, schemeId, userId, amount, paymentMethod, transactionRef, verifiedByAdminId, verifiedAt, status: 'pending'|'verified'|'rejected' }`
- **`payouts`**: `{ id, schemeId, memberId, userId, monthIndex, grossAmount, deductions, netAmount, status: 'scheduled'|'approved'|'paid', paidAt, adminNotes }`
- **`referrals`**: `{ id, referrerId, refereeId, referralCode, status: 'registered'|'qualified'|'rewarded', qualifiedAt }`
- **`announcements` & `notifications`**: `{ id, targetRole, userId, title, message, read, link, createdAt }`
- **`auditLogs`**: `{ id, adminId, action, targetEntity, entityId, details, timestamp }`

---

### 5. Implementation Phases & Milestones

1. **Phase 1: Project Scaffolding, PWA Configuration & Routing**
   - Install required packages (`firebase`, `react-router-dom`, `lucide-react`, `recharts`, `vite-plugin-pwa`).
   - Configure Web App Manifest, Service Worker auto-update, safe meta viewport tags, and PWA icons.
   - Set up Tailwind styling system with custom theme tokens, typography, and responsive layouts.
2. **Phase 2: Firebase Provisioning, Security Rules & Authentication**
   - Execute Firebase integration workflow (`show_aistudio_ui`, terms check, `ProvisionFirebase`).
   - Create `firebase-blueprint.json` and hardened `firestore.rules` adhering to the 8 security pillars.
   - Implement Auth Provider with Email/Password, Google Sign-in, user profile sync, and role-based route guards.
3. **Phase 3: Scheme Creation & Member Enrollment Workflow**
   - Admin Scheme Studio: Form validation to create, edit, open, and publish Bhishi schemes.
   - Member Scheme Catalog: Browse schemes, review calculation previews (total contribution, monthly commitment), and submit membership applications.
   - Admin Approval Desk: Review applications, assign membership numbers and rotation indices.
4. **Phase 4: Payment Management, Receipts & Rotation Payouts**
   - Automatic generation of monthly contribution schedules upon membership activation.
   - Member payment submission modal with proof reference tracking.
   - Admin Payment Ledger: Filter by month/scheme/member, record verified payments, issue unique receipt numbers, and print/download receipts.
   - Payout Allocation Desk: Sequential rotation manager with deduction calculations and payout statements.
5. **Phase 5: Referral Engine & In-App Notification Hub**
   - Referral hub with personalized invite link generation, share button, and referral progression tracker.
   - Notification dispatch system for dues, application statuses, and payment verifications.
   - In-app notification center with unread count badge and read/unread status management.
6. **Phase 6: Admin Analytics, Financial Reports & CSV Exports**
   - Interactive financial analytics dashboard with monthly collection trends, paid vs overdue split, and scheme performance charts.
   - Comprehensive CSV exporter for collections, overdue accounts, and payout ledgers.
   - Audit log viewer for privileged administrator actions.
7. **Phase 7: PWA Polish, Touch Optimization & Verification**
   - Install prompt banner for Android/Chromium and step-by-step iOS Safari helper.
   - Touch ergonomics audit (minimum $44\text{px}$ targets, sticky mobile actions, bottom sheets).
   - End-to-end compilation, build verification, and rules deployment.
