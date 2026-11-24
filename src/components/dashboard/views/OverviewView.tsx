import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Target,
  Timer,
  TrendingUp,
  WandSparkles,
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import type {
  AuthUser,
  GoalItem,
  MissingWorkspaceItem,
  ReminderItem,
  RoutineBlockItem,
  TaskItem,
} from '../../../types';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import { Input } from '../../ui/input';

export type DashboardTab =
  | 'overview'
  | 'routine'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'tasks'
  | 'reminders'
  | 'habits'
  | 'productivity'
  | 'assistant'
  | 'settings';

interface DashboardData {
  user: AuthUser;
  missingItems: MissingWorkspaceItem[];
  stats: {
    tasksTotal: number;
    tasksCompleted: number;
    routineTotal: number;
    routineCompleted: number;
    remindersActive: number;
    habitsCompletedToday: number;
    habitsTotal: number;
    goalsCompleted: number;
    goalsTotal: number;
    weeklyTasksCount: number;
    monthlyCount: number;
    yearlyCount: number;
    streak: number;
    reportsCount: number;
    latestRating: number | null;
    latestFocusHours: number;
  };
  routineBlocks: RoutineBlockItem[];
  tasks: TaskItem[];
  reminders: ReminderItem[];
  goals: GoalItem[];
}

interface OverviewViewProps {
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
  onNavigate: (tab: DashboardTab) => void;
}

const ALL_WIDGETS = [
  { id: 'focus', label: 'Focus Timer' },
  { id: 'routine', label: "Today's Routine" },
  { id: 'tasks', label: 'Priority Tasks' },
  { id: 'reminders', label: 'Smart Reminders' },
  { id: 'goals', label: 'Progress & Goals' },
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function OverviewView({ user, onUserUpdated, onNavigate }: OverviewViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Built-in Focus Timer state
  const [presetMinutes, setPresetMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Dashboard Personalization state
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const initialWidgets = (user.settings?.dashboardWidgets || 'focus,routine,tasks,reminders,habits,goals')
    .split(',')
    .filter(Boolean);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(initialWidgets);
  const [focusMotto, setFocusMotto] = useState(user.settings?.focusMotto || 'One focused block at a time.');
  const [focusTarget, setFocusTarget] = useState(String(user.settings?.dailyFocusTargetHours ?? 4));

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<DashboardData>('/api/dashboard');
      setData(res);
      if (res.user?.settings) {
        setSelectedWidgets(res.user.settings.dashboardWidgets.split(',').filter(Boolean));
        setFocusMotto(res.user.settings.focusMotto);
        setFocusTarget(String(res.user.settings.dailyFocusTargetHours));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  function selectTimerPreset(mins: number) {
    setTimerRunning(false);
    setPresetMinutes(mins);
    setSecondsLeft(mins * 60);
  }

  async function toggleRoutineBlock(block: RoutineBlockItem) {
    await apiFetch(`/api/routine/${block.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !block.completed }),
    });
    await loadDashboard();
  }

  async function toggleTask(task: TaskItem) {
    await apiFetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !task.completed }),
    });
    await loadDashboard();
  }

  function toggleWidget(id: string) {
    setSelectedWidgets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function savePersonalization(e: React.FormEvent) {
    e.preventDefault();
    setSavingCustom(true);
    try {
      const res = await apiFetch<{ user: AuthUser }>('/api/profile-settings', {
        method: 'PUT',
        body: JSON.stringify({
          name: user.name,
          city: user.profile?.city || 'Quetta, Balochistan, Pakistan',
          roleTitle: user.profile?.roleTitle || 'Student & Builder',
          primaryFocus: user.profile?.primaryFocus || '',
          bio: user.profile?.bio || '',
          language: user.settings?.language || 'English',
          wakeTime: user.settings?.wakeTime || '06:00',
          sleepTime: user.settings?.sleepTime || '22:30',
          dailyFocusTargetHours: Number(focusTarget) || 4,
          dashboardWidgets: selectedWidgets.join(','),
          focusMotto,
        }),
      });
      onUserUpdated(res.user);
      setCustomizeOpen(false);
      await loadDashboard();
    } finally {
      setSavingCustom(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#9E2B25]" />
      </div>
    );
  }

  const stats = data?.stats;
  const missingItems = data?.missingItems ?? [];
  const activeWidgets = new Set(selectedWidgets);
  const nowHHMM = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
  const nextReminder =
    data?.reminders.find((r) => r.timeOfDay >= nowHHMM) ?? data?.reminders[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Personalized Greeting Banner */}
      <div className="relative overflow-hidden rounded-[0.625rem] dark-balochi-glow p-6 text-[#FAF7F0] shadow-sm">
        <div className="balochi-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#C89B5A]">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {getTimeGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-[#FAF7F0]/85">{focusMotto}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
              <DialogTrigger asChild>
                <Button variant="outlineLight" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Personalize Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Personalize Your Dashboard</DialogTitle>
                  <DialogDescription>
                    Choose your daily focus motto, target hours, and which widgets appear on your home view.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={savePersonalization} className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="motto-input" className="block text-xs font-semibold text-[#3B2A1E]">
                      Personal Focus Motto
                    </label>
                    <Input
                      id="motto-input"
                      value={focusMotto}
                      onChange={(e) => setFocusMotto(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="target-hours-input" className="block text-xs font-semibold text-[#3B2A1E]">
                      Daily Focus Target (hours)
                    </label>
                    <Input
                      id="target-hours-input"
                      type="number"
                      min={0.5}
                      max={16}
                      step={0.5}
                      value={focusTarget}
                      onChange={(e) => setFocusTarget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#3B2A1E]">Visible Dashboard Widgets</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_WIDGETS.map((w) => (
                        <label
                          key={w.id}
                          className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] px-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedWidgets.includes(w.id)}
                            onChange={() => toggleWidget(w.id)}
                            className="h-4 w-4 accent-[#9E2B25]"
                          />
                          <span>{w.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={savingCustom}>
                    {savingCustom ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save Dashboard Layout
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button size="sm" onClick={() => onNavigate('routine')}>
              <WandSparkles className="h-4 w-4" />
              AI Routine Planner
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]">
          {error}
        </div>
      )}

      {/* Missing Items / Setup Checklist for New & Returning Users */}
      {missingItems.length > 0 && (
        <Card className="border-[#C89B5A] bg-[#FFFDF8]">
          <CardHeader className="pb-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#9E2B25] shrink-0" />
                <CardTitle className="text-base">
                  Something is missing in your workspace ({missingItems.length})
                </CardTitle>
              </div>
              <span className="text-xs font-medium text-[#7A6A58]">
                Click any item below to add it right now
              </span>
            </div>
            <CardDescription>
              Complete these missing plans and sections so your daily schedule and Progress Report stay accurate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {missingItems.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-3.5"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#3B2A1E]">{item.title}</p>
                    <p className="text-xs leading-relaxed text-[#7A6A58]">{item.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-between border-[#9E2B25]/30 text-[#9E2B25] hover:bg-[#9E2B25] hover:text-white"
                    onClick={() => onNavigate(item.targetTab)}
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      {item.actionLabel}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily, Weekly, Monthly, Yearly Plan Quick Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate('routine')}
          className="flex items-center justify-between rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-4 text-left hover:border-[#9E2B25]/45 hover:shadow-sm transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-[#9E2B25]">Daily Plan</p>
            <p className="font-display text-lg font-bold tabular-nums text-[#3B2A1E]">
              {stats?.routineTotal ?? 0} blocks
            </p>
          </div>
          <Clock className="h-5 w-5 text-[#C89B5A]" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('weekly')}
          className="flex items-center justify-between rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-4 text-left hover:border-[#9E2B25]/45 hover:shadow-sm transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-[#9E2B25]">Weekly Plan</p>
            <p className="font-display text-lg font-bold tabular-nums text-[#3B2A1E]">
              {stats?.weeklyTasksCount ?? 0} tasks
            </p>
          </div>
          <CalendarDays className="h-5 w-5 text-[#C89B5A]" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('monthly')}
          className="flex items-center justify-between rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-4 text-left hover:border-[#9E2B25]/45 hover:shadow-sm transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-[#9E2B25]">Monthly Plan</p>
            <p className="font-display text-lg font-bold tabular-nums text-[#3B2A1E]">
              {stats?.monthlyCount ?? 0} items
            </p>
          </div>
          <CalendarRange className="h-5 w-5 text-[#C89B5A]" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('yearly')}
          className="flex items-center justify-between rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-4 text-left hover:border-[#9E2B25]/45 hover:shadow-sm transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-[#9E2B25]">Yearly Plan</p>
            <p className="font-display text-lg font-bold tabular-nums text-[#3B2A1E]">
              {stats?.yearlyCount ?? 0} goals
            </p>
          </div>
          <Target className="h-5 w-5 text-[#C89B5A]" />
        </button>
      </div>

      {/* Next Smart Reminder Strip */}
      {nextReminder && (
        <div className="flex flex-col justify-between gap-2 rounded-[0.625rem] border border-[#C89B5A]/45 bg-[#FFFDF8] px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-[#9E2B25] shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-[#3B2A1E]">Next reminder at {nextReminder.timeOfDay}:</span>{' '}
              <span className="text-[#3B2A1E]">{nextReminder.title}</span>
              {nextReminder.aiReason ? (
                <span className="text-xs text-[#7A6A58]"> — {nextReminder.aiReason}</span>
              ) : null}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate('reminders')}>
            Manage Reminders
          </Button>
        </div>
      )}

      {/* Quick Productivity KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Routine Blocks</CardDescription>
            <CardTitle className="font-display text-2xl font-extrabold tabular-nums text-[#3B2A1E]">
              {stats?.routineCompleted ?? 0} / {stats?.routineTotal ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[#7A6A58]">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Smart Tasks</CardDescription>
            <CardTitle className="font-display text-2xl font-extrabold tabular-nums text-[#9E2B25]">
              {stats?.tasksCompleted ?? 0} / {stats?.tasksTotal ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[#7A6A58]">Tasks checked off</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Daily Habits</CardDescription>
            <CardTitle className="font-display text-2xl font-extrabold tabular-nums text-[#5F7A5A]">
              {stats?.habitsCompletedToday ?? 0} / {stats?.habitsTotal ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[#7A6A58]">Logged today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progress Streak</CardDescription>
            <CardTitle className="flex items-center gap-2 font-display text-2xl font-extrabold tabular-nums text-[#B07A3F]">
              <Flame className="h-5 w-5 text-[#9E2B25]" />
              {stats?.streak ?? 0} days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[#7A6A58] tabular-nums">
              {stats?.reportsCount ?? 0} reports logged · Target {focusTarget}h/day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Widget Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {activeWidgets.has('focus') && (
          <Card className="lg:col-span-5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4 text-[#9E2B25]" />
                Time Management Focus Timer
              </CardTitle>
              <CardDescription>Stay locked into one block without context switching.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] py-6">
                <span className="font-mono text-4xl font-bold tabular-nums text-[#3B2A1E]">
                  {formatTimer(secondsLeft)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[15, 25, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => selectTimerPreset(mins)}
                    className={`min-h-[36px] rounded-[0.5rem] border px-3 text-xs font-semibold cursor-pointer ${
                      presetMinutes === mins
                        ? 'border-[#9E2B25] bg-[#9E2B25]/10 text-[#9E2B25]'
                        : 'border-[#E5D9C3] bg-[#FFFDF8] text-[#7A6A58] hover:bg-[#F3ECDF]'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setTimerRunning((r) => !r)}>
                  {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {timerRunning ? 'Pause' : 'Start Focus'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectTimerPreset(presetMinutes)}
                  aria-label="Reset focus timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeWidgets.has('routine') && (
          <Card className={activeWidgets.has('focus') ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-[#9E2B25]" />
                  Today’s Routine
                </CardTitle>
                <CardDescription>Your active time-blocked daily schedule.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate('routine')}>
                Customize
              </Button>
            </CardHeader>
            <CardContent>
              {(!data?.routineBlocks || data.routineBlocks.length === 0) ? (
                <div className="rounded-[0.625rem] border border-dashed border-[#E5D9C3] bg-[#FAF7F0] p-6 text-center">
                  <p className="text-sm font-medium text-[#3B2A1E]">No routine blocks yet.</p>
                  <Button size="sm" className="mt-3" onClick={() => onNavigate('routine')}>
                    Build with AI
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.routineBlocks.map((block) => (
                    <li
                      key={block.id}
                      className="flex items-center justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/80 px-3.5 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => toggleRoutineBlock(block)}
                        className="flex flex-1 items-center gap-3 text-left cursor-pointer"
                      >
                        {block.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-[#5F7A5A] shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#7A6A58] shrink-0" />
                        )}
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#9E2B25] shrink-0">
                          {block.startTime} – {block.endTime}
                        </span>
                        <span className={`text-sm font-medium truncate ${block.completed ? 'line-through text-[#7A6A58]' : 'text-[#3B2A1E]'}`}>
                          {block.title}
                        </span>
                      </button>
                      <span className="text-xs text-[#7A6A58] shrink-0">{block.category}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {activeWidgets.has('tasks') && (
          <Card className="lg:col-span-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Priority Tasks</CardTitle>
                <CardDescription>Organized daily action items.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate('tasks')}>
                Task Builder
              </Button>
            </CardHeader>
            <CardContent>
              {(!data?.tasks || data.tasks.length === 0) ? (
                <p className="py-4 text-center text-sm text-[#7A6A58]">No tasks yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/70 px-3.5 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task)}
                        className="flex flex-1 items-center gap-3 text-left cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-[#5F7A5A] shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#7A6A58] shrink-0" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${task.completed ? 'line-through text-[#7A6A58]' : 'text-[#3B2A1E]'}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-[#7A6A58] tabular-nums">
                            {task.period} · {task.priority.toUpperCase()} · {task.estimatedMinutes} min
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6 lg:col-span-6">
          {activeWidgets.has('goals') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-[#9E2B25]" />
                    Productivity Report Summary
                  </CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => onNavigate('productivity')}>
                  Full Report
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-3">
                    <p className="text-xs text-[#7A6A58]">Latest Rating</p>
                    <p className="font-display text-lg font-bold tabular-nums text-[#9E2B25]">
                      {stats?.latestRating !== null && stats?.latestRating !== undefined
                        ? `${stats.latestRating} / 10`
                        : 'Not logged'}
                    </p>
                  </div>
                  <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-3">
                    <p className="text-xs text-[#7A6A58]">Latest Focus</p>
                    <p className="font-display text-lg font-bold tabular-nums text-[#3B2A1E]">
                      {stats?.latestFocusHours ?? 0} hrs
                    </p>
                  </div>
                </div>
                {data?.goals && data.goals.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {data.goals.map((g) => (
                      <div key={g.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#3B2A1E]">{g.title}</span>
                          <span className="font-mono font-semibold tabular-nums text-[#9E2B25]">
                            {g.progress}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3ECDF]">
                          <div className="h-full rounded-full bg-[#9E2B25]" style={{ width: `${g.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeWidgets.has('reminders') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-[#9E2B25]" />
                  Need Time Management Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#7A6A58]">
                  Ask your AI Coach how to reorganize today’s remaining tasks without burnout.
                </p>
                <Button variant="secondary" size="sm" onClick={() => onNavigate('assistant')}>
                  Open Coach
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
