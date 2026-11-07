import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  Sparkles, 
  RotateCcw, 
  GraduationCap,
  Shield,
  BookOpen
} from 'lucide-react';
import { useData } from '../context/DataContext';

interface EditLogoModalProps {
  onClose: () => void;
}

const LOGO_PRESETS = [
  {
    title: 'Royal Academy Crest',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=300&q=80',
    description: 'Gold & Navy academic seal',
  },
  {
    title: 'Gyan & Books Emblem',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
    description: 'Knowledge & focus emblem',
  },
  {
    title: 'Excellence Trophy Medallion',
    url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=300&q=80',
    description: 'Toppers & achievers symbol',
  },
  {
    title: 'Modern Science & Tech Crest',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=300&q=80',
    description: 'Physics & mathematics focus',
  },
];

export const EditLogoModal: React.FC<EditLogoModalProps> = ({ onClose }) => {
  const { settings, updateSettings } = useData();

  const [logoUrl, setLogoUrl] = useState(settings.logoImageUrl || '');
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize and convert uploaded file to clean lightweight data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('Kripya valid image file (JPG, PNG, WebP) select karein.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Requirement 1: Photo ko max 500px width tak chhota karo aur JPG quality 70% (0.70) rakho
        const canvas = document.createElement('canvas');
        const maxWidth = 500;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.70);
          setLogoUrl(compressedDataUrl);
        }
      };
      img.onerror = () => {
        setUploadError('Image load karne me error aayi. Doosri photo try karein.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setSaving(true);

    const finalLogo = logoUrl.trim();

    // 2. Compress hone ke baad hi localStorage me save karo.
    // 3. Agar phir bhi save na ho, to user ko sahi error dikhao - "Photo bahut badi hai, chhoti photo choose karein"
    if (finalLogo) {
      try {
        localStorage.setItem('app_coaching_logo', finalLogo);
      } catch (err) {
        console.error('LocalStorage save error:', err);
        setUploadError('Photo bahut badi hai, chhoti photo choose karein');
        setSaving(false);
        return;
      }
    } else {
      try {
        localStorage.removeItem('app_coaching_logo');
      } catch (e) {
        console.warn(e);
      }
    }

    try {
      await updateSettings({
        logoImageUrl: finalLogo,
      });
      setSavedSuccess(true);
      // 4. Save hone ke baad popup band ho jaye aur naya logo turant header me dikhna chahiye
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error updating coaching logo:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('quota') || msg.includes('QuotaExceeded') || msg.includes('large')) {
        setUploadError('Photo bahut badi hai, chhoti photo choose karein');
      } else {
        // localStorage is already updated, close popup successfully
        setSavedSuccess(true);
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setLogoUrl('');
    setUploadError('');
    try {
      localStorage.removeItem('app_coaching_logo');
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base font-['Outfit']">
                Coaching Logo / Photo Badlein
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Parag Coaching ka official logo ya photo upload karein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black overflow-hidden border-2 border-amber-400/60 relative">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Coaching Logo Preview"
                  className="w-full h-full object-cover"
                  onError={() => {
                    setUploadError('Image link sahi nahi hai.');
                  }}
                />
              ) : (
                <GraduationCap className="w-9 h-9" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Logo Preview:</p>
              <h4 className="text-sm font-black text-white font-['Outfit']">
                {settings.coachingName || 'Parag Coaching'}
              </h4>
              <p className="text-[11px] text-amber-400 font-medium">
                {logoUrl ? '✓ Custom Photo Selected' : 'Default Emblem Active'}
              </p>
            </div>
          </div>

          {logoUrl && (
            <button
              type="button"
              onClick={handleResetToDefault}
              title="Reset to default icon"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 text-xs font-bold mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Photo Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Emblem Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Web Link URL</span>
          </button>
        </div>

        {uploadError && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {uploadError}
          </div>
        )}

        {/* Tab 1: Upload from Device */}
        {activeTab === 'upload' && (
          <div className="space-y-3 flex-1 overflow-y-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-amber-400/80 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">
                Phone / Device se Photo Upload Karein
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Gallery, Camera ya Computer se apni coaching ka logo ya photo choose karein (JPG, PNG).
              </p>
              <button
                type="button"
                className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition"
              >
                Choose Photo from Gallery
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Emblem Presets */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto pr-1">
            {LOGO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setLogoUrl(preset.url);
                  setUploadError('');
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center space-x-2.5 transition ${
                  logoUrl === preset.url
                    ? 'border-amber-400 bg-amber-500/15'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.title}
                  className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-700"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{preset.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{preset.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 3: URL Link */}
        {activeTab === 'url' && (
          <div className="space-y-3 flex-1">
            <label className="block text-xs font-semibold text-slate-300">
              Direct Image URL
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => {
                setLogoUrl(e.target.value);
                setUploadError('');
              }}
              placeholder="https://example.com/logo.png"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-400">
              Aap kisi bhi image hosting ya Google Drive/Imgur direct link ko yahan paste kar sakte hain.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-1.5 px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-95 rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <span>Saving Logo...</span>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-950" />
                <span>Logo Saved!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Logo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
