import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, Edit3, Loader2, Plus, Trash2, WandSparkles } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import type { RoutineBlockItem } from '../../../types';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';

const CATEGORIES = ['Focus', 'Wellness', 'Health', 'Break', 'Admin'];

export function RoutineView() {
  const [blocks, setBlocks] = useState<RoutineBlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // AI Customizer Form
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepTime, setSleepTime] = useState('22:30');
  const [energyPeak, setEnergyPeak] = useState('Morning');
  const [focusBlockMinutes, setFocusBlockMinutes] = useState('60');
  const [primaryGoals, setPrimaryGoals] = useState('Deep study, focused project work, and evening exercise');
  const [includePrayerAndExercise, setIncludePrayerAndExercise] = useState(true);

  // Manual Add Form
  const [manualTitle, setManualTitle] = useState('');
  const [manualStart, setManualStart] = useState('09:00');
  const [manualEnd, setManualEnd] = useState('10:00');
  const [manualCategory, setManualCategory] = useState('Focus');

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  async function loadRoutine() {
    setLoading(true);
    try {
      const res = await apiFetch<{ blocks: RoutineBlockItem[] }>('/api/routine');
      setBlocks(res.blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily routine.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoutine();
  }, []);

  async function handleGenerateRoutine(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setAiSummary(null);
    try {
      const res = await apiFetch<{ summary: string; blocks: RoutineBlockItem[] }>('/api/routine/generate', {
        method: 'POST',
        body: JSON.stringify({
          wakeTime,
          sleepTime,
          energyPeak,
          primaryGoals,
          includePrayerAndExercise,
          focusBlockMinutes: Number(focusBlockMinutes),
          replaceExisting: true,
        }),
      });
      setBlocks(res.blocks);
      setAiSummary(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI is waking up, try again in a minute.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    await apiFetch('/api/routine', {
      method: 'POST',
      body: JSON.stringify({
        title: manualTitle.trim(),
        startTime: manualStart,
        endTime: manualEnd,
        category: manualCategory,
      }),
    });
    setManualTitle('');
    await loadRoutine();
  }

  async function toggleCompleted(block: RoutineBlockItem) {
    await apiFetch(`/api/routine/${block.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !block.completed }),
    });
    await loadRoutine();
  }

  function startEdit(block: RoutineBlockItem) {
    setEditingId(block.id);
    setEditTitle(block.title);
    setEditStart(block.startTime);
    setEditEnd(block.endTime);
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return;
    await apiFetch(`/api/routine/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: editTitle.trim(), startTime: editStart, endTime: editEnd }),
    });
    setEditingId(null);
    await loadRoutine();
  }

  async function deleteBlock(id: string) {
    await apiFetch(`/api/routine/${id}`, { method: 'DELETE' });
    await loadRoutine();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#3B2A1E]">
          Customizable AI Daily Routine Planner
        </h1>
        <p className="text-sm text-[#7A6A58]">
          Generate a personalized daily schedule matched to your wake/sleep times and energy peak, then customize any block.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]">
          {error}
        </div>
      )}

      {/* AI Routine Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <WandSparkles className="h-4 w-4 text-[#9E2B25]" />
            Build Your Custom AI Routine
          </CardTitle>
          <CardDescription>
            Tell the AI when you wake up, when you focus best, and your key priorities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateRoutine} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label htmlFor="wake-time" className="block text-xs font-medium text-[#7A6A58]">
                  Wake-up Time
                </label>
                <Input id="wake-time" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label htmlFor="sleep-time" className="block text-xs font-medium text-[#7A6A58]">
                  Sleep Time
                </label>
                <Input id="sleep-time" type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label htmlFor="energy-peak" className="block text-xs font-medium text-[#7A6A58]">
                  Energy Peak
                </label>
                <select
                  id="energy-peak"
                  value={energyPeak}
                  onChange={(e) => setEnergyPeak(e.target.value)}
                  className="flex min-h-[44px] sm:min-h-[40px] w-full rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
                >
                  <option value="Morning">Morning (best early)</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening / Night</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="focus-len" className="block text-xs font-medium text-[#7A6A58]">
                  Focus Block Length
                </label>
                <select
                  id="focus-len"
                  value={focusBlockMinutes}
                  onChange={(e) => setFocusBlockMinutes(e.target.value)}
                  className="flex min-h-[44px] sm:min-h-[40px] w-full rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
                >
                  <option value="25">25 min (Pomodoro)</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min (Deep Work)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="daily-priorities" className="block text-xs font-medium text-[#7A6A58]">
                Main Daily Priorities
              </label>
              <Input
                id="daily-priorities"
                value={primaryGoals}
                onChange={(e) => setPrimaryGoals(e.target.value)}
                placeholder="e.g., University study, coding practice, reading, exercise"
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-sm font-medium text-[#3B2A1E]">
                <input
                  type="checkbox"
                  checked={includePrayerAndExercise}
                  onChange={(e) => setIncludePrayerAndExercise(e.target.checked)}
                  className="h-4 w-4 accent-[#9E2B25]"
                />
                Include Prayer &amp; Physical Exercise blocks
              </label>
              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building Schedule...
                  </>
                ) : (
                  <>
                    <WandSparkles className="h-4 w-4" />
                    Generate Custom Routine
                  </>
                )}
              </Button>
            </div>
          </form>

          {aiSummary && (
            <div className="mt-4 rounded-[0.625rem] border border-[#C89B5A]/45 bg-[#F3ECDF] px-4 py-3 text-sm text-[#3B2A1E]">
              {aiSummary}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Block Adder & Interactive Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-[#9E2B25]" />
            Your Daily Routine Timeline ({blocks.length} blocks)
          </CardTitle>
          <CardDescription>Check off blocks as you finish them, or edit/add custom blocks anytime.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleManualAdd} className="grid gap-2.5 sm:grid-cols-12">
            <Input
              type="time"
              className="sm:col-span-2"
              value={manualStart}
              onChange={(e) => setManualStart(e.target.value)}
              aria-label="Start time"
            />
            <Input
              type="time"
              className="sm:col-span-2"
              value={manualEnd}
              onChange={(e) => setManualEnd(e.target.value)}
              aria-label="End time"
            />
            <Input
              className="sm:col-span-4"
              placeholder="Add custom block title..."
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              required
            />
            <select
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              aria-label="Block category"
              className="sm:col-span-2 flex min-h-[44px] sm:min-h-[40px] rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" className="sm:col-span-2" disabled={!manualTitle.trim()}>
              <Plus className="h-4 w-4" />
              Add Block
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
            </div>
          ) : blocks.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#7A6A58]">
              No routine blocks yet. Click “Generate Custom Routine” above or add one manually.
            </p>
          ) : (
            <div className="space-y-2.5">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/75 px-4 py-3"
                >
                  {editingId === block.id ? (
                    <div className="grid gap-2 sm:grid-cols-12">
                      <Input
                        type="time"
                        className="sm:col-span-2"
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                      />
                      <Input
                        type="time"
                        className="sm:col-span-2"
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                      />
                      <Input
                        className="sm:col-span-5"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <div className="flex gap-2 sm:col-span-3">
                        <Button size="sm" className="flex-1" onClick={() => saveEdit(block.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCompleted(block)}
                        className="flex flex-1 items-start gap-3 text-left cursor-pointer"
                      >
                        {block.completed ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#5F7A5A] shrink-0" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 text-[#7A6A58] shrink-0" />
                        )}
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold tabular-nums text-[#9E2B25]">
                              {block.startTime} – {block.endTime}
                            </span>
                            <span className={`text-sm font-semibold ${block.completed ? 'line-through text-[#7A6A58]' : 'text-[#3B2A1E]'}`}>
                              {block.title}
                            </span>
                            <span className="text-xs text-[#7A6A58]">· {block.category}</span>
                          </div>
                          {block.notes && <p className="text-xs text-[#7A6A58]">{block.notes}</p>}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Edit ${block.title}`}
                          onClick={() => startEdit(block)}
                          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[0.625rem] text-[#7A6A58] hover:bg-[#F3ECDF] hover:text-[#3B2A1E] cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${block.title}`}
                          onClick={() => deleteBlock(block.id)}
                          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[0.625rem] text-[#7A6A58] hover:bg-[#9E2B25]/10 hover:text-[#9E2B25] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
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
