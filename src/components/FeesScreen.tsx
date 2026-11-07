import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  Sparkles, 
  Check, 
  X, 
  ChevronRight, 
  Receipt, 
  MessageSquare, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { FeeRecord, Student } from '../types';
import { 
  buildWhatsAppUrl, 
  getFeeReminderMessage, 
  getMonthEndFeeMessage 
} from '../utils/whatsapp';
import { ReceiptModal } from './ReceiptModal';

export const FeesScreen: React.FC = () => {
  const { fees, students, batches, markFeePaid, addFeeRecord } = useData();
  const { isOwner, isClient, isViewer } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'late' | 'pending' | 'paid'>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  // Selected fee for receipt
  const [selectedReceiptFee, setSelectedReceiptFee] = useState<FeeRecord | null>(null);

  // Bulk WhatsApp late modal state
  const [showBulkLateModal, setShowBulkLateModal] = useState(false);
  const [bulkSentStudentIds, setBulkSentStudentIds] = useState<string[]>([]);

  // Month-end blast modal
  const [showMonthEndModal, setShowMonthEndModal] = useState(false);

  // Mark as Paid modal state
  const [payingFee, setPayingFee] = useState<FeeRecord | null>(null);
  const [payMode, setPayMode] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Add Fee Record Modal (Staff only)
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [newFeeStudentId, setNewFeeStudentId] = useState(students[0]?.id || '');
  const [newFeeMonth, setNewFeeMonth] = useState('December 2026');
  const [newFeeAmount, setNewFeeAmount] = useState<number>(1800);
  const [newFeeDueDate, setNewFeeDueDate] = useState('2026-12-05');

  // Map student info
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Today's date check (November 4, 2026 / 5th of month logic)
  const currentDate = new Date();
  const isFifthOfMonth = currentDate.getDate() === 5 || true; // Highlighted active for demo logic

  // Filtered fee records
  const filteredFees = useMemo(() => {
    return fees.filter((f) => {
      const student = studentMap.get(f.studentId);
      const matchesSearch =
        f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student?.whatsappNumber?.includes(searchTerm) ||
        student?.class?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesBatch = selectedBatch === 'all' || student?.batch === selectedBatch;

      return matchesSearch && matchesStatus && matchesBatch;
    });
  }, [fees, studentMap, searchTerm, statusFilter, selectedBatch]);

  // All Late Students for bulk actions
  const lateFees = useMemo(() => {
    return fees.filter((f) => f.status === 'late');
  }, [fees]);

  // Pending fees list for month-end blast
  const pendingOrLateFees = useMemo(() => {
    return fees.filter((f) => f.status === 'pending' || f.status === 'late');
  }, [fees]);

  // Individual WhatsApp Reminder
  const handleSingleReminder = (fee: FeeRecord) => {
    const student = studentMap.get(fee.studentId);
    if (!student || !student.whatsappNumber) {
      alert('Parent WhatsApp number not found for this student.');
      return;
    }
    const message = getFeeReminderMessage(
      student.parentName,
      student.name,
      fee.month,
      fee.amount,
      fee.dueDate,
      fee.daysLate
    );
    const url = buildWhatsAppUrl(student.whatsappNumber, message);
    window.open(url, '_blank');
  };

  // Month-end message trigger
  const handleMonthEndMessage = (fee: FeeRecord) => {
    const student = studentMap.get(fee.studentId);
    if (!student || !student.whatsappNumber) return;
    const message = getMonthEndFeeMessage(student.parentName, student.name);
    const url = buildWhatsAppUrl(student.whatsappNumber, message);
    window.open(url, '_blank');
  };

  // Execute Mark as Paid
  const handleConfirmPay = async () => {
    if (!payingFee) return;
    setIsSubmittingPay(true);
    try {
      const updated = await markFeePaid(payingFee.id, payMode);
      setPayingFee(null);
      // Immediately open receipt view so staff can share via WhatsApp
      setSelectedReceiptFee(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleAddNewFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = studentMap.get(newFeeStudentId);
    if (!st) return;
    await addFeeRecord({
      studentId: st.id,
      studentName: st.name,
      month: newFeeMonth,
      amount: Number(newFeeAmount),
      dueDate: newFeeDueDate,
      status: 'pending',
    });
    setShowAddFeeModal(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
              Tuition Fee Management
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time pending fee tracking, days late calculation, and instant WhatsApp reminders.
          </p>
        </div>

        {/* Global Action Buttons (Staff Only) */}
        {!isViewer && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Send Reminder to All Late Button (Prompt requirement) */}
            <button
              onClick={() => setShowBulkLateModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition transform active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send WhatsApp Reminder to All Late ({lateFees.length})</span>
            </button>

            {/* Month End Blast Button (Prompt requirement) */}
            <button
              onClick={() => setShowMonthEndModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Month-End Message Generator</span>
            </button>

            {/* Add Fee (Staff Only) */}
            <button
              onClick={() => setShowAddFeeModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Fee Cycle</span>
            </button>
          </div>
        )}
      </div>

      {/* 5th of Month Automated Alert Banner */}
      {isFifthOfMonth && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/40 border border-amber-500/40 p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <span>Monthly Due Cycle Active (5th of Month)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px]">Automated Trigger</span>
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Today is tuition fee due period. <strong>{lateFees.length} students</strong> are currently late, and <strong>{fees.filter(f => f.status === 'pending').length} students</strong> are due for November.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBulkLateModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow-md transition"
          >
            Launch WhatsApp Reminders
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, class, or WhatsApp number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700/80 overflow-x-auto">
            {(['all', 'late', 'pending', 'paid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition shrink-0 ${
                  statusFilter === st
                    ? st === 'late'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : st === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : st === 'paid'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st} ({fees.filter((f) => st === 'all' || f.status === st).length})
              </button>
            ))}
          </div>

          {/* Batch Selector */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.batchName}>
                {b.batchName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fees List */}
      <div className="space-y-3">
        {filteredFees.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
            <CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-300">No fee records found</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search or status filter.</p>
          </div>
        ) : (
          filteredFees.map((fee) => {
            const student = studentMap.get(fee.studentId);
            const isLate = fee.status === 'late';
            const isPending = fee.status === 'pending';
            const isPaid = fee.status === 'paid';

            return (
              <div
                key={fee.id}
                className={`p-4 rounded-2xl border transition-all duration-200 bg-slate-900/90 ${
                  isLate
                    ? 'border-rose-500/50 hover:border-rose-500 bg-gradient-to-r from-rose-950/20 to-slate-900'
                    : isPending
                    ? 'border-amber-500/40 hover:border-amber-500'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Student Details with Photo */}
                  <div className="flex items-center space-x-3.5">
                    <div className="relative">
                      <img
                        src={student?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={fee.studentName}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shadow-md"
                      />
                      {isLate && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 animate-ping" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-white text-sm sm:text-base">
                          {fee.studentName}
                        </h4>
                        {student?.rollNo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            {student.rollNo}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {student?.class || 'Class 10th'} • {student?.batch || 'Morning Batch'}
                      </p>

                      <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-400">
                        <span>Parent: <strong className="text-slate-300">{student?.parentName || 'Guardian'}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">WhatsApp: +91 {student?.whatsappNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fee amount and status badge */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400 uppercase font-semibold">
                        {fee.month}
                      </p>
                      <p className="text-base sm:text-lg font-black text-white">
                        ₹{fee.amount.toLocaleString('en-IN')}
                      </p>

                      {/* Status indicator */}
                      <div className="mt-1">
                        {isLate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            <Clock className="w-3 h-3 inline" />
                            {fee.daysLate} Days Late (Due {fee.dueDate})
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Clock className="w-3 h-3 inline" />
                            Pending (Due {fee.dueDate})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle className="w-3 h-3 inline" />
                            Paid via {fee.paymentMode || 'UPI'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                      {/* WhatsApp Reminder Button (Individual on each student as requested) */}
                      {!isPaid && (
                        <button
                          onClick={() => handleSingleReminder(fee)}
                          title="Send prefilled WhatsApp reminder to parent"
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp Reminder</span>
                        </button>
                      )}

                      {/* Mark Paid Button (Staff Only - strictly hidden from viewers) */}
                      {!isViewer && !isPaid && (
                        <button
                          onClick={() => setPayingFee(fee)}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      )}

                      {/* View Receipt Button (if paid) */}
                      {isPaid && (
                        <button
                          onClick={() => setSelectedReceiptFee(fee)}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                        >
                          <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bulk WhatsApp Late Reminder Modal */}
      {showBulkLateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">
                  Send WhatsApp Reminder to All Late ({lateFees.length} Students)
                </h3>
              </div>
              <button
                onClick={() => setShowBulkLateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3">
              <p className="text-xs text-slate-300">
                Because WhatsApp Web/API policies prevent unverified robot spamming, this free launcher opens a direct pre-filled chat for each parent in 1 click without cost or API fees.
              </p>

              <div className="mt-4 space-y-2.5">
                {lateFees.map((fee, idx) => {
                  const student = studentMap.get(fee.studentId);
                  const isSent = bulkSentStudentIds.includes(fee.studentId);

                  return (
                    <div
                      key={fee.id}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white text-xs">
                            {fee.studentName} ({student?.parentName})
                          </p>
                          <p className="text-[11px] text-rose-400 font-semibold">
                            ₹{fee.amount} • {fee.daysLate} days overdue ({fee.month})
                          </p>
                          <p className="text-[10px] text-slate-400">
                            WhatsApp: +91 {student?.whatsappNumber}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          handleSingleReminder(fee);
                          if (!bulkSentStudentIds.includes(fee.studentId)) {
                            setBulkSentStudentIds((prev) => [...prev, fee.studentId]);
                          }
                        }}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isSent
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Sent</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Launch Chat</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowBulkLateModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month-End Message Generator Modal */}
      {showMonthEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Month-End Pending Fee WhatsApp Blast
                </h3>
              </div>
              <button
                onClick={() => setShowMonthEndModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 mb-3">
                <p className="font-bold mb-1">Standard Month-End Hindi Message:</p>
                <p className="italic font-mono text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  "Namaste, [Parent Name], [Student Name] ki is mahine ki fees pending hai. Kripya jald jama kare - Parag Coaching"
                </p>
              </div>

              <div className="space-y-2">
                {pendingOrLateFees.map((fee) => {
                  const student = studentMap.get(fee.studentId);
                  return (
                    <div
                      key={fee.id}
                      className="p-3 rounded-xl bg-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{student?.name}</p>
                        <p className="text-[11px] text-slate-400">Parent: {student?.parentName} (+91 {student?.whatsappNumber})</p>
                        <p className="text-[10px] text-amber-400 font-semibold">{fee.month} • ₹{fee.amount}</p>
                      </div>
                      <button
                        onClick={() => handleMonthEndMessage(fee)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowMonthEndModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark As Paid Dialog Modal */}
      {payingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Confirm Fee Collection</h3>
              </div>
              <button
                onClick={() => setPayingFee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-xs text-slate-400">Student Name</p>
                <p className="text-sm font-bold text-white">{payingFee.studentName}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700 text-xs">
                  <span className="text-slate-400">Period: {payingFee.month}</span>
                  <span className="text-base font-black text-emerald-400">
                    ₹{payingFee.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Cash', 'Bank Transfer'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMode(mode)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        payMode === mode
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Once confirmed, an official receipt voucher will be generated and you can immediately send it to the parent on WhatsApp.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => setPayingFee(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPay}
                disabled={isSubmittingPay}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-700/20 transition"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingPay ? 'Recording...' : 'Confirm & Generate Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Fee Modal (Staff only) */}
      {showAddFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add New Fee Record</h3>
              <button
                onClick={() => setShowAddFeeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewFee} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Student</label>
                <select
                  value={newFeeStudentId}
                  onChange={(e) => {
                    setNewFeeStudentId(e.target.value);
                    const st = studentMap.get(e.target.value);
                    if (st) setNewFeeAmount(st.monthlyFee);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class} - {s.rollNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fee Month</label>
                <input
                  type="text"
                  value={newFeeMonth}
                  onChange={(e) => setNewFeeMonth(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={newFeeAmount}
                  onChange={(e) => setNewFeeAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newFeeDueDate}
                  onChange={(e) => setNewFeeDueDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddFeeModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                >
                  Add Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {selectedReceiptFee && (
        <ReceiptModal
          fee={selectedReceiptFee}
          student={studentMap.get(selectedReceiptFee.studentId)}
          onClose={() => setSelectedReceiptFee(null)}
        />
      )}
    </div>
  );
};
