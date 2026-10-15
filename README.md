# BhishiPro - Professional Monthly Bhishi Management System

A production-grade, full-stack **Monthly Bhishi (Rotating Savings & Credit Association - ROSCA / Chit Fund)** management system built with React, Vite, Tailwind CSS, and Firebase.

BhishiPro delivers an Android-native Progressive Web App (PWA) experience on mobile touch devices with a fixed bottom navigation bar, coupled with a high-density administrative SaaS console for desktop operations.

---

## 1. Key Features

- **Dual Mobile & Desktop Experience**:
  - **Mobile**: Android-style fixed bottom navigation (`Home`, `My Bhishi`, `Payments`, `Referrals`, `Profile`), top app bar, and touch targets $\ge 44 \times 44\text{px}$.
  - **Desktop**: Collapsible left sidebar ($260\text{px}$), analytical Recharts dashboards, and searchable data tables.
- **Pre-Agreed Rotation Queue**:
  - Orderly, dispute-free rotation payout queue. Each member is assigned their designated month slot upon enrollment approval.
  - Zero speculative gambling or lottery draws; complete transparency into scheduled collections and payouts.
- **Verified Payment Ledger & Receipts**:
  - Contributions are marked `Paid` only after manual administrative UTR/deposit verification.
  - Generates official, numbered printable transaction receipts (`RCP-2026-XXXXXX`) with download and print styling.
  - Real-time CSV export for administrative accounting and tax audits.
- **Referral & Incentive Hub**:
  - Unique member referral codes and direct shareable links (`/register?ref=CODE`).
  - Native Web Share API integration (`navigator.share`) and clipboard copy.
  - Anti-self-referral validation and member conversion tracking.
- **In-App Notification Dispatcher**:
  - Real-time in-app alerts with unread counter badges for scheme releases, approval notices, dues reminders, and verified receipts.
- **Zero-Trust Security & RBAC**:
  - Hardened Firestore Security Rules adhering to the 8 Security Pillars.
  - Bootstrapped administrator authorization (`pawartushar710@gmail.com`).
  - Strict data isolation ensuring members can only query their own memberships and payment schedules.
- **PWA Capabilities**:
  - Web App Manifest (`standalone` display mode).
  - Auto-updating Service Worker via `vite-plugin-pwa`.
  - In-app install banner with guided iOS Safari home screen instructions.
  - Offline connectivity detector with non-intrusive status toast.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router v7
- **Backend / Database**: Firebase Authentication, Cloud Firestore (Enterprise Edition)
- **Mobile**: Progressive Web App (PWA), Service Worker, Web App Manifest

---

## 3. Initial Setup & Local Development

### Prerequisites
- Node.js (v18+)
- npm or bun

### Installation
```bash
# Clone or navigate to the repository
cd applet

# Install dependencies
npm install

# Start development server
npm run dev
```
The application runs on `http://localhost:3000`.

---

## 4. Firebase Configuration & Deployment

1. The app connects to Cloud Firestore via `firebase-applet-config.json`.
2. Firestore data structure is defined in `firebase-blueprint.json`.
3. Security rules are maintained in `firestore.rules`.
4. Deploy security rules anytime modifications occur using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 5. User Roles

1. **Super Admin / Platform Owner**:
   - Access to Executive Dashboard, Scheme Studio, Membership Approvals, Collections Ledger, Rotation Payouts, Audit Trail, and Global App Settings.
   - Initialized for developer email: `pawartushar710@gmail.com`.
2. **Member**:
   - Access to Personal Dashboard, Scheme Catalog, Enrolled Groups, Installment Ledger, Official Receipt Download, Referral Hub, and Profile.

---

## 6. Regulatory & Compliance Notice

BhishiPro provides record-keeping, accounting, and rotation communication software. Operates under standard mutual-aid ROSCA / community savings group principles. Nominal totals represent scheduled contributions, not speculative guaranteed returns. Group administrators must ensure compliance with their jurisdiction's applicable Chit Funds Act or mutual credit regulations.
