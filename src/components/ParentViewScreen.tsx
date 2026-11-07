import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  BookOpen, 
  Award, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  CheckCircle, 
  PhoneCall, 
  Share2, 
  Receipt,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Student, FeeRecord } from '../types';
import { ReceiptModal } from './ReceiptModal';

interface ParentViewScreenProps {
  onOpenReferralModal: (referrerName?: string) => void;
}

export const ParentViewScreen: React.FC<ParentViewScreenProps> = ({ onOpenReferralModal }) => {
  const { 
    students, 
    fees, 
    settings, 
    getStudentAttendancePercent, 
    getStudentRecentTests, 
    markFeePaid 
  } = useData();
  const { userProfile, isViewer } = useAuth();

  // If viewer, find their child; if staff, allow switching student preview
  const defaultStudentId = userProfile?.studentId || 'std-1';
  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudentId);

  // Active student
  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Active student's latest fee
  const studentFee = useMemo(() => {
    return fees.find((f) => f.studentId === activeStudent?.id && f.status !== 'paid') ||
      fees.filter((f) => f.studentId === activeStudent?.id)[0];
  }, [fees, activeStudent]);

  // Attendance %
  const attendancePct = activeStudent ? getStudentAttendancePercent(activeStudent.id) : 90;

  // Recent tests
  const recentTests = activeStudent ? getStudentRecentTests(activeStudent.id) : [];
  const latestTest = recentTests[recentTests.length - 1];

  // UPI payment modal state
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [generatedReceiptFee, setGeneratedReceiptFee] = useState<FeeRecord | null>(null);

  const ownerUpi = settings.ownerUpiId || 'pandeyakash09307@okhdfcbank';
  const feeAmount = studentFee?.amount || activeStudent?.monthlyFee || 1800;
  const coachingTitle = settings.coachingName || 'Parag Coaching';

  // Standard Indian UPI Deep Link
  const upiUrl = `upi://pay?pa=${encodeURIComponent(ownerUpi)}&pn=${encodeURIComponent(coachingTitle)}&am=${encodeURIComponent(feeAmount)}&cu=INR&tn=${encodeURIComponent(`Tuition Fee ${activeStudent?.name || ''}`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(ownerUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Simulate Payment Confirmation & auto-generate receipt
  const handleSimulatePayment = async () => {
    if (!studentFee) return;
    setIsProcessingPayment(true);
    try {
      // Fire celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const updated = await markFeePaid(studentFee.id, 'UPI');
      setShowUpiModal(false);
      setGeneratedReceiptFee(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Student Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
              Parent Portal (Student Dashboard)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Transparent academic progress, verified attendance, fee status, and instant UPI payments.
          </p>
        </div>

        {/* Staff Student Switcher (If not restricted viewer, staff can preview any student's portal) */}
        {!isViewer && (
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-xs">
            <span className="text-slate-400 font-semibold pl-1">Preview Child:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-800 text-white font-semibold rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.class})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Student Profile Overview Card */}
      {activeStudent && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={activeStudent.photo}
                alt={activeStudent.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-lg"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Outfit']">
                    {activeStudent.name}
                  </h3>
                  {activeStudent.rollNo && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {activeStudent.rollNo}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                  {activeStudent.class} • {activeStudent.batch}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Parent: <strong className="text-slate-200">{activeStudent.parentName}</strong> (+91 {activeStudent.whatsappNumber})
                </p>
                <p className="text-xs text-amber-300 font-medium mt-0.5">
                  Academic Mentor: {settings.ownerName} ({settings.coachingName})
                </p>
              </div>
            </div>

            {/* Refer a Friend Button for parents */}
            <button
              onClick={() => onOpenReferralModal(activeStudent.name)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>Refer a Friend & Get Fee Discount</span>
            </button>
          </div>
        </div>
      )}

      {/* 3 Core Metric Cards: Attendance %, Homework, Fee Due Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Attendance % */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
              <CalendarCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {attendancePct}%
              </span>
              <span className={`text-xs font-bold ${attendancePct >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {attendancePct >= 85 ? '● Consistent & Regular' : '● Needs Improvement'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                style={{ width: `${attendancePct}%` }}
                className={`h-full rounded-full transition-all duration-700 ${
                  attendancePct >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
            Attendance tracked daily by Parag Coaching staff.
          </p>
        </div>

        {/* Metric 2: Homework & Class Notes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Homework & Notes</span>
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-200 bg-slate-800/80 p-3 rounded-xl border border-slate-700 line-clamp-3">
                {activeStudent?.homeworkNotes || 'Complete chapter questions and revise formulas for upcoming weekly test.'}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>Assigned by: Akash Pandey Sir</span>
            <span className="text-emerald-400 font-semibold">Active Task</span>
          </p>
        </div>

        {/* Metric 3: Fee Due Status + Pay by UPI Button */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tuition Fee Status</span>
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>

            <div className="mt-3">
              {studentFee?.status === 'paid' ? (
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    Paid (Cleared)
                  </span>
                  <p className="text-xs text-slate-300 mt-1">
                    Month: <strong>{studentFee.month}</strong> (Receipt: {studentFee.receiptNumber})
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">
                      ₹{feeAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      {studentFee?.status === 'late' ? `${studentFee.daysLate} Days Late` : 'Due Soon'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Month: <strong>{studentFee?.month || 'November 2026'}</strong> • Due: {studentFee?.dueDate || '2026-11-05'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            {studentFee?.status === 'paid' ? (
              <button
                onClick={() => setGeneratedReceiptFee(studentFee)}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>View & Print Official Receipt</span>
              </button>
            ) : (
              // Button: "Pay by UPI" (Prompt requirement)
              <button
                onClick={() => setShowUpiModal(true)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-700/30 transition transform active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Pay by UPI (₹{feeAmount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Latest Test Result Highlight */}
      {latestTest && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-white text-sm sm:text-base">
                Latest Test Performance: {latestTest.testTitle}
              </h4>
            </div>
            <span className="text-xs text-slate-400">{latestTest.date}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Score</p>
              <p className="text-lg font-black text-white mt-0.5">
                {latestTest.marks} <span className="text-xs font-normal text-slate-400">/ {latestTest.maxMarks}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Percentage</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5">
                {Math.round((latestTest.marks / latestTest.maxMarks) * 100)}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Batch Rank</p>
              <p className="text-lg font-black text-amber-400 mt-0.5">
                #{latestTest.rank || 1}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Subject</p>
              <p className="text-sm font-bold text-slate-200 mt-1">
                {latestTest.subject}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pay By UPI Interactive Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Pay via UPI Instant</h3>
              </div>
              <button
                onClick={() => setShowUpiModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-center">
              {/* Payment Info */}
              <p className="text-xs text-slate-400">Paying for: <strong>{activeStudent?.name}</strong></p>
              <p className="text-3xl font-black text-white mt-1">
                ₹{feeAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Payee: {settings.ownerName} ({settings.coachingName})
              </p>

              {/* Dynamic QR Code Card */}
              <div className="my-4 p-4 bg-white rounded-2xl inline-block shadow-xl border-4 border-emerald-500/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                  alt="UPI QR Code"
                  className="w-44 h-44 mx-auto rounded-lg"
                />
                <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-wider">
                  Scan with GPay • PhonePe • Paytm • BHIM
                </p>
              </div>

              {/* UPI ID Copy Field */}
              <div className="flex items-center justify-between p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-xs text-left mb-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Owner UPI ID</p>
                  <p className="font-mono font-bold text-emerald-300">{ownerUpi}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition text-[11px]"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct UPI Mobile Link (opens native UPI app on Android / iOS) */}
              <a
                href={upiUrl}
                className="w-full mb-2 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-emerald-700/20 hover:opacity-95 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
              </a>

              {/* Simulation confirmation button (auto-generates official receipt as requested) */}
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessingPayment}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition"
              >
                {isProcessingPayment ? 'Verifying payment...' : '✓ Simulated / Done Payment (Generate Receipt)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal triggered after payment */}
      {generatedReceiptFee && (
        <ReceiptModal
          fee={generatedReceiptFee}
          student={activeStudent}
          onClose={() => setGeneratedReceiptFee(null)}
        />
      )}
    </div>
  );
};
