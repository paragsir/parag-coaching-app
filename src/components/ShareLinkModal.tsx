import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Smartphone,
  Eye,
  KeyRound,
  Users,
  Globe,
  QrCode,
  ExternalLink,
  Download
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getPublicBaseUrl } from '../utils/url';

interface ShareLinkModalProps {
  onClose: () => void;
  initialTab?: 'links' | 'qr';
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ onClose, initialTab = 'qr' }) => {
  const { settings } = useData();
  const [activeTab, setActiveTab] = useState<'links' | 'qr'>(initialTab);
  const [selectedQrRole, setSelectedQrRole] = useState<'owner' | 'client' | 'viewer'>('owner');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Automatically convert ais-dev- to ais-pre- for 100% public sharing
  const baseUrl = getPublicBaseUrl();

  const viewerLink = `${baseUrl}?role=viewer`;
  const ownerLink = `${baseUrl}?role=owner`;
  const clientLink = `${baseUrl}?role=client`;

  const whatsappMessage = `Namaste! 

${settings.coachingName} (Akash Pandey) ka online Student & Parent Portal:
👉 ${viewerLink}

Is link par aap:
1. Bacche ka Naam search karke Card dekh sakte hain
2. 30 Dino ki Attendance & Percentage check kar sakte hain
3. Last 4 Weeks ke Weekly Test marks & Grade table
4. Tuition Fees status & UPI se payment

- ${settings.ownerName}, ${settings.coachingName}`;

  const handleCopy = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const activeQrUrl = selectedQrRole === 'owner' ? ownerLink : selectedQrRole === 'client' ? clientLink : viewerLink;
  const activeQrTitle = selectedQrRole === 'owner' 
    ? 'Owner Access QR (Akash Pandey)' 
    : selectedQrRole === 'client' 
    ? 'Client Access QR (Faculty Sirs)' 
    : 'Viewer QR (Parents & Students)';

  const activeQrSubtitle = selectedQrRole === 'owner'
    ? 'Apne phone ke camera se scan karein aur seedha Owner Mode me apna PIN enter karein.'
    : selectedQrRole === 'client'
    ? 'Faculty Sir apne phone se scan karke attendance & weekly test report update kar sakte hain.'
    : 'Coaching notice board par lagayein ya parents ko scan karwayein (100% Read-Only).';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base font-['Outfit']">
              Coaching Access & QR Codes
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Bar: Scan QR Code vs Text Links */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 my-3.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>📱 Scan QR Codes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'links'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>🔗 Copy Links & WhatsApp</span>
          </button>
        </div>

        {/* TAB 1: SCAN QR CODES (FOR OWNER & CLIENT & PARENTS) */}
        {activeTab === 'qr' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Role Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedQrRole('owner')}
                className={`py-1.5 px-1 rounded-lg transition text-center truncate ${
                  selectedQrRole === 'owner'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                👑 Owner QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedQrRole('client')}
                className={`py-1.5 px-1 rounded-lg transition text-center truncate ${
                  selectedQrRole === 'client'
                    ? 'bg-sky-500 text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🎓 Client QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedQrRole('viewer')}
                className={`py-1.5 px-1 rounded-lg transition text-center truncate ${
                  selectedQrRole === 'viewer'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                👨‍👩‍👧 Viewer QR
              </button>
            </div>

            {/* QR Code Presentation Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <div>
                <h4 className="text-sm font-black text-white font-['Outfit']">
                  {activeQrTitle}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeQrSubtitle}
                </p>
              </div>

              {/* High Resolution Generated QR Code Image */}
              <div className="p-3.5 bg-white rounded-2xl inline-block shadow-2xl border-4 border-amber-400/40">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(activeQrUrl)}`}
                  alt={`${activeQrTitle} QR Code`}
                  className="w-48 h-48 sm:w-52 sm:h-52 mx-auto rounded-lg"
                />
                <p className="text-[10px] text-slate-800 font-black mt-1.5 uppercase tracking-wider">
                  Parag Coaching • Akash Pandey
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Scan Destination URL (Public Link):
                </span>
                <p className="font-mono text-xs text-amber-300 truncate">
                  {activeQrUrl}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(activeQrUrl, selectedQrRole)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
                >
                  {copiedType === selectedQrRole ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === selectedQrRole ? 'Copied Public Link!' : 'Copy Link'}</span>
                </button>
                <a
                  href={activeQrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open URL Now</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEXT LINKS & WHATSAPP SHARING */}
        {activeTab === 'links' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Security Guarantee Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-200">
                <p className="font-bold text-emerald-300">100% Public & Read-Only Access:</p>
                <p className="mt-0.5 text-slate-300 leading-relaxed text-[11px]">
                  Jab aap <strong>Viewer Link</strong> kisi parent ya student ko bhejenge, toh unhe bina kisi Google login ya PIN ke direct portal dikhega. Unke paas koi bhi edit, delete ya modify karne ka button nahi hoga.
                </p>
              </div>
            </div>

            {/* 1. Viewer Link */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>1. Viewer Link (Parents & Students)</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  100% Read-Only
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={viewerLink}
                  className="bg-transparent text-xs text-slate-300 flex-1 outline-none font-mono truncate"
                />
                <button
                  onClick={() => handleCopy(viewerLink, 'viewer')}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shrink-0"
                >
                  {copiedType === 'viewer' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'viewer' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Public Link - Sabke phone me khulegi</span>
              </p>
            </div>

            {/* WhatsApp Direct Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 flex items-center justify-center space-x-2 transition active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Send Viewer Link to Parents on WhatsApp</span>
            </button>

            {/* 2. Client Link (Coaching Sirs) */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-sky-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>2. Client Link (Coaching Sirs / Faculty)</span>
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">
                  Requires 4-Digit PIN
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={clientLink}
                  className="bg-transparent text-xs text-slate-300 flex-1 outline-none font-mono truncate"
                />
                <button
                  onClick={() => handleCopy(clientLink, 'client')}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shrink-0"
                >
                  {copiedType === 'client' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'client' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-sky-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Public Link - Sabke phone me khulegi</span>
              </p>
            </div>

            {/* 3. Owner Link (Akash Pandey) */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  <span>3. Owner Link (Akash Pandey)</span>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  Full Access with PIN
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={ownerLink}
                  className="bg-transparent text-xs text-slate-300 flex-1 outline-none font-mono truncate"
                />
                <button
                  onClick={() => handleCopy(ownerLink, 'owner')}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0"
                >
                  {copiedType === 'owner' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'owner' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Public Link - Sabke phone me khulegi</span>
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
