import React, { useState } from 'react';
import { 
  Camera, 
  Sparkles, 
  Bell, 
  Edit3, 
  X, 
  Check, 
  Image as ImageIcon, 
  ExternalLink, 
  PhoneCall,
  GraduationCap
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const POSTER_PRESETS = [
  {
    title: 'Classroom & Toppers Excellence',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80',
    description: 'Modern academic classroom with dedicated faculty attention',
  },
  {
    title: 'Science & Physics Masterclass',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    description: 'STEM focus, conceptual experiments & formula derivations',
  },
  {
    title: 'Board Exam Preparation Super 30',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    description: 'Motivated students solving sample test papers together',
  },
  {
    title: 'Library & Self-Study Motivation',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
    description: 'Discipline, weekly tests & personalized doubt clearing',
  },
];

export const HomePoster: React.FC = () => {
  const { settings, updateSettings } = useData();
  const { isOwner } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [posterUrl, setPosterUrl] = useState(settings.posterImageUrl);
  const [announcement, setAnnouncement] = useState(settings.announcementText);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleOpenEdit = () => {
    setPosterUrl(settings.posterImageUrl);
    setAnnouncement(settings.announcementText);
    setIsEditing(true);
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        posterImageUrl: posterUrl,
        announcementText: announcement,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSavedSuccess(false);
      }, 1000);
    } catch (err) {
      console.error('Error updating poster/settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative mb-6">
      {/* Notice Marquee / Ticker */}
      {settings.announcementText && (
        <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-amber-500/20 border-b border-indigo-500/20 py-2 px-4 flex items-center gap-2 text-xs text-amber-200">
          <Bell className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span className="font-bold text-amber-300 shrink-0">NOTICE:</span>
          <p className="truncate font-medium">{settings.announcementText}</p>
        </div>
      )}

      {/* Main Big Banner Area */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 group">
        <img
          src={settings.posterImageUrl || POSTER_PRESETS[0].url}
          alt="Parag Coaching Banner"
          className="w-full h-full object-cover object-center transform group-hover:scale-102 transition duration-700 ease-out"
        />

        {/* Dynamic Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-5 sm:p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-2 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admissions Open 2026-27</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-['Outfit']">
              {settings.coachingName}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium mt-1">
              Founder & Academic Director: <span className="text-amber-400 font-bold">{settings.ownerName}</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl hidden sm:block">
              Premier coaching institute offering specialized batches for Class 9th, 10th & 12th Board Examinations, Weekly Test Analytics, and instant WhatsApp parent alerts.
            </p>

            {/* Quick Contact & Info tags */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-slate-700/60">
              <a 
                href={`tel:${settings.phone}`}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call: +91 {settings.phone}</span>
              </a>
              <span className="text-xs text-slate-400">
                📍 {settings.address}
              </span>
            </div>
          </div>
        </div>

        {/* Owner Edit Poster Button (Strictly only visible to OWNER) */}
        {isOwner && (
          <button
            onClick={handleOpenEdit}
            className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-bold backdrop-blur-md shadow-lg transition duration-200"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Change Poster</span>
          </button>
        )}
      </div>

      {/* Owner Edit Poster Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Update Coaching Poster & Announcement</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Image URL Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Poster Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://... (Direct image link)"
                    required
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-1">Current Preview:</p>
                <div className="h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                  <img
                    src={posterUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = POSTER_PRESETS[0].url;
                    }}
                  />
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Or select from high-definition education presets:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POSTER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPosterUrl(preset.url)}
                      className={`text-left p-2 rounded-xl border transition ${
                        posterUrl === preset.url
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800'
                      }`}
                    >
                      <img src={preset.url} alt={preset.title} className="w-full h-16 object-cover rounded-lg mb-1.5" />
                      <p className="text-[11px] font-semibold text-white truncate">{preset.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Announcement text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notice Board Announcement
                </label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  rows={2}
                  maxLength={300}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Important message for students & parents..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 rounded-xl shadow-lg transition"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Update Poster</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
