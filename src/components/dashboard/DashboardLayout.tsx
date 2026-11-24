import React, { useState } from 'react';
import {
  Bell,
  Bot,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Settings,
  Target,
  TrendingUp,
  WandSparkles,
  X,
} from 'lucide-react';
import { apiFetch, setClientSessionToken } from '../../lib/api';
import type { AuthUser } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { AssistantView } from './views/AssistantView';
import { HabitsView } from './views/HabitsView';
import { OverviewView, type DashboardTab } from './views/OverviewView';
import { PlanningViews } from './views/PlanningViews';
import { ProfileSettingsView } from './views/ProfileAndSettingsViews';
import { ProgressView } from './views/ProgressView';
import { RemindersView } from './views/RemindersView';
import { RoutineView } from './views/RoutineView';
import { SmartTasksView } from './views/SmartTasksView';

interface DashboardLayoutProps {
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
  onSignedOut: () => void;
}

const NAV_ITEMS: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'routine', label: 'Daily Routine Plan', icon: WandSparkles },
  { id: 'weekly', label: 'Weekly Plan', icon: CalendarDays },
  { id: 'monthly', label: 'Monthly Plan', icon: CalendarRange },
  { id: 'yearly', label: 'Yearly Plan', icon: Target },
  { id: 'tasks', label: 'Smart Task Builder', icon: ListTodo },
  { id: 'reminders', label: 'Smart Reminders', icon: Bell },
  { id: 'habits', label: 'Habit Tracker', icon: CheckSquare },
  { id: 'productivity', label: 'Productivity Report', icon: TrendingUp },
  { id: 'assistant', label: 'AI Coach', icon: Bot },
  { id: 'settings', label: 'Personalize & Profile', icon: Settings },
];

const MOBILE_APP_TABS: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'routine', label: 'Routine', icon: WandSparkles },
  { id: 'weekly', label: 'Plans', icon: CalendarDays },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'productivity', label: 'Progress', icon: TrendingUp },
];

const VALID_TABS = new Set<DashboardTab>(NAV_ITEMS.map((item) => item.id));

export function DashboardLayout({ user, onUserUpdated, onSignedOut }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('view') as DashboardTab | null;
      if (param && VALID_TABS.has(param)) return param;
    }
    return 'overview';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    try {
      await apiFetch('/api/auth/signout', { method: 'POST' });
    } finally {
      setClientSessionToken(null);
      onSignedOut();
    }
  }

  function navigateTo(tab: DashboardTab) {
    setActiveTab(tab);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between dark-balochi-glow relative text-[#FAF7F0]">
      <div className="balochi-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative flex flex-col overflow-y-auto px-3 py-5">
        <div className="mb-6 flex items-center justify-between px-3">
          <div>
            <p className="font-display text-lg font-extrabold tracking-tight text-[#FAF7F0]">
              FARAZ AI
            </p>
            <p className="text-[11px] text-[#C89B5A]">Daily Routine &amp; Focus</p>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[0.625rem] text-[#FAF7F0] hover:bg-white/10 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Dashboard navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`flex min-h-[42px] w-full items-center gap-3 rounded-[0.625rem] px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#9E2B25] text-[#FAF7F0] shadow-sm'
                    : 'text-[#FAF7F0]/80 hover:bg-white/10 hover:text-[#FAF7F0]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#FAF7F0]' : 'text-[#C89B5A]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="relative space-y-2.5 border-t border-white/15 p-4">
        <div className="px-2">
          <p className="truncate text-sm font-semibold text-[#FAF7F0]">{user.name}</p>
          <p className="truncate text-xs text-[#FAF7F0]/65">{user.email}</p>
        </div>
        <PWAInstallButton variant="sidebar" />
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-[42px] w-full items-center gap-2.5 rounded-[0.625rem] border border-white/15 px-3 py-2 text-sm font-medium text-[#FAF7F0]/90 hover:bg-white/10 cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-[#C89B5A]" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FAF7F0] text-[#3B2A1E]">
      <aside className="hidden w-[260px] shrink-0 border-r border-[#C89B5A]/20 bg-[#2E1F16] lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#2E1F16]/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full w-[272px] bg-[#2E1F16] shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E5D9C3] bg-[#FFFDF8]/95 px-4 py-3 backdrop-blur-xs lg:hidden">
          <button
            type="button"
            aria-label="Open navigation sidebar"
            onClick={() => setMobileOpen(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] text-[#3B2A1E] cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-base font-extrabold tracking-tight text-[#3B2A1E]">
            FARAZ AI
          </span>
          <div className="flex items-center gap-2">
            <PWAInstallButton variant="mobileHeader" />
            <span className="text-xs font-medium text-[#7A6A58] truncate max-w-[90px]">
              {user.name.split(/\s+/)[0]}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
          {activeTab === 'overview' && (
            <OverviewView user={user} onUserUpdated={onUserUpdated} onNavigate={navigateTo} />
          )}
          {activeTab === 'routine' && <RoutineView />}
          {activeTab === 'weekly' && <PlanningViews period="weekly" onNavigate={navigateTo} />}
          {activeTab === 'monthly' && <PlanningViews period="monthly" onNavigate={navigateTo} />}
          {activeTab === 'yearly' && <PlanningViews period="yearly" onNavigate={navigateTo} />}
          {activeTab === 'tasks' && <SmartTasksView />}
          {activeTab === 'reminders' && <RemindersView />}
          {activeTab === 'habits' && <HabitsView />}
          {activeTab === 'productivity' && <ProgressView />}
          {activeTab === 'assistant' && <AssistantView />}
          {activeTab === 'settings' && <ProfileSettingsView onUserUpdated={onUserUpdated} />}
        </main>

        {/* Mobile App Bottom Navigation Bar */}
        <nav
          aria-label="Mobile app tabs"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#E5D9C3] bg-[#FFFDF8]/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        >
          {MOBILE_APP_TABS.map((item) => {
            const Icon = item.icon;
            const isPlansGroup =
              item.id === 'weekly' &&
              (activeTab === 'weekly' || activeTab === 'monthly' || activeTab === 'yearly');
            const active = activeTab === item.id || isPlansGroup;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  active ? 'text-[#9E2B25]' : 'text-[#7A6A58] hover:text-[#3B2A1E]'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#9E2B25]' : 'text-[#7A6A58]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
