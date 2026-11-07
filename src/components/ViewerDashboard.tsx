import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CalendarCheck, 
  Award, 
  CreditCard, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  QrCode, 
  Sparkles,
  BookOpen,
  PhoneCall,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Student, FeeRecord, TestRecord, AttendanceRecord } from '../types';
import { ReceiptModal } from './ReceiptModal';

export const ViewerDashboard: React.FC = () => {
  const { students, fees, tests, attendance, settings } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptFee, setSelectedReceiptFee] = useState<FeeRecord | null>(null);
  const [showUpiModal, setShowUpiModal] = useState(false);

  // Search logic
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    return students.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [students, searchQuery]);

  // Selected student (if search is empty, default to first student; if search has result, take filtered[0]; if no result, null)
  const activeStudent: Student | null = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredStudents.length > 0 ? filteredStudents[0] : null;
    }
    return students[0] || null;
  }, [searchQuery, filteredStudents, students]);

  // Student's Tests (Last 4 weeks)
  const studentTests = useMemo(() => {
    if (!activeStudent) return [];
    return tests
      .filter((t) => t.studentId === activeStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [activeStudent, tests]);

  // Calculate grade helper
  const getGrade = (marks: number, maxMarks: number) => {
    const pct = (marks / maxMarks) * 100;
    if (pct >= 90) return { grade: 'A+', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (pct >= 80) return { grade: 'A', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    if (pct >= 70) return { grade: 'B', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    if (pct >= 60) return { grade: 'C', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { grade: 'D', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  // Student's 30-Day Attendance Detail
  const attendance30Days = useMemo(() => {
    if (!activeStudent) return { presentCount: 0, absentCount: 0, totalDays: 30, pct: 0, history: [] };

    // Generate past 30 days dates
    const history: { date: string; status: 'P' | 'A'; dayName: string }[] = [];
    const baseDate = new Date('2026-11-04');

    // Existing recorded attendance
    const studentRecords = attendance.filter((a) => a.studentId === activeStudent.id);
    const recordedMap = new Map<string, 'P' | 'A'>();
    studentRecords.forEach((r) => recordedMap.set(r.date, r.status));

    // Generate 30 days list
    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 is Sunday

      // If Sunday, coaching is off
      if (dayOfWeek === 0) continue;

      let status: 'P' | 'A' = recordedMap.get(dateStr) || 'P';
      // Deterministic realistic absent days for sample students
      if (i === 3 || i === 12 || i === 22) {
        status = activeStudent.id === 'std-3' || activeStudent.id === 'std-7' ? 'A' : 'P';
      }
      if (i === 1) {
        status = recordedMap.get(dateStr) || (activeStudent.id === 'std-3' ? 'A' : 'P');
      }

      history.push({
        date: dateStr,
        status,
        dayName: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      });
    }

    const totalDays = history.length;
    const presentCount = history.filter((h) => h.status === 'P').length;
    const absentCount = totalDays - presentCount;
    const pct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

    return { presentCount, absentCount, totalDays, pct, history };
  }, [activeStudent, attendance]);

  // Student Fee Records
  const studentFees = useMemo(() => {
    if (!activeStudent) return [];
    return fees.filter((f) => f.studentId === activeStudent.id);
  }, [activeStudent, fees]);

  const latestPendingFee = studentFees.find((f) => f.status !== 'paid') || studentFees[0];

  const upiPayUrl = latestPendingFee
    ? `upi://pay?pa=${encodeURIComponent(settings.ownerUpiId || 'pandeyakash09307@okhdfcbank')}&pn=${encodeURIComponent(settings.coachingName || 'Parag Coaching')}&am=${encodeURIComponent(latestPendingFee.amount)}&cu=INR&tn=${encodeURIComponent(`Tuition Fee ${activeStudent?.name || ''}`)}`
    : '';

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* 4.a) TOP SEARCH BAR: "Apne Bacche ka Naam Search Karo..." */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Search className="w-4 h-4 text-amber-400" />
          <span>Parent Search Portal:</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Apne Bacche ka Naam Search Karo... (e.g. Aarav, Ananya, Rohan)"
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm sm:text-base text-white placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
          />
          <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 px-2 py-0.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick chip selector for fast parent demo */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-semibold shrink-0">Quick Select:</span>
          {students.slice(0, 6).map((st) => (
            <button
              key={st.id}
              onClick={() => setSearchQuery(st.name)}
              className={`px-2.5 py-1 rounded-xl shrink-0 font-medium transition ${
                activeStudent?.id === st.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>
      </div>

      {/* If Student Not Found */}
      {!activeStudent ? (
        <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Student Not Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            "{searchQuery}" naam se koi student record nahi mila. Kripya naam ki spelling check karein ya apne coaching director (Akash Pandey Sir) se sampark karein.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition"
          >
            Show All Students
          </button>
        </div>
      ) : (
        <>
          {/* 4.b) STUDENT CARD: Photo, Naam, Class, Batch, Father Name */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
              <div className="relative">
                <img
                  src={activeStudent.photo}
                  alt={activeStudent.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-400/80 shadow-2xl"
                />
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                  Active
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                      {activeStudent.name}
                    </h2>
                    {activeStudent.rollNo && (
                      <span className="text-xs font-mono font-bold text-amber-400">
                        Roll No: {activeStudent.rollNo}
                      </span>
                    )}
                  </div>

                  <span className="self-center sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Parag Coaching Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Class / Grade</span>
                    <strong className="text-white text-sm">{activeStudent.class}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Batch Schedule</span>
                    <strong className="text-white text-sm">{activeStudent.batch}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Father / Parent Name</span>
                    <strong className="text-white text-sm">{activeStudent.parentName}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Academic Director</span>
                    <strong className="text-amber-300 text-sm">{settings.ownerName}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4.d) ATTENDANCE - 30 DAYS DETAIL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base font-['Outfit']">
                  Attendance Detail (Last 30 Working Days)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Verified by Akash Sir</span>
            </div>

            {/* Bada Box: "24 / 30 Din Present" */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-800 to-slate-900 p-5 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                  30 Days Attendance Record:
                </p>
                <h4 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {attendance30Days.presentCount} / {attendance30Days.totalDays} Din Present
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Total Present: <strong className="text-emerald-400">{attendance30Days.presentCount}</strong> | 
                  Total Absent: <strong className="text-rose-400">{attendance30Days.absentCount}</strong> | 
                  Percentage: <strong className="text-amber-400">{attendance30Days.pct}%</strong>
                </p>
              </div>

              {/* Attendance percentage indicator */}
              <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-emerald-500/40 flex flex-col items-center justify-center shrink-0 shadow-lg">
                <span className="text-xl font-black text-emerald-400">{attendance30Days.pct}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Rate</span>
              </div>
            </div>

            {/* Progress Bar with Percentage */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                <span>Monthly Attendance Target (85%+)</span>
                <span className="text-white font-bold">{attendance30Days.pct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  style={{ width: `${attendance30Days.pct}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-700"
                />
              </div>
            </div>

            {/* Date-wise Present / Absent list with Green / Red dot */}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Date-wise Attendance Log (Last 30 Days):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                {attendance30Days.history.map((record, idx) => {
                  const isP = record.status === 'P';
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                        isP
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                          : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <span className="text-[11px] font-medium truncate">{record.dayName}</span>
                      <span className="flex items-center gap-1 font-bold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isP ? 'bg-emerald-400 shadow shadow-emerald-400' : 'bg-rose-500 shadow shadow-rose-500'
                          }`}
                        />
                        <span className="text-[10px]">{isP ? 'P' : 'A'}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4.c) WEEKLY TEST: Table - Date | Subject | Total Marks | Obtained Marks | Grade - Last 4 weeks ke test */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base font-['Outfit']">
                  Weekly Test Reports (Last 4 Weeks)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Batch Ranking Analytics</span>
            </div>

            {studentTests.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Is student ke liye abhi koi weekly test record nahi hai.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Subject / Topic</th>
                      <th className="py-2.5 px-3 text-center">Total Marks</th>
                      <th className="py-2.5 px-3 text-center">Obtained Marks</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {studentTests.map((t) => {
                      const gradeObj = getGrade(t.marks, t.maxMarks);
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            {t.date}
                          </td>
                          <td className="py-3 px-3 text-white font-bold">
                            <div>{t.subject}</div>
                            <span className="text-[10px] text-slate-400 font-normal">{t.testTitle}</span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400">
                            {t.maxMarks}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-white text-sm">
                            {t.marks}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${gradeObj.color}`}>
                              {gradeObj.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4.e) FEES (Read Only): Fees Paid / Pending sirf dekh sakta hai */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-white text-base font-['Outfit']">
                  Tuition Fee Status (Read-Only)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Direct Official UPI Link</span>
            </div>

            <div className="space-y-3">
              {studentFees.map((fee) => {
                const isPaid = fee.status === 'paid';
                const isLate = fee.status === 'late';

                return (
                  <div
                    key={fee.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isPaid
                        ? 'bg-slate-950/60 border-slate-800'
                        : isLate
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-amber-950/20 border-amber-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{fee.month}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isLate
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isPaid ? 'PAID ✓' : isLate ? `${fee.daysLate} DAYS LATE` : 'DUE / PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Due Date: {fee.dueDate} {fee.paidAt ? `• Paid on: ${fee.paidAt}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <div className="text-right">
                        <span className="text-base font-black text-white">
                          ₹{fee.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {isPaid ? (
                        <button
                          onClick={() => setSelectedReceiptFee(fee)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowUpiModal(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-emerald-700/20 transition flex items-center space-x-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Pay by UPI</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Pay by UPI Modal for Viewer */}
      {showUpiModal && latestPendingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center">
            <h3 className="font-extrabold text-white text-lg font-['Outfit']">Pay Tuition Fee by UPI</h3>
            <p className="text-xs text-slate-300 mt-1">
              Direct payment to Director <strong className="text-amber-300">{settings.ownerName}</strong> ({settings.coachingName})
            </p>

            <div className="my-4 p-4 bg-white rounded-2xl inline-block shadow-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayUrl)}`}
                alt="UPI QR Code"
                className="w-44 h-44 mx-auto"
              />
              <p className="text-[10px] text-slate-700 font-bold mt-2 uppercase tracking-wider">
                GPay • PhonePe • Paytm • BHIM
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-left mb-4">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Official UPI ID</span>
              <strong className="text-emerald-400 font-mono text-sm">{settings.ownerUpiId}</strong>
            </div>

            <a
              href={upiPayUrl}
              className="w-full mb-3 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in UPI App (Mobile)</span>
            </a>

            <button
              onClick={() => setShowUpiModal(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedReceiptFee && (
        <ReceiptModal
          fee={selectedReceiptFee}
          student={activeStudent || undefined}
          onClose={() => setSelectedReceiptFee(null)}
        />
      )}
    </div>
  );
};
