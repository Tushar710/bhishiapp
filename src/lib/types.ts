export type UserRole = 'superadmin' | 'admin' | 'member';

export interface AppUser {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  referralCode?: string;
  referredBy?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt?: string;
}

export type SchemeStatus = 'draft' | 'open' | 'active' | 'completed' | 'cancelled';
export type PayoutMethod = 'rotation' | 'draw' | 'bidding';

export interface BhishiScheme {
  id: string;
  schemeCode: string;
  name: string;
  description: string;
  monthlyContribution: number;
  totalMembers: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  collectionDueDay: number;
  payoutMethod: PayoutMethod;
  status: SchemeStatus;
  terms?: string;
  rules?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  enrolledCount?: number;
}

export type MembershipStatus = 'applied' | 'approved' | 'active' | 'completed' | 'rejected';

export interface Membership {
  id: string;
  schemeId: string;
  schemeName?: string;
  userId: string;
  userFullName?: string;
  userPhone?: string;
  userEmail?: string;
  membershipNumber?: string;
  rotationIndex?: number;
  status: MembershipStatus;
  appliedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type ScheduleStatus = 'upcoming' | 'due' | 'paid' | 'partially_paid' | 'overdue' | 'waived';

export interface PaymentSchedule {
  id: string;
  schemeId: string;
  schemeName?: string;
  membershipId: string;
  userId: string;
  monthIndex: number;
  scheduledAmount: number;
  dueDate: string;
  paidAmount: number;
  outstandingBalance: number;
  status: ScheduleStatus;
  receiptNumber?: string;
  paidAt?: string;
  updatedAt?: string;
}

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'cheque' | 'other';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  scheduleId: string;
  schemeId: string;
  schemeName?: string;
  userId: string;
  userFullName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  notes?: string;
  status: PaymentStatus;
  verifiedByAdminId?: string;
  verifiedAt?: string;
  createdAt: string;
}

export type PayoutStatus = 'scheduled' | 'pending_approval' | 'approved' | 'paid' | 'cancelled';

export interface PayoutRecord {
  id: string;
  schemeId: string;
  schemeName?: string;
  membershipId: string;
  userId: string;
  userFullName?: string;
  monthIndex: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: PayoutStatus;
  scheduledDate: string;
  paidAt?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  adminNotes?: string;
  createdAt?: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeName?: string;
  refereeEmail?: string;
  referralCode: string;
  status: 'registered' | 'pending_approval' | 'qualified' | 'rewarded' | 'rejected';
  rewardAmount?: number;
  qualifiedAt?: string;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type: 'dues' | 'payment' | 'membership' | 'payout' | 'system';
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetEntity: string;
  entityId?: string;
  details: string;
  timestamp: string;
}

export interface OrganizationSettings {
  id: string;
  organizationName: string;
  currency: string;
  currencySymbol: string;
  disclaimerNotice: string;
  supportPhone: string;
  supportEmail: string;
  updatedAt?: string;
}
