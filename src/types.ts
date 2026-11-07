export type UserRole = 'owner' | 'client' | 'viewer';

export interface UserProfile {
  id?: string;
  email: string;
  role: UserRole;
  name?: string;
  studentId?: string; // If viewer is a parent/student
  createdAt?: string;
}

export interface Student {
  id: string;
  name: string;
  photo: string;
  class: string; // e.g. "Class 10th", "Class 12th"
  batch: string; // e.g. "Morning Board Prep"
  parentName: string;
  whatsappNumber: string; // 10 digits e.g. "9876543210"
  rollNo?: string;
  monthlyFee: number;
  homeworkNotes?: string;
  createdAt?: string;
}

export interface Batch {
  id: string;
  batchName: string;
  timing: string;
  subject?: string;
  classLevel?: string;
  studentCount?: number;
  createdAt?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  month: string; // e.g. "November 2026"
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'paid' | 'pending' | 'late';
  daysLate: number;
  paidAt?: string;
  paymentMode?: 'UPI' | 'Cash' | 'Bank Transfer';
  receiptNumber?: string;
  transactionRef?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  batchName: string;
  date: string; // YYYY-MM-DD
  status: 'P' | 'A';
  updatedAt?: string;
}

export interface TestRecord {
  id: string;
  studentId: string;
  batchName: string;
  testTitle: string;
  subject: string;
  marks: number;
  maxMarks: number;
  rank?: number;
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  referredBy?: string;
  date: string;
  status: 'new' | 'contacted' | 'enrolled';
  notes?: string;
}

export interface CoachingSettings {
  logoImageUrl?: string;
  posterImageUrl: string;
  ownerUpiId: string;
  ownerName: string;
  coachingName: string;
  phone: string;
  address?: string;
  announcementText: string;
  monthlyFeeDueDay: number; // default 5th
}

export type TabType = 'home' | 'fees' | 'attendance' | 'tests' | 'parent';
