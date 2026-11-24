import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch } from '../../../lib/api';
import type { GoalItem, ReportsResponse, TaskCompletionIntervalPoint } from '../../../types';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input, Textarea } from '../../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';

interface AiAnalysis {
  headline: string;
  strengths: string[];
  gaps: string[];
  nextAction: string;
}

type IntervalTab = 'daily' | 'weekly' | 'monthly';

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number | string;
  payload?: TaskCompletionIntervalPoint & {
    period?: string;
    date?: string;
    rating?: number;
    focusHours?: number;
  };
}

function CompletionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#3B2A1E] shadow-lg">
      <p className="font-display font-bold text-[#3B2A1E]">
        {point.fullLabel || point.period || point.label}
      </p>
      <div className="mt-1.5 space-y-1 tabular-nums">
        <p className="flex items-center justify-between gap-4">
          <span className="text-[#7A6A58]">Completion Rate:</span>
          <span className="font-bold text-[#9E2B25]">{point.completionRate}%</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-[#7A6A58]">Tasks Completed:</span>
          <span className="font-semibold text-[#3B2A1E]">
            {point.completedTasks} / {point.totalTasks}
          </span>
        </p>
        {typeof point.focusHours === 'number' && (
          <p className="flex items-center justify-between gap-4">
            <span className="text-[#7A6A58]">Focus Logged:</span>
            <span className="font-semibold text-[#5F7A5A]">{point.focusHours} hrs</span>
          </p>
        )}
        {typeof point.objectivesTotal === 'number' && point.objectivesTotal > 0 && (
          <p className="flex items-center justify-between gap-4">
            <span className="text-[#7A6A58]">Monthly Objectives:</span>
            <span className="font-semibold text-[#B07A3F]">
              {point.objectivesAvgProgress ?? 0}% ({point.objectivesTotal})
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function RatingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#3B2A1E] shadow-lg">
      <p className="font-mono font-bold text-[#3B2A1E]">{point.date}</p>
      <div className="mt-1 space-y-1 tabular-nums">
        <p className="flex items-center justify-between gap-4">
          <span className="text-[#7A6A58]">Productivity Rating:</span>
          <span className="font-bold text-[#9E2B25]">{point.rating} / 10</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-[#7A6A58]">Focus Hours:</span>
          <span className="font-semibold text-[#5F7A5A]">{point.focusHours} hrs</span>
        </p>
      </div>
    </div>
  );
}

export function ProgressView() {
  const [reportsData, setReportsData] = useState<ReportsResponse | null>(null);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [intervalTab, setIntervalTab] = useState<IntervalTab>('daily');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  // Report Form
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rating, setRating] = useState('8');
  const [focusHours, setFocusHours] = useState('3.5');
  const [tasksDone, setTasksDone] = useState('4');
  const [summary, setSummary] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const [repRes, goalRes] = await Promise.all([
        apiFetch<ReportsResponse>('/api/reports'),
        apiFetch<{ goals: GoalItem[] }>('/api/goals'),
      ]);
      setReportsData(repRes);
      setGoals(goalRes.goals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load productivity report.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAnalyzeProgress() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await apiFetch<{ analysis: AiAnalysis }>('/api/reports/analyze', {
        method: 'POST',
      });
      setAnalysis(res.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI is waking up, try again in a minute.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    await apiFetch('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        title: goalTitle.trim(),
        targetDate: goalTarget || null,
      }),
    });
    setGoalTitle('');
    setGoalTarget('');
    await loadAll();
  }

  async function updateGoalProgress(goal: GoalItem, progress: number) {
    await apiFetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
    await loadAll();
  }

  async function deleteGoal(id: string) {
    await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  async function handleSaveReport(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          date,
          rating: Number(rating),
          focusHours: Number(focusHours),
          tasksDone: Number(tasksDone),
          summary,
        }),
      });
      setSummary('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save report.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteReport(id: string) {
    await apiFetch(`/api/reports/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  const s = reportsData?.summary;
  const reports = reportsData?.reports ?? [];
  const ratingChartData = [...reports]
    .slice(0, 14)
    .reverse()
    .map((r) => ({
      date: r.date.slice(5),
      rating: r.rating,
      focusHours: r.focusHours,
    }));

  const taskCompletionPct =
    s && s.tasksTotal > 0 ? Math.round((s.tasksCompleted / s.tasksTotal) * 100) : 0;

  const activeSeries: TaskCompletionIntervalPoint[] = reportsData?.intervals?.[intervalTab] ?? [];
  const intervalTotals = activeSeries.reduce(
    (acc, item) => ({
      totalTasks: acc.totalTasks + item.totalTasks,
      completedTasks: acc.completedTasks + item.completedTasks,
      focusHours: Number((acc.focusHours + item.focusHours).toFixed(1)),
    }),
    { totalTasks: 0, completedTasks: 0, focusHours: 0 }
  );
  const intervalRate =
    intervalTotals.totalTasks > 0
      ? Math.round((intervalTotals.completedTasks / intervalTotals.totalTasks) * 100)
      : 0;

  const byPlanPeriod = reportsData?.intervals?.byPlanPeriod ?? [];
  const periodBarColors = ['#9E2B25', '#B07A3F', '#5F7A5A', '#2E1F16'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#3B2A1E]">Productivity Report</h1>
          <p className="text-sm text-[#7A6A58]">
            Visualize task completion rates across daily, weekly, and monthly intervals alongside focus hours and goals.
          </p>
        </div>
        <Button onClick={handleAnalyzeProgress} disabled={analyzing}>
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate AI Progress Report
            </>
          )}
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]"
        >
          {error}
        </div>
      )}

      {/* AI Generated Honest Progress Report */}
      {analysis && (
        <Card className="border-[#C89B5A] bg-[#F3ECDF]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-[#5F7A5A]" />
              AI Productivity Report (Based Strictly on Saved Data)
            </CardTitle>
            <CardDescription className="font-medium text-[#3B2A1E]">{analysis.headline}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-4">
              <p className="text-xs font-bold text-[#5F7A5A]">What’s Working</p>
              <ul className="space-y-1.5 text-sm text-[#3B2A1E]">
                {analysis.strengths.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="diamond-bullet mt-1.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-4">
              <p className="text-xs font-bold text-[#9E2B25]">Missing or Needs Attention</p>
              <ul className="space-y-1.5 text-sm text-[#3B2A1E]">
                {analysis.gaps.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="diamond-bullet mt-1.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[0.625rem] border border-[#C89B5A]/45 bg-[#FFFDF8] px-4 py-3 text-sm md:col-span-2">
              <span className="font-bold text-[#9E2B25]">Recommended next step: </span>
              <span className="text-[#3B2A1E]">{analysis.nextAction}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress Report Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Report Streak</CardDescription>
            <CardTitle className="flex items-center gap-2 font-display text-2xl font-extrabold tabular-nums text-[#9E2B25]">
              <Flame className="h-5 w-5" />
              {s?.streak ?? 0} days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs tabular-nums text-[#7A6A58]">{reports.length} daily logs saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Daily Rating</CardDescription>
            <CardTitle className="font-display text-2xl font-extrabold tabular-nums text-[#3B2A1E]">
              {s?.avgRating ?? 0} / 10
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs tabular-nums text-[#7A6A58]">
              {s?.totalFocusHours ?? 0} total focus hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Task Completion</CardDescription>
            <CardTitle className="font-display text-2xl font-extrabold tabular-nums text-[#5F7A5A]">
              {taskCompletionPct}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs tabular-nums text-[#7A6A58]">
              {s?.tasksCompleted ?? 0} / {s?.tasksTotal ?? 0} tasks · {s?.routineCompleted ?? 0}/
              {s?.routineTotal ?? 0} routine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>7-Day Habit Check-ins</CardDescription>
            <CardTitle className="flex items-center gap-2 font-display text-2xl font-extrabold tabular-nums text-[#B07A3F]">
              <Clock className="h-5 w-5" />
              {s?.habitCheckinsLast7Days ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs tabular-nums text-[#7A6A58]">
              Across {s?.habitsCount ?? 0} tracked habits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Task Completion Rate Analytics: Daily / Weekly / Monthly */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-[#9E2B25]" />
                Task Completion Rate ({intervalTab === 'daily' ? 'Daily' : intervalTab === 'weekly' ? 'Weekly' : 'Monthly'})
              </CardTitle>
              <CardDescription>
                {intervalTab === 'daily'
                  ? 'Completion rate (%) and focus hours across the last 7 days.'
                  : intervalTab === 'weekly'
                    ? 'Completion rate (%) across the past 6 weekly cycles.'
                    : 'Monthly task completion rate (%) alongside monthly objective progress.'}
              </CardDescription>
            </div>

            <Tabs
              value={intervalTab}
              onValueChange={(val) => setIntervalTab(val as IntervalTab)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-3 text-center sm:text-left">
              <div>
                <p className="text-[11px] font-medium text-[#7A6A58]">Interval Rate</p>
                <p className="font-display text-lg font-extrabold tabular-nums text-[#9E2B25]">
                  {intervalRate}%
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#7A6A58]">Completed / Total</p>
                <p className="font-display text-lg font-extrabold tabular-nums text-[#3B2A1E]">
                  {intervalTotals.completedTasks} / {intervalTotals.totalTasks}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#7A6A58]">Focus Logged</p>
                <p className="font-display text-lg font-extrabold tabular-nums text-[#5F7A5A]">
                  {intervalTotals.focusHours} hrs
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex h-[280px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
              </div>
            ) : (
              <div className="h-[280px] w-full rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-3">
                <ResponsiveContainer width="100%" height="100%">
                  {intervalTab === 'monthly' ? (
                    <ComposedChart data={activeSeries} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5D9C3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#7A6A58', fontSize: 12 }}
                        axisLine={{ stroke: '#E5D9C3' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: '#7A6A58', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CompletionTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar
                        dataKey="completionRate"
                        name="Task Completion %"
                        fill="#9E2B25"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={42}
                      />
                      <Line
                        type="monotone"
                        dataKey="objectivesAvgProgress"
                        name="Objectives Avg %"
                        stroke="#C89B5A"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#B07A3F' }}
                      />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={activeSeries} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5D9C3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#7A6A58', fontSize: 12 }}
                        axisLine={{ stroke: '#E5D9C3' }}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="pct"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: '#7A6A58', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="hrs"
                        orientation="right"
                        hide
                        domain={[0, 'dataMax + 2']}
                      />
                      <Tooltip content={<CompletionTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar
                        yAxisId="pct"
                        dataKey="completionRate"
                        name="Completion Rate %"
                        fill="#9E2B25"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={42}
                      />
                      <Line
                        yAxisId="hrs"
                        type="monotone"
                        dataKey="focusHours"
                        name="Focus Hours"
                        stroke="#5F7A5A"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#5F7A5A' }}
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            {intervalTotals.totalTasks === 0 && (
              <p className="text-xs text-[#7A6A58]">
                No tasks recorded inside this {intervalTab} window yet. Add and complete tasks in Smart Task Builder or your {intervalTab} plan to see bars update live.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Completion Rate by Plan Horizon */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-[#9E2B25]" />
              Completion by Plan Level
            </CardTitle>
            <CardDescription>Daily, Weekly, Monthly, and Yearly task completion rates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[220px] w-full rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-2.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byPlanPeriod} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5D9C3" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: '#7A6A58', fontSize: 11 }}
                    axisLine={{ stroke: '#E5D9C3' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: '#7A6A58', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CompletionTooltip />} />
                  <Bar dataKey="completionRate" name="Completion %" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {byPlanPeriod.map((entry, idx) => (
                      <Cell key={entry.period} fill={periodBarColors[idx % periodBarColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {byPlanPeriod.map((row) => (
                <div
                  key={row.period}
                  className="flex items-center justify-between rounded-[0.5rem] border border-[#E5D9C3] bg-[#FAF7F0] px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-[#3B2A1E]">{row.period} Plan</span>
                  <span className="font-mono tabular-nums text-[#7A6A58]">
                    {row.completedTasks}/{row.totalTasks} ({row.completionRate}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress Logger + Recharts Rating Trend */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">Log Daily Progress Report</CardTitle>
            <CardDescription>Record today’s real focus hours and productivity rating.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveReport} className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="rep-date" className="block text-xs font-medium text-[#7A6A58]">
                    Date
                  </label>
                  <Input id="rep-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label htmlFor="rep-rating" className="block text-xs font-medium text-[#7A6A58]">
                    Rating (/10)
                  </label>
                  <Input
                    id="rep-rating"
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="rep-focus" className="block text-xs font-medium text-[#7A6A58]">
                    Focus Hours
                  </label>
                  <Input
                    id="rep-focus"
                    type="number"
                    min={0}
                    max={16}
                    step={0.5}
                    value={focusHours}
                    onChange={(e) => setFocusHours(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="rep-tasks" className="block text-xs font-medium text-[#7A6A58]">
                    Tasks Completed
                  </label>
                  <Input
                    id="rep-tasks"
                    type="number"
                    min={0}
                    max={100}
                    value={tasksDone}
                    onChange={(e) => setTasksDone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="rep-notes" className="block text-xs font-medium text-[#7A6A58]">
                  Daily Summary
                </label>
                <Textarea
                  id="rep-notes"
                  placeholder="What went well today? What distracted you?"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Save Daily Report
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-[#9E2B25]" />
              Daily Rating &amp; Focus Trend
            </CardTitle>
            <CardDescription>Visual Recharts history of your logged daily scores (/10) and focus hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratingChartData.length === 0 ? (
              <div className="flex h-52 items-center justify-center rounded-[0.625rem] border border-dashed border-[#E5D9C3] bg-[#FAF7F0] text-sm text-[#7A6A58]">
                Log your first daily progress report to see your rating trend.
              </div>
            ) : (
              <div className="h-56 w-full rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratingChartData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9E2B25" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#9E2B25" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5D9C3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#7A6A58', fontSize: 11 }}
                      axisLine={{ stroke: '#E5D9C3' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fill: '#7A6A58', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<RatingTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      name="Rating /10"
                      stroke="#9E2B25"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#ratingFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {reports.length > 0 && (
              <div className="space-y-2 pt-2">
                {reports.slice(0, 6).map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between gap-3 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0]/70 px-3.5 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[#3B2A1E]">
                        <span className="font-mono font-bold tabular-nums">{rep.date}</span> ·{' '}
                        <span className="font-semibold tabular-nums text-[#9E2B25]">{rep.rating}/10</span> ·{' '}
                        <span className="text-xs tabular-nums text-[#7A6A58]">
                          {rep.focusHours}h focus · {rep.tasksDone} tasks
                        </span>
                      </p>
                      {rep.summary && <p className="text-xs text-[#7A6A58]">{rep.summary}</p>}
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete report ${rep.date}`}
                      onClick={() => deleteReport(rep.id)}
                      className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-[0.5rem] text-[#7A6A58] hover:bg-[#9E2B25]/10 hover:text-[#9E2B25] cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personal Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-[#9E2B25]" />
            Goal Tracker
          </CardTitle>
          <CardDescription>Track progress on your active personal goals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddGoal} className="grid gap-2.5 sm:grid-cols-12">
            <Input
              className="sm:col-span-7"
              placeholder="Add a clear goal..."
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              required
            />
            <Input
              type="date"
              className="sm:col-span-3"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              aria-label="Target date"
            />
            <Button type="submit" className="sm:col-span-2" disabled={!goalTitle.trim()}>
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
            </div>
          ) : goals.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#7A6A58]">No goals saved yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="space-y-2.5 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-bold ${g.completed ? 'line-through text-[#5F7A5A]' : 'text-[#3B2A1E]'}`}>
                        {g.title}
                      </p>
                      {g.targetDate && (
                        <p className="font-mono text-xs tabular-nums text-[#7A6A58]">Target: {g.targetDate}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold tabular-nums text-[#9E2B25]">
                        {g.progress}%
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete goal ${g.title}`}
                        onClick={() => deleteGoal(g.id)}
                        className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-[0.5rem] text-[#7A6A58] hover:bg-[#9E2B25]/10 hover:text-[#9E2B25] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={10}
                    value={g.progress}
                    onChange={(e) => updateGoalProgress(g, Number(e.target.value))}
                    aria-label={`Progress for ${g.title}`}
                    className="w-full cursor-pointer accent-[#9E2B25]"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
