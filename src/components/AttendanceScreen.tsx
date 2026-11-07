import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarCheck, 
  UserX, 
  UserCheck, 
  Send, 
  CheckCircle, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Calendar,
  Save,
  Check,
  PhoneCall,
  Clock
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Student } from '../types';
import { buildWhatsAppUrl, getAbsentAlertMessage } from '../utils/whatsapp';

export const AttendanceScreen: React.FC = () => {
  const { batches, students, attendance, settings, saveAttendanceForBatch } = useData();
  const { isViewer } = useAuth();

  const [selectedBatchName, setSelectedBatchName] = useState<string>(
    batches[0]?.batchName || 'Morning Board Prep (Class 10th)'
  );
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-04');
  
  // Local state for toggles: Map<studentId, 'P' | 'A'>
  const [statusMap, setStatusMap] = useState<Record<string, 'P' | 'A'>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Absent alert popup state
  const [showAbsentAlertModal, setShowAbsentAlertModal] = useState(false);
  const [recentAbsentees, setRecentAbsentees] = useState<Student[]>([]);
  const [sentAlertStudentIds, setSentAlertStudentIds] = useState<string[]>([]);

  // Students in selected batch
  const batchStudents = useMemo(() => {
    return students.filter((s) => s.batch === selectedBatchName);
  }, [students, selectedBatchName]);

  // Load initial status from existing attendance records or default to 'P'
  useEffect(() => {
    const newStatusMap: Record<string, 'P' | 'A'> = {};
    batchStudents.forEach((st) => {
      const existing = attendance.find(
        (a) => a.studentId === st.id && a.date === selectedDate && a.batchName === selectedBatchName
      );
      newStatusMap[st.id] = existing ? existing.status : 'P';
    });
    setStatusMap(newStatusMap);
    setSavedSuccess(false);
  }, [batchStudents, selectedDate, selectedBatchName, attendance]);

  const handleToggle = (studentId: string, status: 'P' | 'A') => {
    if (isViewer) return; // Viewers cannot toggle
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setSavedSuccess(false);
  };

  const handleMarkAll = (status: 'P' | 'A') => {
    if (isViewer) return;
    const newMap: Record<string, 'P' | 'A'> = {};
    batchStudents.forEach((st) => {
      newMap[st.id] = status;
    });
    setStatusMap(newMap);
    setSavedSuccess(false);
  };

  const handleSaveAttendance = async () => {
    if (isViewer) return;
    setIsSaving(true);
    try {
      const records = batchStudents.map((st) => ({
        studentId: st.id,
        status: statusMap[st.id] || 'P',
      }));

      const res = await saveAttendanceForBatch(selectedBatchName, selectedDate, records);
      setSavedSuccess(true);

      // On Save, if any student is Absent, AUTOMATICALLY give option/button to send WhatsApp alert to parent
      if (res.absentCount > 0) {
        setRecentAbsentees(res.absentees);
        setShowAbsentAlertModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendAbsentAlert = (student: Student) => {
    const msg = getAbsentAlertMessage(
      student.parentName,
      student.name,
      selectedDate,
      settings.phone
    );
    const url = buildWhatsAppUrl(student.whatsappNumber, msg);
    window.open(url, '_blank');
    if (!sentAlertStudentIds.includes(student.id)) {
      setSentAlertStudentIds((prev) => [...prev, student.id]);
    }
  };

  // Compute live present vs absent counts in current batch
  const presentCount = batchStudents.filter((st) => statusMap[st.id] === 'P').length;
  const absentCount = batchStudents.filter((st) => statusMap[st.id] === 'A').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
              Batch Daily Attendance
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Mark daily attendance with 1-tap P/A toggles & automated WhatsApp parent absent alerts.
          </p>
        </div>

        {/* Quick Absent Alert Launcher Button */}
        {absentCount > 0 && !isViewer && (
          <button
            onClick={() => {
              const abs = batchStudents.filter((st) => statusMap[st.id] === 'A');
              setRecentAbsentees(abs);
              setShowAbsentAlertModal(true);
            }}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Absent Alert to Parents ({absentCount})</span>
          </button>
        )}
      </div>

      {/* Control Card: Batch & Date Pickers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Batch Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Batch
            </label>
            <select
              value={selectedBatchName}
              onChange={(e) => setSelectedBatchName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.batchName}>
                  {b.batchName} ({b.timing})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Mark Helpers (Hidden for viewers) */}
          {!isViewer && (
            <div className="flex items-end space-x-2">
              <button
                type="button"
                onClick={() => handleMarkAll('P')}
                className="flex-1 flex items-center justify-center space-x-1 py-2 px-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>All Present</span>
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('A')}
                className="flex-1 flex items-center justify-center space-x-1 py-2 px-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-bold transition"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>All Absent</span>
              </button>
            </div>
          )}
        </div>

        {/* Batch Summary Bar */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Total in Batch: <strong className="text-white">{batchStudents.length}</strong></span>
            <span className="text-emerald-400 font-semibold">● Present: {presentCount}</span>
            <span className="text-rose-400 font-semibold">● Absent: {absentCount}</span>
          </div>

          {!isViewer && (
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Attendance Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Attendance</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Student List with P/A Toggles */}
      <div className="space-y-3">
        {batchStudents.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
            <UserX className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-300">No students enrolled in this batch</p>
          </div>
        ) : (
          batchStudents.map((student, idx) => {
            const currentStatus = statusMap[student.id] || 'P';
            const isPresent = currentStatus === 'P';

            return (
              <div
                key={student.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isPresent
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-rose-500/50 bg-gradient-to-r from-rose-950/20 to-slate-900'
                }`}
              >
                {/* Student Photo & Details */}
                <div className="flex items-center space-x-3.5">
                  <span className="w-5 text-slate-500 text-xs font-mono font-bold text-center">
                    {idx + 1}
                  </span>

                  <img
                    src={student.photo}
                    alt={student.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shadow"
                  />

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        {student.name}
                      </h4>
                      {student.rollNo && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          {student.rollNo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Parent: <strong className="text-slate-300">{student.parentName}</strong> (+91 {student.whatsappNumber})
                    </p>
                  </div>
                </div>

                {/* Status Toggle & Alert Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  {/* Absent Direct WhatsApp Alert button */}
                  {!isPresent && !isViewer && (
                    <button
                      onClick={() => handleSendAbsentAlert(student)}
                      title="Send pre-filled WhatsApp absent message to parent"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-300 text-xs font-semibold transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Alert</span>
                    </button>
                  )}

                  {/* If Viewer: Clean Read-Only Status Badge. If Staff: Interactive P/A Toggles */}
                  {isViewer ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                      isPresent 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isPresent ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>{isPresent ? 'Present' : 'Absent'}</span>
                    </span>
                  ) : (
                    <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleToggle(student.id, 'P')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center space-x-1 ${
                          isPresent
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(student.id, 'A')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center space-x-1 ${
                          !isPresent
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Save Button on Mobile */}
      {!isViewer && batchStudents.length > 0 && (
        <div className="sm:hidden fixed bottom-20 right-4 z-30">
          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="flex items-center space-x-2 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-bold text-xs shadow-2xl transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>
      )}

      {/* Absent Alert to Parents Modal (Triggered on Save or via button) */}
      {showAbsentAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">
                  Send WhatsApp Absent Alert to Parents
                </h3>
              </div>
              <button
                onClick={() => setShowAbsentAlertModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3">
              <p className="text-xs text-slate-300">
                The following <strong>{recentAbsentees.length} student(s)</strong> were marked absent today ({selectedDate}). Tap below to notify parents via WhatsApp:
              </p>

              <div className="mt-4 space-y-2.5">
                {recentAbsentees.map((st, idx) => {
                  const isSent = sentAlertStudentIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={st.photo}
                          alt={st.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-600"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{st.name}</p>
                          <p className="text-[11px] text-slate-400">Parent: {st.parentName}</p>
                          <p className="text-[10px] text-emerald-400 font-mono">
                            +91 {st.whatsappNumber}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendAbsentAlert(st)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isSent
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Alert Sent</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Alert</span>
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
                onClick={() => setShowAbsentAlertModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
