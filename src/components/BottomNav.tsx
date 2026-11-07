import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  CalendarCheck, 
  Award, 
  Users 
} from 'lucide-react';
import { TabType } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { lateFeeCount } = useData();
  const { isViewer } = useAuth();

  const navItems: { tab: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      tab: 'home',
      label: isViewer ? 'Overview' : 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      tab: 'fees',
      label: 'Fees Due',
      icon: <CreditCard className="w-5 h-5" />,
      badge: lateFeeCount > 0 ? lateFeeCount : undefined,
    },
    {
      tab: 'attendance',
      label: 'Attendance',
      icon: <CalendarCheck className="w-5 h-5" />,
    },
    {
      tab: 'tests',
      label: 'Tests',
      icon: <Award className="w-5 h-5" />,
    },
    {
      tab: 'parent',
      label: isViewer ? 'My Child' : 'Parent View',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-bottom">
      <div className="max-w-lg mx-auto px-2 flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => onSelectTab(item.tab)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-extrabold rounded-full animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 w-8 h-1 bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
