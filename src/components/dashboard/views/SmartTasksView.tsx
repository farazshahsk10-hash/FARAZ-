import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ListTodo, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import type { TaskItem } from '../../../types';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';

export function SmartTasksView() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual Smart Task Form
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [category, setCategory] = useState('Focus');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  // AI Breakdown Form
  const [bigTaskTitle, setBigTaskTitle] = useState('');
  const [bigTaskContext, setBigTaskContext] = useState('');
  const [breakingDown, setBreakingDown] = useState(false);
  const [breakdownNotice, setBreakdownNotice] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await apiFetch<{ tasks: TaskItem[] }>('/api/tasks');
      setTasks(res.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          priority,
          period,
          category,
          estimatedMinutes: Number(estimatedMinutes) || 30,
          dueDate,
        }),
      });
      setTitle('');
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add task.');
    } finally {
      setSaving(false);
    }
  }

  async function handleBreakdown(e: React.FormEvent) {
    e.preventDefault();
    if (!bigTaskTitle.trim()) return;
    setBreakingDown(true);
    setError(null);
    setBreakdownNotice(null);
    try {
      const res = await apiFetch<{ createdCount: number; tasks: TaskItem[] }>('/api/tasks/breakdown', {
        method: 'POST',
        body: JSON.stringify({
          taskTitle: bigTaskTitle.trim(),
          context: bigTaskContext.trim(),
        }),
      });
      setTasks(res.tasks);
      setBreakdownNotice(`Created ${res.createdCount} actionable sub-tasks from "${bigTaskTitle.trim()}".`);
      setBigTaskTitle('');
      setBigTaskContext('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI is waking up, try again in a minute.');
    } finally {
      setBreakingDown(false);
    }
  }

  async function toggleTask(task: TaskItem) {
    await apiFetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !task.completed }),
    });
    await loadTasks();
  }

  async function deleteTask(id: string) {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    await loadTasks();
  }

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'open' && t.completed) return false;
    if (statusFilter === 'done' && !t.completed) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (periodFilter !== 'all' && (t.period || 'daily') !== periodFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#3B2A1E]">Smart Task Builder</h1>
        <p className="text-sm text-[#7A6A58]">
          Organize daily tasks by priority and time estimate, or let AI break any large task into small steps.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]">
          {error}
        </div>
      )}

      {breakdownNotice && (
        <div className="flex items-center gap-2 rounded-[0.625rem] border border-[#5F7A5A]/35 bg-[#5F7A5A]/12 px-4 py-3 text-sm font-medium text-[#5F7A5A]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {breakdownNotice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Manual Smart Task Form */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="h-4 w-4 text-[#9E2B25]" />
              Create Smart Task
            </CardTitle>
            <CardDescription>Add a clear task with priority and estimated minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTask} className="space-y-3">
              <Input
                placeholder="What needs to get done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div className="grid gap-2.5 sm:grid-cols-5">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  aria-label="Plan period"
                  className="flex min-h-[44px] sm:min-h-[40px] rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
                >
                  <option value="daily">Daily Plan</option>
                  <option value="weekly">Weekly Plan</option>
                  <option value="monthly">Monthly Plan</option>
                  <option value="yearly">Yearly Plan</option>
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  aria-label="Priority"
                  className="flex min-h-[44px] sm:min-h-[40px] rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
                >
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Category"
                  className="flex min-h-[44px] sm:min-h-[40px] rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
                >
                  <option value="Focus">Focus</option>
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Admin">Admin</option>
                  <option value="Health">Health</option>
                </select>
                <Input
                  type="number"
                  min={5}
                  max={360}
                  step={5}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  aria-label="Estimated minutes"
                  placeholder="Minutes"
                />
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  aria-label="Due date"
                />
              </div>
              <Button type="submit" disabled={saving || !title.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Task
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Task Breakdown */}
        <Card className="border-[#C89B5A]/45 bg-[#F3ECDF] lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-[#9E2B25]" />
              AI Task Breakdown
            </CardTitle>
            <CardDescription>
              Overwhelmed by a big task? Let AI split it into small 15–45 min steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBreakdown} className="space-y-3">
              <Input
                placeholder="e.g., Prepare presentation for Monday class"
                value={bigTaskTitle}
                onChange={(e) => setBigTaskTitle(e.target.value)}
                required
              />
              <Input
                placeholder="Optional details (e.g., 10 slides, needs examples)"
                value={bigTaskContext}
                onChange={(e) => setBigTaskContext(e.target.value)}
              />
              <Button type="submit" variant="dark" className="w-full" disabled={breakingDown || !bigTaskTitle.trim()}>
                {breakingDown ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Breaking down...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Break Down with AI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Organized Task List */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Organized Tasks ({filteredTasks.length})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-[0.625rem] border border-[#E5D9C3] bg-[#F3ECDF] p-0.5 text-xs font-medium">
              {(['all', 'open', 'done'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-[0.45rem] px-2.5 py-1 capitalize cursor-pointer ${
                    statusFilter === st ? 'bg-[#FFFDF8] text-[#3B2A1E] shadow-xs' : 'text-[#7A6A58]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
              aria-label="Filter by priority"
              className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-2.5 py-1 text-xs font-medium text-[#3B2A1E]"
            >
              <option value="all">All priorities</option>
              <option value="high">High only</option>
              <option value="medium">Medium only</option>
              <option value="low">Low only</option>
            </select>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly')}
              aria-label="Filter by plan period"
              className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-2.5 py-1 text-xs font-medium text-[#3B2A1E]"
            >
              <option value="all">All plans</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#7A6A58]">No tasks match this filter.</p>
          ) : (
            <ul className="space-y-2">
              {filteredTasks.map((task) => {
                const badgeVariant =
                  task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'gold' : 'default';
                return (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/70 px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className="flex flex-1 items-start gap-3 text-left cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#5F7A5A] shrink-0" />
                      ) : (
                        <Circle className="mt-0.5 h-5 w-5 text-[#7A6A58] shrink-0" />
                      )}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-semibold ${task.completed ? 'line-through text-[#7A6A58]' : 'text-[#3B2A1E]'}`}>
                            {task.title}
                          </span>
                          <Badge variant={badgeVariant}>{task.priority}</Badge>
                          <Badge className="capitalize">{task.period || 'daily'}</Badge>
                        </div>
                        <p className="text-xs text-[#7A6A58] tabular-nums">
                          {task.category} · {task.estimatedMinutes} min
                          {task.dueDate ? ` · Due ${task.dueDate}` : ''}
                          {task.notes ? ` · ${task.notes}` : ''}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete task ${task.title}`}
                      onClick={() => deleteTask(task.id)}
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[0.625rem] text-[#7A6A58] hover:bg-[#9E2B25]/10 hover:text-[#9E2B25] cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
