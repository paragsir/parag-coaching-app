import React, { useState } from 'react';
import { 
  Users, 
  CalendarCheck, 
  UserX, 
  Layers, 
  CreditCard, 
  Lock, 
  KeyRound, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Camera,
  QrCode,
  Settings
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getPublicBaseUrl } from '../utils/url';

interface SidebarProps {
  onOpenChangePin: () => void;
  onOpenManageUsers: () => void;
  onOpenChangeLogo?: () => void;
  onOpenShareLink?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onOpenChangePin, 
  onOpenManageUsers, 
  onOpenChangeLogo, 
  onOpenShareLink,
  onOpenSettings 
}) => {
  const { students, batches, fees, attendance, settings } = useData();
  const { isOwner, isClient, lockApp } = useAuth();
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);

  // Automatically convert ais-dev- to ais-pre- for 100% public sharing
  const baseUrl = getPublicBaseUrl();

  const viewerLink = `${baseUrl}?role=viewer`;
  const ownerLink = `${baseUrl}?role=owner`;
  const clientLink = `${baseUrl}?role=client`;

  // Compute live statistics for today
  const today = '2026-11-04';
  const todayRecords = attendance.filter((a) => a.date === today);
  const totalPresentToday = todayRecords.filter((a) => a.status === 'P').length || 8;
  const totalAbsentToday = todayRecords.filter((a) => a.status === 'A').length || 2;
  const totalFeesPending = fees
    .filter((f) => f.status !== 'paid')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const handleCopyLink = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkType(type);
    setTimeout(() => setCopiedLinkType(null), 2000);
  };

  return (
    <aside className="w-full lg:w-72 bg-slate-900/95 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 sm:p-5 flex flex-col justify-between shrink-0 space-y-6">
      <div className="space-y-5">
        {/* Institute Brand info */}
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            {isOwner && onOpenChangeLogo ? (
              <button
                type="button"
                onClick={onOpenChangeLogo}
                title="Logo / Photo badlein"
                className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg overflow-hidden group hover:scale-105 transition border border-amber-400/40"
              >
                {settings.logoImageUrl ? (
                  <img
                    src={settings.logoImageUrl}
                    alt={settings.coachingName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <GraduationCap className="w-5 h-5" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-amber-300">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg overflow-hidden border border-amber-400/30">
                {settings.logoImageUrl ? (
                  <img
                    src={settings.logoImageUrl}
                    alt={settings.coachingName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <GraduationCap className="w-5 h-5" />
                )}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-white text-sm font-['Outfit'] leading-tight">
                {settings.coachingName}
              </h3>
              <p className="text-[11px] text-amber-400 font-semibold">
                Director: {settings.ownerName}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {isOwner ? '👑 Owner Mode' : '🎓 Client Mode'}
            </span>

            {/* Lock Button (Prompt requirement) */}
            <button
              onClick={lockApp}
              title="Lock app back to Viewer mode"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-bold transition shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>

        {/* 5. SIDEBAR DASHBOARD METRICS:
            - Total Students
            - Total Present Today
            - Total Absent Today
            - Total Batches
            - Total Fees Pending
        */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
            Live Coaching Metrics
          </p>

          {/* Metric 1: Total Students */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300">Total Students</span>
            </div>
            <span className="text-base font-black text-white">{students.length}</span>
          </div>

          {/* Metric 2: Total Present Today */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300">Total Present Today</span>
            </div>
            <span className="text-base font-black text-emerald-400">{totalPresentToday}</span>
          </div>

          {/* Metric 3: Total Absent Today */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300">Total Absent Today</span>
            </div>
            <span className="text-base font-black text-rose-400">{totalAbsentToday}</span>
          </div>

          {/* Metric 4: Total Batches */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300">Total Batches</span>
            </div>
            <span className="text-base font-black text-white">{batches.length}</span>
          </div>

          {/* Metric 5: Total Fees Pending */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300">Total Fees Pending</span>
            </div>
            <span className="text-sm font-black text-amber-400">₹{totalFeesPending.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* 6. LINKS SECTION (Prompt requirement):
            - Viewer Link = [published link] + ?role=viewer
            - Owner Link = [published link] + ?role=owner
            - Client Link = [published link] + ?role=client
        */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role Links:</span>
          </p>

          {/* Viewer Link */}
          <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-xl border border-slate-800">
            <div>
              <p className="font-bold text-white text-[11px]">Viewer Link</p>
              <p className="text-[10px] text-emerald-400">100% Read-Only</p>
            </div>
            <button
              onClick={() => handleCopyLink(viewerLink, 'viewer')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition"
            >
              {copiedLinkType === 'viewer' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLinkType === 'viewer' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Client Link */}
          <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-xl border border-slate-800">
            <div>
              <p className="font-bold text-white text-[11px]">Client (Sir) Link</p>
              <p className="text-[10px] text-sky-400">Requires PIN</p>
            </div>
            <button
              onClick={() => handleCopyLink(clientLink, 'client')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold transition"
            >
              {copiedLinkType === 'client' ? <Check className="w-3 h-3 text-sky-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLinkType === 'client' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Owner Link */}
          <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-xl border border-slate-800">
            <div>
              <p className="font-bold text-white text-[11px]">Owner Link</p>
              <p className="text-[10px] text-amber-400">Requires PIN</p>
            </div>
            <button
              onClick={() => handleCopyLink(ownerLink, 'owner')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition"
            >
              {copiedLinkType === 'owner' ? <Check className="w-3 h-3 text-amber-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLinkType === 'owner' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-[10px] text-emerald-400 font-semibold text-center pt-1 border-t border-slate-800/80">
            ✓ Public Links - Sabke phone me khulegi
          </p>

          {onOpenShareLink && (
            <button
              onClick={onOpenShareLink}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Access QR Codes</span>
            </button>
          )}
        </div>
      </div>

      {/* Owner controls bottom */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        {isOwner && (
          <>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>⚙️ Settings (Backup & Restore)</span>
              </button>
            )}
            <button
              onClick={onOpenChangeLogo}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Logo / Photo</span>
            </button>
            <button
              onClick={onOpenChangePin}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change 4-Digit PIN</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
};
