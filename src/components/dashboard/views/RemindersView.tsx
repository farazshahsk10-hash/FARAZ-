import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import type { ReminderItem } from '../../../types';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';

export function RemindersView() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Focus');
  const [timeOfDay, setTimeOfDay] = useState('09:00');

  async function loadReminders() {
    setLoading(true);
    try {
      const res = await apiFetch<{ reminders: ReminderItem[] }>('/api/reminders');
      setReminders(res.reminders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReminders();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    await apiFetch('/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), type, timeOfDay }),
    });
    setTitle('');
    await loadReminders();
  }

  async function handleAiSuggest() {
    setSuggesting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch<{ addedCount: number; reminders: ReminderItem[] }>('/api/reminders/suggest', {
        method: 'POST',
      });
      setReminders(res.reminders);
      setNotice(`Added ${res.addedCount} AI-timed reminders tailored to your routine and tasks.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI is waking up, try again in a minute.');
    } finally {
      setSuggesting(false);
    }
  }

  async function toggleReminder(rem: ReminderItem) {
    await apiFetch(`/api/reminders/${rem.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !rem.enabled }),
    });
    await loadReminders();
  }

  async function deleteReminder(id: string) {
    await apiFetch(`/api/reminders/${id}`, { method: 'DELETE' });
    await loadReminders();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#3B2A1E]">AI-Powered Daily Reminders</h1>
          <p className="text-sm text-[#7A6A58]">
            Keep focus sessions, prayer, hydration, and exercise on schedule with smart timing.
          </p>
        </div>
        <Button onClick={handleAiSuggest} disabled={suggesting}>
          {suggesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing Schedule...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Suggest Smart Reminders
            </>
          )}
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]">
          {error}
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2 rounded-[0.625rem] border border-[#5F7A5A]/35 bg-[#5F7A5A]/12 px-4 py-3 text-sm font-medium text-[#5F7A5A]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-[#9E2B25]" />
            Add Daily Reminder
          </CardTitle>
          <CardDescription>Create a custom daily alert for focus, prayer, exercise, or review.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-12">
            <Input
              className="sm:col-span-5"
              placeholder="e.g., Wrap up work and plan tomorrow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="Reminder type"
              className="sm:col-span-3 flex min-h-[44px] sm:min-h-[40px] rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
            >
              <option value="Focus">Focus</option>
              <option value="Prayer">Prayer</option>
              <option value="Exercise">Exercise</option>
              <option value="Wellness">Wellness</option>
              <option value="Review">Review</option>
            </select>
            <Input
              type="time"
              className="sm:col-span-2"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              aria-label="Time of day"
            />
            <Button type="submit" className="sm:col-span-2" disabled={!title.trim()}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active &amp; Scheduled Reminders ({reminders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
            </div>
          ) : reminders.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#7A6A58]">
              No reminders yet. Add one above or click “AI Suggest Smart Reminders”.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {reminders.map((rem) => (
                <li
                  key={rem.id}
                  className="flex items-start justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/75 px-4 py-3"
                >
                  <label className="flex flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={rem.enabled}
                      onChange={() => toggleReminder(rem)}
                      className="mt-1 h-4 w-4 accent-[#9E2B25]"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold tabular-nums text-[#9E2B25]">
                          {rem.timeOfDay}
                        </span>
                        <span className={`text-sm font-semibold ${rem.enabled ? 'text-[#3B2A1E]' : 'line-through text-[#7A6A58]'}`}>
                          {rem.title}
                        </span>
                        <Badge variant="default">{rem.type}</Badge>
                      </div>
                      {rem.aiReason && (
                        <p className="text-xs text-[#7A6A58]">AI timing reason: {rem.aiReason}</p>
                      )}
                    </div>
                  </label>
                  <button
                    type="button"
                    aria-label={`Delete reminder ${rem.title}`}
                    onClick={() => deleteReminder(rem.id)}
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
    </div>
  );
}
