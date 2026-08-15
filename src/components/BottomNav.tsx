import React from 'react';
import { LayoutDashboard, BarChart3, Plus, Library, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ViewTab } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openScheduleModalWithData } = useApp();

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: Library },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f1e]/95 backdrop-blur-xl border-t border-white/[0.08] px-3 py-2 sm:px-6 md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* Left 2 items */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${
            activeTab === 'dashboard' ? 'text-pink-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${
            activeTab === 'analytics' ? 'text-pink-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'analytics' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Analytics</span>
        </button>

        {/* Center Floating (+) Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => openScheduleModalWithData()}
            className="w-12 h-12 rounded-full pink-glow-btn flex items-center justify-center text-white border-4 border-[#0b0d17] shadow-xl hover:scale-105 active:scale-95 transition-all"
            aria-label="Create Post or Schedule"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Right 2 items */}
        <button
          onClick={() => setActiveTab('content')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${
            activeTab === 'content' ? 'text-pink-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Library className={`w-5 h-5 ${activeTab === 'content' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Content</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${
            activeTab === 'calendar' ? 'text-pink-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'calendar' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Calendar</span>
        </button>
      </div>
    </div>
  );
};
