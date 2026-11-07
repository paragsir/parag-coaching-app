import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, UserProfile } from '../types';

export const OWNER_EMAIL = 'pandeyakash09307@gmail.com';

interface AuthContextType {
  activeRole: UserRole;
  isOwner: boolean;
  isClient: boolean;
  isViewer: boolean;
  isUnlocked: boolean;
  hasOwnerPinSet: boolean;
  showPinModal: boolean;
  targetRoleForPin: UserRole;
  setShowPinModal: (show: boolean) => void;
  setTargetRoleForPin: (role: UserRole) => void;
  openPinModal: (targetRole?: UserRole) => void;
  setNewOwnerPin: (pin: string) => { success: boolean; message: string };
  verifyAndUnlockPin: (pin: string) => { success: boolean; message: string };
  changeOwnerPin: (oldPin: string, newPin: string) => { success: boolean; message: string };
  lockApp: () => void;
  userProfile: UserProfile;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL parameters first
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlRole = searchParams.get('role');

  // Stored state
  const savedRole = (typeof window !== 'undefined' ? localStorage.getItem('app_role') : null) as UserRole | null;
  const initialSavedPin = typeof window !== 'undefined' ? localStorage.getItem('owner_pin') : null;
  const initialUnlocked = typeof window !== 'undefined' 
    ? (sessionStorage.getItem('is_unlocked') === 'true' || localStorage.getItem('is_unlocked') === 'true') 
    : false;

  const [hasOwnerPinSet, setHasOwnerPinSet] = useState<boolean>(Boolean(initialSavedPin));
  const [activeRole, setActiveRole] = useState<UserRole>(initialUnlocked && savedRole ? savedRole : 'viewer');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(initialUnlocked);
  
  // PIN modal control
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [targetRoleForPin, setTargetRoleForPin] = useState<UserRole>('owner');

  useEffect(() => {
    // 1. Explicit Viewer Link (?role=viewer):
    if (urlRole === 'viewer') {
      localStorage.setItem('app_role', 'viewer');
      localStorage.removeItem('is_unlocked');
      sessionStorage.removeItem('is_unlocked');
      setActiveRole('viewer');
      setIsUnlocked(false);
      setShowPinModal(false);
    } else if (urlRole === 'owner') {
      setTargetRoleForPin('owner');
      if (!initialUnlocked) {
        setShowPinModal(true);
        setActiveRole('viewer');
      } else {
        setActiveRole('owner');
        setIsUnlocked(true);
      }
    } else if (urlRole === 'client') {
      setTargetRoleForPin('client');
      if (!initialUnlocked) {
        setShowPinModal(true);
        setActiveRole('viewer');
      } else {
        setActiveRole('client');
        setIsUnlocked(true);
      }
    } else {
      // Default (e.g. root development preview in AI Studio):
      if (initialUnlocked && (savedRole === 'owner' || savedRole === 'client')) {
        setActiveRole(savedRole);
        setIsUnlocked(true);
      } else {
        // If owner pin exists or not, prompt owner to unlock in dev preview
        setTargetRoleForPin('owner');
        setShowPinModal(true);
        setActiveRole('viewer');
      }
    }

    // Refresh PIN status from localStorage
    const pin = localStorage.getItem('owner_pin');
    setHasOwnerPinSet(Boolean(pin));
  }, [urlRole]);

  // Open PIN modal helper
  const openPinModal = (target: UserRole = 'owner') => {
    setTargetRoleForPin(target);
    setShowPinModal(true);
  };

  // Set new PIN for the first time (NO HARDCODED DEFAULT PIN!)
  const setNewOwnerPin = (pin: string): { success: boolean; message: string } => {
    if (!/^\d{4}$/.test(pin)) {
      return { success: false, message: 'PIN must be exactly 4 numeric digits.' };
    }
    localStorage.setItem('owner_pin', pin);
    localStorage.setItem('is_unlocked', 'true');
    sessionStorage.setItem('is_unlocked', 'true');
    setHasOwnerPinSet(true);
    setIsUnlocked(true);
    setActiveRole(targetRoleForPin);
    localStorage.setItem('app_role', targetRoleForPin);
    setShowPinModal(false);
    return { success: true, message: 'PIN Set Ho Gaya! Edit Mode Unlocked.' };
  };

  // Verify PIN to unlock
  const verifyAndUnlockPin = (pin: string): { success: boolean; message: string } => {
    const savedPin = localStorage.getItem('owner_pin');
    if (!savedPin) {
      return { success: false, message: 'No PIN set yet. Please set your 4-digit PIN first.' };
    }
    if (pin.trim() === savedPin.trim()) {
      localStorage.setItem('is_unlocked', 'true');
      sessionStorage.setItem('is_unlocked', 'true');
      setIsUnlocked(true);
      setActiveRole(targetRoleForPin);
      localStorage.setItem('app_role', targetRoleForPin);
      setShowPinModal(false);
      return { success: true, message: 'Unlocked! Edit Mode Active.' };
    }
    return { success: false, message: 'Wrong PIN! Access denied.' };
  };

  // Change existing PIN
  const changeOwnerPin = (oldPin: string, newPin: string): { success: boolean; message: string } => {
    const savedPin = localStorage.getItem('owner_pin');
    if (oldPin.trim() !== savedPin?.trim()) {
      return { success: false, message: 'Old PIN does not match.' };
    }
    if (!/^\d{4}$/.test(newPin)) {
      return { success: false, message: 'New PIN must be exactly 4 numeric digits.' };
    }
    localStorage.setItem('owner_pin', newPin);
    return { success: true, message: 'PIN successfully changed!' };
  };

  // Lock App back to 100% Viewer Mode
  const lockApp = () => {
    setIsUnlocked(false);
    setActiveRole('viewer');
    localStorage.setItem('app_role', 'viewer');
    localStorage.removeItem('is_unlocked');
    sessionStorage.removeItem('is_unlocked');
    setShowPinModal(false);
  };

  const isOwner = isUnlocked && activeRole === 'owner';
  const isClient = isUnlocked && activeRole === 'client';
  const isViewer = !isUnlocked || activeRole === 'viewer';

  const userProfile: UserProfile = {
    id: isOwner ? 'owner-akash' : isClient ? 'client-faculty' : 'viewer-parent',
    email: isOwner ? OWNER_EMAIL : isClient ? 'sir@paragcoaching.com' : 'viewer@paragcoaching.com',
    role: activeRole,
    name: isOwner ? 'Akash Pandey (Owner)' : isClient ? 'Faculty Sir (Client)' : 'Student & Parent Viewer',
  };

  return (
    <AuthContext.Provider
      value={{
        activeRole,
        isOwner,
        isClient,
        isViewer,
        isUnlocked,
        hasOwnerPinSet,
        showPinModal,
        targetRoleForPin,
        setShowPinModal,
        setTargetRoleForPin,
        openPinModal,
        setNewOwnerPin,
        verifyAndUnlockPin,
        changeOwnerPin,
        lockApp,
        userProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
