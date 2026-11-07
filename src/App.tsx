import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ViewerDashboard } from './components/ViewerDashboard';
import { HomePoster } from './components/HomePoster';
import { FeesScreen } from './components/FeesScreen';
import { AttendanceScreen } from './components/AttendanceScreen';
import { WeeklyTestScreen } from './components/WeeklyTestScreen';
import { OwnerDashboardScreen } from './components/OwnerDashboardScreen';
import { AddStudentModal } from './components/AddStudentModal';
import { ReferralModal } from './components/ReferralModal';
import { UserManagementModal } from './components/UserManagementModal';
import { ShareLinkModal } from './components/ShareLinkModal';
import { PinScreen } from './components/PinScreen';
import { EditLogoModal } from './components/EditLogoModal';
import { SettingsBackupModal } from './components/SettingsBackupModal';
import { TabType } from './types';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isViewer, isOwner, isClient, showPinModal, setShowPinModal } = useAuth();
  const { loading } = useData();

  // Tab state for Edit mode
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Modals state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showChangeLogoModal, setShowChangeLogoModal] = useState(false);
  const [referralStudentName, setReferralStudentName] = useState<string | undefined>(undefined);

  const handleOpenReferral = (referrerName?: string) => {
    setReferralStudentName(referrerName);
    setShowReferralModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
        <p className="font-extrabold text-xl font-['Outfit'] text-white">Parag Coaching</p>
        <p className="text-xs text-slate-400">Loading coaching records & database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        onOpenShareLink={() => setShowShareLinkModal(true)}
        onOpenChangePin={() => setShowChangePinModal(true)}
        onOpenChangeLogo={() => setShowChangeLogoModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* CONDITIONAL LAYOUT:
          1. IF VIEWER: Show the complete Viewer Dashboard (Search, Student Card, 4-Week Tests, 30 Days Attendance Detail, Fees Read-Only).
          2. IF OWNER / CLIENT (UNLOCKED): Show Sidebar on the left + Management Tabs on the right.
      */}
      {isViewer ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ViewerDashboard />
        </main>
      ) : (
        /* OWNER / CLIENT UNLOCKED EDIT MODE */
        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
          {/* 5. SIDEBAR DASHBOARD on Left for Owner / Client */}
          <Sidebar
            onOpenChangePin={() => setShowChangePinModal(true)}
            onOpenManageUsers={() => setShowManageUsersModal(true)}
            onOpenChangeLogo={() => setShowChangeLogoModal(true)}
            onOpenShareLink={() => setShowShareLinkModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />

          {/* Main Work Area */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
            {/* TAB 1: Home / Owner Dashboard */}
            {activeTab === 'home' && (
              <div className="animate-in fade-in duration-300">
                <HomePoster />
                <OwnerDashboardScreen
                  onOpenAddStudent={() => setShowAddStudentModal(true)}
                  onOpenManageUsers={() => setShowManageUsersModal(true)}
                  onOpenReferralModal={() => handleOpenReferral()}
                  onSelectTab={(tab) => setActiveTab(tab)}
                />
              </div>
            )}

            {/* TAB 2: Fees Pending Screen */}
            {activeTab === 'fees' && (
              <div className="animate-in fade-in duration-300">
                <FeesScreen />
              </div>
            )}

            {/* TAB 3: Attendance Screen */}
            {activeTab === 'attendance' && (
              <div className="animate-in fade-in duration-300">
                <AttendanceScreen />
              </div>
            )}

            {/* TAB 4: Weekly Test Report Screen */}
            {activeTab === 'tests' && (
              <div className="animate-in fade-in duration-300">
                <WeeklyTestScreen />
              </div>
            )}
          </main>

          {/* Mobile bottom nav when in Edit mode */}
          <div className="lg:hidden">
            <BottomNav activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />
          </div>
        </div>
      )}

      {/* PIN Unlock Modal (Triggered by ?role=owner, ?role=client, or clicking Owner Unlock) */}
      {showPinModal && (
        <PinScreen onClose={() => setShowPinModal(false)} />
      )}

      {/* Change PIN Modal (For Owner) */}
      {showChangePinModal && (
        <PinScreen mode="change" onClose={() => setShowChangePinModal(false)} />
      )}

      {/* Edit Logo / Upload Photo Modal (For Owner) */}
      {showChangeLogoModal && (
        <EditLogoModal onClose={() => setShowChangeLogoModal(false)} />
      )}

      {/* Share Links Modal (Viewer, Client, Owner links with copy & WhatsApp) - Never for Viewer */}
      {!isViewer && showShareLinkModal && (
        <ShareLinkModal onClose={() => setShowShareLinkModal(false)} />
      )}

      {/* Settings Modal (Backup, Restore, App Info) - Accessible to both Owner and Parent */}
      {showSettingsModal && (
        <SettingsBackupModal onClose={() => setShowSettingsModal(false)} />
      )}

      {/* Staff Modals */}
      {showAddStudentModal && (
        <AddStudentModal onClose={() => setShowAddStudentModal(false)} />
      )}

      {showManageUsersModal && (
        <UserManagementModal onClose={() => setShowManageUsersModal(false)} />
      )}

      {showReferralModal && (
        <ReferralModal
          initialReferrer={referralStudentName}
          onClose={() => setShowReferralModal(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
