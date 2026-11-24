import React, { useEffect, useState } from 'react';
import { Check, CheckSquare, Loader2, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import type { HabitItem } from '../../../types';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function HabitsView() {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Education');

  const last7 = getLast7Days();

  async function loadHabits() {
    setLoading(true);
    try {
      const res = await apiFetch<{ habits: HabitItem[] }>('/api/habits');
      setHabits(res.habits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habits.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHabits();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await apiFetch('/api/habits', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), category }),
    });
    setName('');
    await loadHabits();
  }

  async function toggleDay(habitId: string, date: string) {
    await apiFetch(`/api/habits/${habitId}/log`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
    await loadHabits();
  }

  async function deleteHabit(id: string) {
    await apiFetch(`/api/habits/${id}`, { method: 'DELETE' });
    await loadHabits();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#3B2A1E]">Habit Tracker</h1>
        <p className="text-sm text-[#7A6A58]">
          Click any day cell to log or unlog a real daily habit completion.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="h-4 w-4 text-[#9E2B25]" />
            Add New Habit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-12">
            <Input
              className="sm:col-span-7"
              placeholder="e.g., 30 minutes English reading"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Habit category"
              className="sm:col-span-3 flex min-h-[44px] sm:min-h-[40px] rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
            >
              <option value="Education">Education</option>
              <option value="English">English</option>
              <option value="Coding">Coding</option>
              <option value="Health">Health</option>
              <option value="Faith">Faith &amp; Mindfulness</option>
            </select>
            <Button type="submit" className="sm:col-span-2" disabled={!name.trim()}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">7-Day Consistency Grid</CardTitle>
          <CardDescription>Last 7 calendar days ending today.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
            </div>
          ) : habits.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#7A6A58]">No habits added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5D9C3] text-xs text-[#7A6A58]">
                    <th className="py-2.5 pr-4 font-semibold">Habit</th>
                    {last7.map((d) => (
                      <th key={d} className="px-2 py-2.5 text-center font-mono tabular-nums">
                        {d.slice(5)}
                      </th>
                    ))}
                    <th className="py-2.5 pl-2 text-right font-semibold">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D9C3]">
                  {habits.map((habit) => {
                    const completedSet = new Set(habit.logs.filter((l) => l.completed).map((l) => l.date));
                    return (
                      <tr key={habit.id}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-[#3B2A1E]">{habit.name}</p>
                          <p className="text-xs text-[#7A6A58]">{habit.category}</p>
                        </td>
                        {last7.map((d) => {
                          const done = completedSet.has(d);
                          return (
                            <td key={d} className="px-2 py-3 text-center">
                              <button
                                type="button"
                                aria-label={`Toggle ${habit.name} on ${d}`}
                                onClick={() => toggleDay(habit.id, d)}
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-[0.5rem] border transition-colors cursor-pointer ${
                                  done
                                    ? 'border-[#5F7A5A] bg-[#5F7A5A] text-white'
                                    : 'border-[#E5D9C3] bg-[#FAF7F0] text-transparent hover:border-[#9E2B25]'
                                }`}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </td>
                          );
                        })}
                        <td className="py-3 pl-2 text-right">
                          <button
                            type="button"
                            aria-label={`Delete habit ${habit.name}`}
                            onClick={() => deleteHabit(habit.id)}
                            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[0.625rem] text-[#7A6A58] hover:bg-[#9E2B25]/10 hover:text-[#9E2B25] cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
