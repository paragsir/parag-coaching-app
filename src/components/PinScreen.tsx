import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  X, 
  ArrowRight, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PinScreenProps {
  mode?: 'unlock' | 'change';
  onClose?: () => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({ mode = 'unlock', onClose }) => {
  const { 
    hasOwnerPinSet, 
    targetRoleForPin, 
    setNewOwnerPin, 
    verifyAndUnlockPin, 
    changeOwnerPin, 
    setShowPinModal 
  } = useAuth();

  // Setup PIN state (when no PIN exists yet)
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showSetupPinText, setShowSetupPinText] = useState(false);

  // 4 boxes input state for existing PIN
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const digitInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Change PIN state
  const [isChangingPin, setIsChangingPin] = useState(mode === 'change');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Focus first digit box when unlock view is active
    if (hasOwnerPinSet && !isChangingPin) {
      setTimeout(() => {
        digitInputRefs[0].current?.focus();
      }, 150);
    }
  }, [hasOwnerPinSet, isChangingPin]);

  const handleDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...pinDigits];
    updated[index] = digit;
    setPinDigits(updated);
    setErrorMsg('');

    // Auto-advance to next box
    if (digit && index < 3) {
      digitInputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      digitInputRefs[index - 1].current?.focus();
    }
  };

  // 1. First Time PIN Setup Handler
  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (setupPin.length !== 4) {
      setErrorMsg('PIN 4-digit ka hona chahiye (e.g. 4 numbers).');
      return;
    }
    if (setupPin !== confirmPin) {
      setErrorMsg('Dono PIN match nahi kar rahe hain. Dobara check karein.');
      return;
    }

    const res = setNewOwnerPin(setupPin);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        if (onClose) onClose();
      }, 800);
    } else {
      setErrorMsg(res.message);
    }
  };

  // 2. Existing PIN Unlock Handler
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const fullPin = pinDigits.join('');

    if (fullPin.length !== 4) {
      setErrorMsg('Kripya 4-digit PIN enter karein.');
      return;
    }

    const res = verifyAndUnlockPin(fullPin);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        if (onClose) onClose();
      }, 600);
    } else {
      setErrorMsg('Wrong PIN! Kripya sahi PIN dalein ya Viewer mode me rahein.');
      setPinDigits(['', '', '', '']);
      digitInputRefs[0].current?.focus();
    }
  };

  // 3. Change PIN Handler
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPin.length !== 4) {
      setErrorMsg('New PIN 4-digit ka hona chahiye.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMsg('New PIN confirm PIN se match nahi kar raha.');
      return;
    }

    const res = changeOwnerPin(oldPin, newPin);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        setIsChangingPin(false);
        setOldPin('');
        setNewPin('');
        setConfirmNewPin('');
        if (onClose) onClose();
      }, 1000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCancel = () => {
    setShowPinModal(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base font-['Outfit']">
                Parag Coaching Security
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {targetRoleForPin === 'client' ? 'Coaching Sir (Faculty Unlock)' : 'Owner Edit Access (Akash Pandey)'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CASE A: CHANGE PIN VIEW */}
        {isChangingPin ? (
          <form onSubmit={handleChangePinSubmit} className="mt-5 space-y-4">
            <div className="text-center pb-1">
              <h4 className="text-sm font-bold text-white">Owner Security: Change 4-Digit PIN</h4>
              <p className="text-xs text-slate-400 mt-0.5">Apna purana PIN daal kar naya 4-digit PIN set karein.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Old 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Purana PIN"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Naya 4-digit PIN"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Naya PIN dobara daalein"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back to Unlock
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition"
              >
                Save New PIN
              </button>
            </div>
          </form>
        ) : !hasOwnerPinSet ? (
          /* CASE B: FIRST TIME - OWNER KHUD 4-DIGIT PIN BANAYEGA (NO HARDCODED DEFAULT PIN) */
          <form onSubmit={handleCreatePin} className="mt-5 space-y-4">
            <div className="text-center">
              <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-extrabold text-white">Apna 4-Digit PIN Banao</h4>
              <p className="text-xs text-slate-300 mt-1">
                Aap Parag Coaching ke Owner hain. Koi default PIN nahi hai—apna pasandida 4-digit secret PIN banayein jo sirf aapko pata ho.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  1. Enter New 4-Digit PIN:
                </label>
                <div className="relative">
                  <input
                    type={showSetupPinText ? 'text' : 'password'}
                    maxLength={4}
                    required
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 8492"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPinText(!showSetupPinText)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showSetupPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  2. Confirm PIN:
                </label>
                <input
                  type={showSetupPinText ? 'text' : 'password'}
                  maxLength={4}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN dobara enter karein"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:opacity-95 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>PIN Set Karo</span>
            </button>

            <p className="text-[11px] text-center text-slate-400">
              PIN set karne ke baad Edit Mode unlock ho jayega aur PIN aapke browser me secure save ho jayega.
            </p>
          </form>
        ) : (
          /* CASE C: ENTER 4-DIGIT PIN TO EDIT (4 BOXES AS SPECIFIED) */
          <form onSubmit={handleUnlockPin} className="mt-5 space-y-5">
            <div className="text-center">
              <h4 className="text-base font-extrabold text-white">Enter 4-Digit PIN to Edit</h4>
              <p className="text-xs text-slate-300 mt-1">
                Edit mode unlock karne ke liye apna 4-digit PIN enter karein:
              </p>
            </div>

            {/* 4 Digit Boxes */}
            <div className="flex justify-center items-center gap-3 py-2">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={digitInputRefs[idx]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-14 h-14 bg-slate-800 border-2 border-slate-700 focus:border-amber-400 rounded-2xl text-center text-2xl font-black text-white focus:outline-none shadow-inner transition"
                />
              ))}
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock</span>
            </button>

            {/* Bottom Options */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-200"
              >
                ← Stay in Viewer Mode
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="text-amber-400 hover:text-amber-300 font-semibold"
              >
                Change PIN
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
