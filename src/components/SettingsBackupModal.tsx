import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Database,
  FileJson,
  Loader2,
  HardDriveDownload,
  RotateCcw
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

interface SettingsBackupModalProps {
  onClose: () => void;
}

export const SettingsBackupModal: React.FC<SettingsBackupModalProps> = ({ onClose }) => {
  const { students, batches, fees, attendance, tests, enquiries, settings, restoreAllData } = useData();
  const { isViewer, isOwner } = useAuth();

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Backup - Data Download Karo
  const handleDownloadBackup = () => {
    try {
      const backupData = {
        appName: 'Parag Coaching',
        appVersion: '1.0',
        backupDate: new Date().toISOString(),
        totalStudents: students.length,
        students,
        batches,
        fees,
        attendance,
        tests,
        enquiries,
        settings,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'parag-coaching-backup.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Exact user notification
      setNotification({
        type: 'success',
        message: 'Backup ho gaya! Is file ko WhatsApp / Drive me sambhal ke rakho',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Backup file download karne me dikkat aayi.',
      });
    }
  };

  // 2. Restore - Data Wapas Lao (Owner Only)
  const handleTriggerRestore = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setNotification(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate basic structure
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File format galat hai. Valid backup JSON file chunein.');
        }

        const result = await restoreAllData(parsed);
        setIsRestoring(false);

        if (result.success) {
          // Exact user notification
          setNotification({
            type: 'success',
            message: 'Saara Data wapas aa gaya',
          });
        } else {
          setNotification({
            type: 'error',
            message: result.message || 'Restore karne me dikkat aayi.',
          });
        }
      } catch (err: any) {
        setIsRestoring(false);
        setNotification({
          type: 'error',
          message: err.message || 'File read karne me dikkat aayi. Sahi backup file select karein.',
        });
      }
    };

    reader.onerror = () => {
      setIsRestoring(false);
      setNotification({
        type: 'error',
        message: 'File upload fail ho gayi. Dobara koshish karein.',
      });
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-['Outfit']">Settings</h2>
              <p className="text-xs text-slate-400">Data Backup, Restore & App Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Notification Banner */}
        {notification && (
          <div
            className={`mt-4 p-3.5 rounded-2xl flex items-start gap-3 border text-xs font-semibold shrink-0 animate-in fade-in slide-in-from-top-2 duration-300 ${
              notification.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-950/30'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-950/30'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="leading-snug">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="mt-5 space-y-4 overflow-y-auto pr-1">
          {/* OPTION A: Backup - Data Download Karo */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <HardDriveDownload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Backup - Data Download Karo</h3>
                  <p className="text-[11px] text-slate-400">
                    File: <span className="font-mono text-emerald-400">parag-coaching-backup.json</span>
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                JSON Backup
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Coaching ke sabhi Students, Photos, Attendance Records, Fees, aur Tests ko ek single safe file me download karein.
            </p>

            <button
              onClick={handleDownloadBackup}
              type="button"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Backup - Data Download Karo</span>
            </button>
          </div>

          {/* OPTION B: Restore - Data Wapas Lao (ONLY FOR OWNER / CLIENT, 100% HIDDEN FOR VIEWER / PARENT) */}
          {!isViewer && (
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-amber-500/30 hover:border-amber-500/50 transition space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Restore - Data Wapas Lao</h3>
                    <p className="text-[11px] text-amber-400/90 font-medium">Owner Only • Quick Auto-Import</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                  Protected
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Apna purana <span className="font-mono text-amber-300">.json</span> backup file chunein. File select karte hi saara data bina ek-ek karke dale wapas aa jayega.
              </p>

              {/* Hidden file input for .json */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={handleTriggerRestore}
                disabled={isRestoring}
                type="button"
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 transition active:scale-[0.98]"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Data Wapas Aa Raha Hai...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Restore - Data Wapas Lao</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* OPTION C: App Info */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">App Info</h3>
                <p className="text-xs text-amber-400 font-semibold font-['Outfit']">
                  Parag Coaching App - Version 1.0
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <p className="text-slate-400">Director</p>
                <p className="font-bold text-white">{settings.ownerName || 'Akash Pandey'}</p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <p className="text-slate-400">Institute</p>
                <p className="font-bold text-white">{settings.coachingName || 'Parag Coaching'}</p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <p className="text-slate-400">Active Mode</p>
                <p className="font-bold text-emerald-400">
                  {isViewer ? 'Parent (Read-Only)' : isOwner ? 'Owner (Full Access)' : 'Faculty Sir'}
                </p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <p className="text-slate-400">Database</p>
                <p className="font-bold text-slate-200">Cloud Sync & Local Backup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Band Karein (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
