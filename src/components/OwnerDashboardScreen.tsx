import React, { useState } from 'react';
import { 
  DollarSign, 
  Users, 
  Layers, 
  CalendarCheck, 
  TrendingUp, 
  UserPlus, 
  Bell, 
  PhoneCall, 
  Share2, 
  Check, 
  X, 
  Plus, 
  Settings as SettingsIcon, 
  Camera, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Trash2,
  Edit,
  GraduationCap
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Student, Batch, Enquiry } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface OwnerDashboardScreenProps {
  onOpenAddStudent: () => void;
  onOpenManageUsers: () => void;
  onOpenReferralModal: () => void;
  onSelectTab: (tab: any) => void;
}

export const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({
  onOpenAddStudent,
  onOpenManageUsers,
  onOpenReferralModal,
  onSelectTab,
}) => {
  const { 
    students, 
    batches, 
    fees, 
    enquiries, 
    settings, 
    totalFeesCollected, 
    totalFeesPending, 
    totalFeesLate, 
    todayAttendancePercent,
    updateEnquiryStatus,
    deleteStudent
  } = useData();
  const { isOwner, isClient, isViewer } = useAuth();

  const [activeEnquiryFilter, setActiveEnquiryFilter] = useState<'all' | 'new' | 'contacted' | 'enrolled'>('all');
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<Student | null>(null);

  // Fee calculation metrics
  const totalFeesExpected = totalFeesCollected + totalFeesPending + totalFeesLate;
  const collectedPct = totalFeesExpected > 0 ? Math.round((totalFeesCollected / totalFeesExpected) * 100) : 0;
  const pendingPct = totalFeesExpected > 0 ? Math.round(((totalFeesPending + totalFeesLate) / totalFeesExpected) * 100) : 0;

  // Filtered enquiries
  const filteredEnquiries = enquiries.filter(
    (e) => activeEnquiryFilter === 'all' || e.status === activeEnquiryFilter
  );

  // Recent payment alerts
  const paidFees = fees.filter((f) => f.status === 'paid').slice(-4);

  const handleEnquiryCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEnquiryWhatsApp = (enquiry: Enquiry) => {
    const text = `Namaste ${enquiry.name} ji,\nThank you for your interest in Parag Coaching (referred by ${enquiry.referredBy || 'our student'}). When would be a good time to visit our center for a free trial class? - Akash Pandey, Parag Coaching`;
    const url = buildWhatsAppUrl(enquiry.phone, text);
    window.open(url, '_blank');
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudentForDelete) return;
    await deleteStudent(selectedStudentForDelete.id);
    setSelectedStudentForDelete(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome & Role Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
              {isOwner ? 'Owner Command Center' : isClient ? 'Faculty Dashboard' : 'Academic Overview'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Director: <strong className="text-slate-200">{settings.ownerName}</strong> • Institute: <strong className="text-slate-200">{settings.coachingName}</strong>
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <button
              onClick={onOpenManageUsers}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Manage Sirs & Roles</span>
            </button>
          )}

          {!isViewer && (
            <button
              onClick={onOpenAddStudent}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Fees Collected */}
        <div 
          onClick={() => onSelectTab('fees')}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-lg cursor-pointer hover:border-emerald-500/60 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fees Collected</span>
            <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            ₹{totalFeesCollected.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 flex items-center space-x-1 text-[11px] text-emerald-400 font-semibold">
            <span>{collectedPct}% Collected of cycle</span>
          </div>
        </div>

        {/* Card 2: Total Fees Pending / Late */}
        <div 
          onClick={() => onSelectTab('fees')}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/30 shadow-lg cursor-pointer hover:border-rose-500/60 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fees Due & Late</span>
            <AlertCircle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400">
            ₹{(totalFeesPending + totalFeesLate).toLocaleString('en-IN')}
          </p>
          <div className="mt-2 flex items-center space-x-1 text-[11px] text-rose-300 font-semibold">
            <span>{fees.filter(f => f.status === 'late').length} Students late</span>
          </div>
        </div>

        {/* Card 3: Total Students */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {students.length}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            Across {batches.length} coaching batches
          </p>
        </div>

        {/* Card 4: Today's Attendance % */}
        <div 
          onClick={() => onSelectTab('attendance')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Attendance</span>
            <CalendarCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {todayAttendancePercent}%
          </p>
          <p className="mt-2 text-[11px] text-emerald-400 font-semibold">
            High attendance rate
          </p>
        </div>
      </div>

      {/* Interactive Fees Collected vs Pending Chart (Prompt requirement) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-base font-['Outfit']">
              Fee Collection Breakdown: Collected vs Pending
            </h3>
            <p className="text-xs text-slate-400">
              Total cycle tuition fee expectation: ₹{totalFeesExpected.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              Collected (₹{totalFeesCollected.toLocaleString('en-IN')})
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              Pending / Late (₹{(totalFeesPending + totalFeesLate).toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        {/* Dual Bar Progress Meter */}
        <div className="mt-5">
          <div className="w-full bg-slate-800 h-6 rounded-2xl overflow-hidden flex shadow-inner p-1 gap-1">
            <div
              style={{ width: `${Math.max(5, collectedPct)}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-xl transition-all duration-700 flex items-center justify-center text-[10px] font-black text-slate-950 px-2"
            >
              {collectedPct}% Paid
            </div>
            <div
              style={{ width: `${Math.max(5, pendingPct)}%` }}
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-xl transition-all duration-700 flex items-center justify-center text-[10px] font-black text-white px-2"
            >
              {pendingPct}% Due
            </div>
          </div>
        </div>

        {/* Quick Batch Breakdown chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          {batches.map((b) => {
            const count = students.filter((s) => s.batch === b.batchName).length;
            return (
              <div key={b.id} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white truncate max-w-[150px]">{b.batchName}</p>
                  <p className="text-[10px] text-slate-400">{b.timing}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                  {count} Students
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Payment Alerts + New Referral Enquiries (Prompt requirement) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Recent Payment Alerts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Payment Alerts & Activities</h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Live Feed
              </span>
            </div>

            <div className="space-y-2.5">
              {paidFees.map((fee) => (
                <div
                  key={fee.id}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      ₹
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{fee.studentName}</p>
                      <p className="text-[10px] text-slate-400">
                        {fee.month} tuition cleared via {fee.paymentMode || 'UPI'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">+₹{fee.amount}</p>
                    <span className="text-[9px] text-slate-500">{fee.paidAt || 'Today'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              onClick={() => onSelectTab('fees')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
            >
              View Full Fee Ledger →
            </button>
          </div>
        </div>

        {/* Section 2: Refer a Friend Enquiries (Prompt requirement) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Referral & Admission Leads</h3>
              </div>
              <button
                onClick={onOpenReferralModal}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition shadow"
              >
                + New Lead
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1 mb-3">
              {(['all', 'new', 'contacted', 'enrolled'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveEnquiryFilter(filter)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition ${
                    activeEnquiryFilter === filter
                      ? 'bg-indigo-500 text-white'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{enq.name}</p>
                      <p className="text-[10px] text-amber-400 font-semibold">
                        Referred by: {enq.referredBy || 'Direct'}
                      </p>
                    </div>

                    {/* Status badge & cycle toggle (Staff only) */}
                    {!isViewer && (
                      <select
                        value={enq.status}
                        onChange={(e) => updateEnquiryStatus(enq.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border focus:outline-none ${
                          enq.status === 'enrolled'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : enq.status === 'contacted'
                            ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                            : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <option value="new">New Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="enrolled">Enrolled ✓</option>
                      </select>
                    )}
                  </div>

                  {enq.notes && (
                    <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-1.5 rounded-lg">
                      "{enq.notes}"
                    </p>
                  )}

                  {/* Actions for lead */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>Date: {enq.date}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleEnquiryCall(enq.phone)}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3 text-emerald-400" />
                        <span>Call</span>
                      </button>
                      <button
                        onClick={() => handleEnquiryWhatsApp(enq)}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 text-center text-[11px] text-slate-400">
            Enquiries can also be submitted directly by parents via the Parent Portal.
          </div>
        </div>
      </div>

      {/* Enrolled Students Directory (with photos, classes, batch info) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-base font-['Outfit']">
              Enrolled Students Directory ({students.length})
            </h3>
            <p className="text-xs text-slate-400">
              Every student has a verified photo, class grade, batch schedule, and parent WhatsApp contact.
            </p>
          </div>

          {!isViewer && (
            <button
              onClick={onOpenAddStudent}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition flex items-start space-x-3.5 group"
            >
              <img
                src={student.photo}
                alt={student.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-slate-600 shrink-0 shadow-md group-hover:scale-105 transition"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm truncate">{student.name}</h4>
                  {student.rollNo && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1 rounded">
                      {student.rollNo}
                    </span>
                  )}
                </div>

                <p className="text-xs text-indigo-300 font-semibold truncate mt-0.5">
                  {student.class} • {student.batch}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  Parent: {student.parentName}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  +91 {student.whatsappNumber}
                </p>

                {/* Owner Delete Option (Prompt requirement: Owner can delete students) */}
                {isOwner && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex justify-end">
                    <button
                      onClick={() => setSelectedStudentForDelete(student)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal (Owner Only) */}
      {selectedStudentForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base">Confirm Student Removal</h3>
            <p className="text-xs text-slate-300 mt-2">
              Are you sure you want to delete <strong>{selectedStudentForDelete.name}</strong> ({selectedStudentForDelete.rollNo}) from Parag Coaching? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedStudentForDelete(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
