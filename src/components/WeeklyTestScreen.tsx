import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Send, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  Calendar, 
  Sparkles, 
  Check, 
  X, 
  Trophy, 
  Medal, 
  ChevronRight,
  Share2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Student, TestRecord } from '../types';
import { buildWhatsAppUrl, getWeeklyTestReportMessage } from '../utils/whatsapp';

export const WeeklyTestScreen: React.FC = () => {
  const { batches, students, tests, saveTestResults } = useData();
  const { isViewer, isOwner, isClient } = useAuth();

  const [selectedBatchName, setSelectedBatchName] = useState<string>(
    batches[0]?.batchName || 'Morning Board Prep (Class 10th)'
  );
  
  // Test entry modal state
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('Weekly Chapter Assessment 5');
  const [newTestSubject, setNewTestSubject] = useState('Mathematics');
  const [newTestMaxMarks, setNewTestMaxMarks] = useState<number>(50);
  const [newTestDate, setNewTestDate] = useState('2026-11-04');
  const [marksInputMap, setMarksInputMap] = useState<Record<string, number>>({});
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  // Sunday Weekly Report blast state
  const [showSundayBlastModal, setShowSundayBlastModal] = useState(false);
  const [sentReportStudentIds, setSentReportStudentIds] = useState<string[]>([]);

  // Students in selected batch
  const batchStudents = useMemo(() => {
    return students.filter((s) => s.batch === selectedBatchName);
  }, [students, selectedBatchName]);

  // Tests conducted for this batch
  const batchTests = useMemo(() => {
    return tests.filter((t) => t.batchName === selectedBatchName);
  }, [tests, selectedBatchName]);

  // Group latest test by student for this batch
  const latestBatchTest = useMemo(() => {
    if (!batchTests.length) return null;
    const sorted = [...batchTests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0];
  }, [batchTests]);

  // Get student's historical last 6 tests
  const getStudentTests = (studentId: string): TestRecord[] => {
    return tests
      .filter((t) => t.studentId === studentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-6);
  };

  // Open New Test Form
  const handleOpenNewTestModal = () => {
    const defaultMarks: Record<string, number> = {};
    batchStudents.forEach((st) => {
      defaultMarks[st.id] = 40; // Default decent test mark
    });
    setMarksInputMap(defaultMarks);
    setShowNewTestModal(true);
  };

  const handleSaveNewTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    setIsSubmittingTest(true);
    try {
      const scores = batchStudents.map((st) => ({
        studentId: st.id,
        marks: Number(marksInputMap[st.id] || 0),
      }));

      await saveTestResults({
        batchName: selectedBatchName,
        testTitle: newTestTitle,
        subject: newTestSubject,
        maxMarks: Number(newTestMaxMarks),
        date: newTestDate,
        scores,
      });

      setShowNewTestModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const handleShareWhatsAppReport = (student: Student, test: TestRecord) => {
    if (!student.whatsappNumber) return;
    const msg = getWeeklyTestReportMessage(
      student.name,
      student.batch,
      test.testTitle,
      test.subject,
      test.marks,
      test.maxMarks,
      test.rank || 1
    );
    const url = buildWhatsAppUrl(student.whatsappNumber, msg);
    window.open(url, '_blank');
    if (!sentReportStudentIds.includes(student.id)) {
      setSentReportStudentIds((prev) => [...prev, student.id]);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
              Weekly Test Analytics & Reports
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Test marks entry, automatic batch ranking, 6-test progress graphs & WhatsApp report cards.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sunday Weekly Report Blast Button (Staff only) */}
          {!isViewer && (
            <button
              onClick={() => setShowSundayBlastModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sunday Report Blast to All Parents</span>
            </button>
          )}

          {/* New Test Button (Staff only) */}
          {!isViewer && (
            <button
              onClick={handleOpenNewTestModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enter Batch Marks</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-300 shrink-0">Batch:</label>
          <select
            value={selectedBatchName}
            onChange={(e) => setSelectedBatchName(e.target.value)}
            className="flex-1 sm:w-80 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.batchName}>
                {b.batchName} ({b.timing})
              </option>
            ))}
          </select>
        </div>

        {latestBatchTest && (
          <div className="text-xs text-slate-400">
            Latest: <strong className="text-amber-300">{latestBatchTest.testTitle}</strong> on {latestBatchTest.date}
          </div>
        )}
      </div>

      {/* Student Test Performance Cards with Bar Charts */}
      <div className="space-y-4">
        {batchStudents.map((student) => {
          const studentTests = getStudentTests(student.id);
          const latestTest = studentTests[studentTests.length - 1];
          const latestPercentage = latestTest ? Math.round((latestTest.marks / latestTest.maxMarks) * 100) : 0;

          return (
            <div
              key={student.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg hover:border-slate-700 transition"
            >
              {/* Top Row: Student info & Latest Rank */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shadow"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-base">{student.name}</h4>
                      {student.rollNo && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          {student.rollNo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Parent: <strong className="text-slate-300">{student.parentName}</strong> (+91 {student.whatsappNumber})
                    </p>
                  </div>
                </div>

                {/* Latest Test Rank & Score */}
                {latestTest ? (
                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center space-x-1 sm:justify-end">
                        {latestTest.rank === 1 ? (
                          <span className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            <Trophy className="w-3.5 h-3.5 text-amber-400 inline" /> Rank #1 (Top)
                          </span>
                        ) : latestTest.rank === 2 ? (
                          <span className="flex items-center gap-1 text-xs font-black text-slate-300 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/30">
                            <Medal className="w-3.5 h-3.5 text-slate-300 inline" /> Rank #2
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
                            Rank #{latestTest.rank}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-white mt-0.5">
                        {latestTest.marks} / {latestTest.maxMarks}{' '}
                        <span className="text-xs text-slate-400 font-normal">({latestPercentage}%)</span>
                      </p>
                    </div>

                    {/* Share Report on WhatsApp Button (Prompt requirement) */}
                    <button
                      onClick={() => handleShareWhatsAppReport(student, latestTest)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition active:scale-95"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Share on WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">No tests taken yet</span>
                )}
              </div>

              {/* Bar Chart of Last 6 Tests (Prompt requirement) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Performance Trajectory (Last 6 Weekly Tests):</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Target: 90%+ Score</span>
                </div>

                {studentTests.length > 0 ? (
                  <div className="grid grid-cols-6 gap-2 items-end h-28 pt-4 px-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    {studentTests.map((t, idx) => {
                      const pct = Math.round((t.marks / t.maxMarks) * 100);
                      const barColor =
                        pct >= 85
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : pct >= 70
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                          : 'bg-gradient-to-t from-amber-600 to-amber-400';

                      return (
                        <div key={t.id || idx} className="flex flex-col items-center h-full justify-end group relative">
                          {/* Score Tooltip on hover */}
                          <div className="absolute -top-7 hidden group-hover:flex px-2 py-0.5 rounded bg-slate-800 text-[9px] text-white font-mono whitespace-nowrap shadow-lg border border-slate-700 z-10">
                            {t.marks}/{t.maxMarks} ({pct}%)
                          </div>

                          <span className="text-[10px] font-bold text-slate-300 mb-1 group-hover:text-white">
                            {t.marks}
                          </span>

                          {/* Responsive Bar */}
                          <div
                            style={{ height: `${pct}%` }}
                            className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${barColor}`}
                          />

                          {/* Test Date / Label */}
                          <span className="text-[9px] text-slate-500 mt-1 truncate max-w-full font-mono">
                            T{idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500">
                    No tests recorded yet for this student.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enter Test Marks Modal (Staff only) */}
      {showNewTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Record Weekly Test Marks ({selectedBatchName})
                </h3>
              </div>
              <button
                onClick={() => setShowNewTestModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTest} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Test Title / Topic
                  </label>
                  <input
                    type="text"
                    required
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    placeholder="e.g. Weekly Chapter 4 Trigonometry Test"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={newTestSubject}
                    onChange={(e) => setNewTestSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={newTestMaxMarks}
                    onChange={(e) => setNewTestMaxMarks(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Test Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newTestDate}
                    onChange={(e) => setNewTestDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Marks inputs per student */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Enter Marks for Students (Out of {newTestMaxMarks}):
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {batchStudents.map((st) => (
                    <div
                      key={st.id}
                      className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={st.photo}
                          alt={st.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <span className="text-xs font-semibold text-white">{st.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={newTestMaxMarks}
                          value={marksInputMap[st.id] ?? 0}
                          onChange={(e) =>
                            setMarksInputMap((prev) => ({
                              ...prev,
                              [st.id]: Number(e.target.value),
                            }))
                          }
                          className="w-16 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-center text-xs font-bold text-white"
                        />
                        <span className="text-xs text-slate-400">/ {newTestMaxMarks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewTestModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTest}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg"
                >
                  {isSubmittingTest ? 'Saving Marks...' : 'Publish Test & Calculate Ranks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sunday Report Blast Modal (Prompt requirement) */}
      {showSundayBlastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Sunday Weekly Report Blast
                </h3>
              </div>
              <button
                onClick={() => setShowSundayBlastModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3">
              <p className="text-xs text-slate-300">
                Every Sunday, Akash Sir can send consolidated test results and progress reports to all parents via WhatsApp with 1 tap per parent:
              </p>

              <div className="mt-4 space-y-2.5">
                {batchStudents.map((st) => {
                  const studentTests = getStudentTests(st.id);
                  const latest = studentTests[studentTests.length - 1];
                  const isSent = sentReportStudentIds.includes(st.id);

                  return (
                    <div
                      key={st.id}
                      className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={st.photo}
                          alt={st.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{st.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Parent: {st.parentName} (+91 {st.whatsappNumber})
                          </p>
                          {latest && (
                            <p className="text-[10px] text-amber-400 font-semibold">
                              Latest: {latest.marks}/{latest.maxMarks} • Rank #{latest.rank}
                            </p>
                          )}
                        </div>
                      </div>

                      {latest ? (
                        <button
                          onClick={() => handleShareWhatsAppReport(st, latest)}
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
                              <span>Send Report</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">No test data</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSundayBlastModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
