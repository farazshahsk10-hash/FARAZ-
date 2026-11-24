import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import type { CycleReviewItem, MonthlyObjectiveItem, TaskItem, YearlyGoalItem } from '../../../types';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input, Textarea } from '../../ui/input';
import type { DashboardTab } from './OverviewView';

interface PlanningViewsProps {
  period: 'weekly' | 'monthly' | 'yearly';
  onNavigate: (tab: DashboardTab) => void;
}

export function PlanningViews({ period, onNavigate }: PlanningViewsProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [objectives, setObjectives] = useState<MonthlyObjectiveItem[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoalItem[]>([]);
  const [reviews, setReviews] = useState<CycleReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [objTitle, setObjTitle] = useState('');
  const [yearlyTitle, setYearlyTitle] = useState('');
  const [yearlyMilestone, setYearlyMilestone] = useState('');
  const [reviewLabel, setReviewLabel] = useState('');
  const [reviewWins, setReviewWins] = useState('');
  const [reviewNext, setReviewNext] = useState('');

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, planRes] = await Promise.all([
        apiFetch<{ tasks: TaskItem[] }>(`/api/tasks?period=${period}`),
        apiFetch<{
          monthlyObjectives: MonthlyObjectiveItem[];
          yearlyGoals: YearlyGoalItem[];
          cycleReviews: CycleReviewItem[];
        }>('/api/planning'),
      ]);
      setTasks(tasksRes.tasks);
      setObjectives(planRes.monthlyObjectives);
      setYearlyGoals(planRes.yearlyGoals);
      setReviews(planRes.cycleReviews.filter((r) => r.periodType === period));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [period]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: taskTitle.trim(),
        period,
        dueDate: taskDue || null,
        category: period === 'weekly' ? 'Weekly Focus' : period === 'monthly' ? 'Monthly Goal' : 'Yearly Milestone',
      }),
    });
    setTaskTitle('');
    setTaskDue('');
    await loadAll();
  }

  async function toggleTask(task: TaskItem) {
    await apiFetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !task.completed }),
    });
    await loadAll();
  }

  async function deleteTask(id: string) {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  async function handleAddObjective(e: React.FormEvent) {
    e.preventDefault();
    if (!objTitle.trim()) return;
    await apiFetch('/api/objectives', {
      method: 'POST',
      body: JSON.stringify({
        title: objTitle.trim(),
        month: new Date().toISOString().slice(0, 7),
      }),
    });
    setObjTitle('');
    await loadAll();
  }

  async function toggleObjective(obj: MonthlyObjectiveItem) {
    await apiFetch(`/api/objectives/${obj.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !obj.completed }),
    });
    await loadAll();
  }

  async function deleteObjective(id: string) {
    await apiFetch(`/api/objectives/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  async function handleAddYearlyGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!yearlyTitle.trim()) return;
    await apiFetch('/api/yearly-goals', {
      method: 'POST',
      body: JSON.stringify({
        title: yearlyTitle.trim(),
        milestone: yearlyMilestone.trim(),
        year: new Date().getFullYear(),
      }),
    });
    setYearlyTitle('');
    setYearlyMilestone('');
    await loadAll();
  }

  async function toggleYearlyGoal(goal: YearlyGoalItem) {
    await apiFetch(`/api/yearly-goals/${goal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !goal.completed }),
    });
    await loadAll();
  }

  async function deleteYearlyGoal(id: string) {
    await apiFetch(`/api/yearly-goals/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewLabel.trim() || !reviewWins.trim()) return;
    await apiFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        periodType: period,
        periodLabel: reviewLabel.trim(),
        wins: reviewWins.trim(),
        nextFocus: reviewNext.trim(),
      }),
    });
    setReviewLabel('');
    setReviewWins('');
    setReviewNext('');
    await loadAll();
  }

  const headerMeta = {
    weekly: {
      icon: CalendarDays,
      title: 'Weekly Plan',
      subtitle: 'Choose your key priorities for this week and review what actually got done.',
    },
    monthly: {
      icon: CalendarRange,
      title: 'Monthly Plan',
      subtitle: 'Set monthly objectives and action tasks so your weeks move in one clear direction.',
    },
    yearly: {
      icon: Target,
      title: 'Yearly Plan',
      subtitle: 'Define your major goals and milestones for the full year.',
    },
  }[period];

  const Icon = headerMeta.icon;

  return (
    <div className="space-y-6">
      {/* Horizon Switcher */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] text-[#9E2B25]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#3B2A1E]">{headerMeta.title}</h1>
            <p className="text-sm text-[#7A6A58]">{headerMeta.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-[0.625rem] border border-[#E5D9C3] bg-[#F3ECDF] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onNavigate('routine')}
            className="rounded-[0.45rem] px-3 py-1.5 text-[#7A6A58] hover:text-[#3B2A1E] cursor-pointer"
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => onNavigate('weekly')}
            className={`rounded-[0.45rem] px-3 py-1.5 cursor-pointer ${
              period === 'weekly' ? 'bg-[#FFFDF8] text-[#9E2B25] shadow-xs' : 'text-[#7A6A58] hover:text-[#3B2A1E]'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => onNavigate('monthly')}
            className={`rounded-[0.45rem] px-3 py-1.5 cursor-pointer ${
              period === 'monthly' ? 'bg-[#FFFDF8] text-[#9E2B25] shadow-xs' : 'text-[#7A6A58] hover:text-[#3B2A1E]'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => onNavigate('yearly')}
            className={`rounded-[0.45rem] px-3 py-1.5 cursor-pointer ${
              period === 'yearly' ? 'bg-[#FFFDF8] text-[#9E2B25] shadow-xs' : 'text-[#7A6A58] hover:text-[#3B2A1E]'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]">
          {error}
        </div>
      )}

      {/* Monthly Objectives Section */}
      {period === 'monthly' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Objectives</CardTitle>
            <CardDescription>Main outcomes you want to complete this month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddObjective} className="flex gap-2">
              <Input
                placeholder="e.g., Complete 20 hours of focused study this month"
                value={objTitle}
                onChange={(e) => setObjTitle(e.target.value)}
                required
              />
              <Button type="submit" disabled={!objTitle.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </form>

            {objectives.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#7A6A58]">No monthly objectives added yet.</p>
            ) : (
              <ul className="space-y-2">
                {objectives.map((obj) => (
                  <li
                    key={obj.id}
                    className="flex items-center justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/70 px-3.5 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleObjective(obj)}
                      className="flex flex-1 items-center gap-3 text-left cursor-pointer"
                    >
                      {obj.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#5F7A5A] shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-[#7A6A58] shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${obj.completed ? 'line-through text-[#7A6A58]' : 'text-[#3B2A1E]'}`}>
                        {obj.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete objective ${obj.title}`}
                      onClick={() => deleteObjective(obj.id)}
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[0.625rem] text-[#7A6A58] hover:bg-[#9E2B25]/10 hover:text-[#9E2B25] cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Yearly Goals Section */}
      {period === 'yearly' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yearly Goals ({new Date().getFullYear()})</CardTitle>
            <CardDescription>Big milestones that guide your months and weeks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddYearlyGoal} className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <Input
                  placeholder="Yearly goal title..."
                  value={yearlyTitle}
                  onChange={(e) => setYearlyTitle(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-5">
                <Input
                  placeholder="Concrete milestone (e.g., Ship 3 portfolio projects)"
                  value={yearlyMilestone}
                  onChange={(e) => setYearlyMilestone(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full" disabled={!yearlyTitle.trim()}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </form>

            {yearlyGoals.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#7A6A58]">No yearly goals added yet.</p>
            ) : (
              <ul className="space-y-2">
                {yearlyGoals.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/70 px-3.5 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleYearlyGoal(g)}
                      className="flex flex-1 items-center gap-3 text-left cursor-pointer"
                    >
                      {g.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#5F7A5A] shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-[#7A6A58] shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${g.completed ? 'line-through text-[#7A6A58]' : 'text-[#3B2A1E]'}`}>
                          {g.title}
                        </p>
                        {g.milestone && <p className="text-xs text-[#7A6A58]">Milestone: {g.milestone}</p>}
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete goal ${g.title}`}
                      onClick={() => deleteYearlyGoal(g.id)}
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[0.625rem] text-[#7A6A58] hover:bg-[#9E2B25]/10 hover:text-[#9E2B25] cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Period Action Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{headerMeta.title} Tasks</CardTitle>
          <CardDescription>Actionable tasks assigned to your {period} plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddTask} className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-7">
              <Input
                placeholder={`Add a ${period} task...`}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-3">
              <Input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                aria-label="Target due date"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={!taskTitle.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#7A6A58]">No {period} tasks saved yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/70 px-3.5 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(t)}
                    className="flex flex-1 items-center gap-3 text-left cursor-pointer"
                  >
                    {t.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-[#5F7A5A] shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-[#7A6A58] shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${t.completed ? 'line-through text-[#7A6A58]' : 'text-[#3B2A1E]'}`}>
                        {t.title}
                      </p>
                      {t.dueDate && (
                        <p className="font-mono text-xs tabular-nums text-[#7A6A58]">Due: {t.dueDate}</p>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${t.title}`}
                    onClick={() => deleteTask(t.id)}
                    className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[0.625rem] text-[#7A6A58] hover:bg-[#9E2B25]/10 hover:text-[#9E2B25] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Period Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{headerMeta.title} Review</CardTitle>
          <CardDescription>Write down honest wins and next focus for this {period} cycle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddReview} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={
                  period === 'weekly'
                    ? 'Week label (e.g., Nov Week 4)'
                    : period === 'monthly'
                    ? 'Month (e.g., November 2026)'
                    : 'Year (e.g., 2026)'
                }
                value={reviewLabel}
                onChange={(e) => setReviewLabel(e.target.value)}
                required
              />
              <Input
                placeholder="Next cycle top priority"
                value={reviewNext}
                onChange={(e) => setReviewNext(e.target.value)}
              />
            </div>
            <Textarea
              placeholder="What went well and what needs improvement?"
              value={reviewWins}
              onChange={(e) => setReviewWins(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" disabled={!reviewLabel.trim() || !reviewWins.trim()}>
              Save Review
            </Button>
          </form>

          {reviews.length > 0 && (
            <div className="space-y-2.5 pt-2">
              {reviews.map((rev) => (
                <div key={rev.id} className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#3B2A1E]">{rev.periodLabel}</p>
                    <span className="text-xs text-[#7A6A58]">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-[#3B2A1E]">{rev.wins}</p>
                  {rev.nextFocus && (
                    <p className="mt-1 text-xs font-medium text-[#9E2B25]">Next focus: {rev.nextFocus}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
