import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './views/DashboardView';
import { ContentLibraryView } from './views/ContentLibraryView';
import { AiAssistantView } from './views/AiAssistantView';
import { AnalyticsView } from './views/AnalyticsView';
import { TrendsView } from './views/TrendsView';
import { CalendarView } from './views/CalendarView';
import { PostPreviewModal } from './components/PostPreviewModal';
import { ScheduleModal } from './components/ScheduleModal';
import { TrendModal } from './components/TrendModal';
import { ConnectedAccountsModal } from './components/ConnectedAccountsModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, isMobileDeviceView, toast } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'content':
        return <ContentLibraryView />;
      case 'ai':
        return <AiAssistantView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'trends':
        return <TrendsView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d17] text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white font-sans antialiased">
      {/* App Header */}
      <Header />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {isMobileDeviceView ? (
          /* Phone device container simulation mode for pixel-perfect mobile view */
          <div className="flex justify-center py-2">
            <div className="w-full max-w-[430px] min-h-[844px] bg-[#0b0d17] rounded-[42px] border-[8px] border-[#222744] shadow-2xl shadow-pink-950/30 p-4 sm:p-5 relative overflow-hidden flex flex-col">
              {/* Dynamic Island / Notch */}
              <div className="w-28 h-4 bg-[#222744] rounded-full mx-auto mb-4 flex-shrink-0" />
              <div className="flex-1 overflow-y-auto pb-16 no-scrollbar">
                {renderActiveView()}
              </div>
            </div>
          </div>
        ) : (
          /* Wide desktop layout */
          <div className="w-full">{renderActiveView()}</div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav />

      {/* Global Modals & Overlays */}
      <PostPreviewModal />
      <ScheduleModal />
      <TrendModal />
      <ConnectedAccountsModal />

      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-[#131627]/95 border-emerald-500/40 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-[#131627]/95 border-red-500/40 text-red-300'
                : 'bg-[#131627]/95 border-pink-500/40 text-pink-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-pink-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
