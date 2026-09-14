/**
 * Root of the CreatorOS single-page app.
 *
 * `App` wraps everything in the {@link AppProvider} global store, while
 * `MainAppContent` reads the active tab and renders the matching view, hosts
 * the shared modals, and shows the global toast. Layout is responsive via
 * Tailwind breakpoints (see BottomNav for the mobile-width navigation).
 */
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthGate } from './components/AuthGate';
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
import { ProfileView } from './components/ProfileView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/** App shell: header, active view, bottom nav, global modals, and toast. */
const MainAppContent: React.FC = () => {
  const { activeTab, toast } = useApp();

  /** Map the active tab to its view component. */
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
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col selection:bg-pink-500 selection:text-white font-sans antialiased">
      {/* App Header */}
      <Header />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        <div className="w-full">{renderActiveView()}</div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav />

      {/* Global Modals & Overlays */}
      <PostPreviewModal />
      <ScheduleModal />
      <TrendModal />
      <ConnectedAccountsModal />
      <ProfileView />

      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xl bg-[var(--bg-surface-95)] ${
              toast.type === 'success'
                ? 'border-emerald-500/40 text-emerald-300'
                : toast.type === 'error'
                ? 'border-red-500/40 text-red-300'
                : 'border-[var(--accent-40)] text-[var(--accent)]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[var(--accent)]" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/** Application root: provides the global store to the app shell. */
export function App() {
  return (
    <AuthGate>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthGate>
  );
}

export default App;
