import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from './src/lib/prisma.ts';
import {
  clearSessionCookie,
  createSession,
  extractTokenFromRequest,
  hashPassword,
  requireAuth,
  setSessionCookie,
  verifyPassword,
} from './src/lib/auth.ts';
import type { AuthenticatedRequest } from './src/lib/auth.ts';
import {
  breakdownSmartTask,
  generateAssistantReply,
  generateCustomRoutine,
  generateProgressReportAnalysis,
  suggestSmartReminders,
} from './src/lib/ai.ts';
import { initializeNewUserWorkspace } from './src/lib/seedUser.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDesc = Array.from(new Set(dates)).sort((a, b) => (a > b ? -1 : 1));
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

  if (uniqueDesc[0] !== todayStr && uniqueDesc[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(`${uniqueDesc[0]}T00:00:00Z`);
  for (const d of uniqueDesc) {
    const expectedStr = expectedDate.toISOString().slice(0, 10);
    if (d === expectedStr) {
      streak += 1;
      expectedDate = new Date(expectedDate.getTime() - 86400000);
    } else if (d < expectedStr) {
      break;
    }
  }
  return streak;
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'faraz-ai' });
});

// ==================== AUTH ====================
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await initializeNewUserWorkspace(user.id, user.name);

    const session = await createSession(user.id);
    setSessionCookie(res, session.token);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, profile: true, settings: true },
    });

    res.status(201).json({ user: fullUser, token: session.token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Could not create your account right now. Please try again.' });
  }
});

app.post('/api/auth/signin', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter both your email and password.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const session = await createSession(user.id);
    setSessionCookie(res, session.token);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, profile: true, settings: true },
    });

    res.json({ user: fullUser, token: session.token });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

app.post('/api/auth/signout', async (req: Request, res: Response) => {
  try {
    const { token } = extractTokenFromRequest(req);
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch {
    clearSessionCookie(res);
    res.json({ ok: true });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
        settings: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

// ==================== DASHBOARD & MISSING ITEMS CHECK ====================
app.get('/api/dashboard', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const today = new Date().toISOString().slice(0, 10);

    const [
      user,
      routineBlocks,
      tasks,
      reminders,
      habits,
      habitLogs,
      goals,
      monthlyObjectives,
      yearlyGoals,
      reports,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, profile: true, settings: true },
      }),
      prisma.routineBlock.findMany({ where: { userId }, orderBy: [{ startTime: 'asc' }, { sortOrder: 'asc' }] }),
      prisma.task.findMany({ where: { userId }, orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }] }),
      prisma.reminder.findMany({ where: { userId, enabled: true }, orderBy: { timeOfDay: 'asc' } }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.habitLog.findMany({ where: { userId, date: today, completed: true } }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.monthlyObjective.findMany({ where: { userId } }),
      prisma.yearlyGoal.findMany({ where: { userId } }),
      prisma.dailyReport.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    ]);

    const weeklyTasksCount = tasks.filter((t) => t.period === 'weekly').length;
    const monthlyTasksCount = tasks.filter((t) => t.period === 'monthly').length;
    const yearlyTasksCount = tasks.filter((t) => t.period === 'yearly').length;

    const missingItems: {
      key: string;
      title: string;
      description: string;
      targetTab: string;
      actionLabel: string;
    }[] = [];

    if (!user?.profile?.primaryFocus?.trim()) {
      missingItems.push({
        key: 'profile_focus',
        title: 'Primary focus & bio missing',
        description: 'Add what you are focusing on so AI plans and reports match your life.',
        targetTab: 'settings',
        actionLabel: 'Complete Profile',
      });
    }
    if (routineBlocks.length === 0) {
      missingItems.push({
        key: 'daily_routine',
        title: 'Daily routine blocks missing',
        description: 'Create your customizable AI daily routine from wake-up to sleep.',
        targetTab: 'routine',
        actionLabel: 'Add Daily Routine',
      });
    }
    if (tasks.length === 0) {
      missingItems.push({
        key: 'tasks',
        title: 'No tasks added yet',
        description: 'Build your first daily priority task or split a big task with AI.',
        targetTab: 'tasks',
        actionLabel: 'Add Smart Task',
      });
    }
    if (weeklyTasksCount === 0) {
      missingItems.push({
        key: 'weekly_plan',
        title: 'Weekly Plan is empty',
        description: 'Add key tasks and targets you want to finish this week.',
        targetTab: 'weekly',
        actionLabel: 'Add Weekly Plan',
      });
    }
    if (monthlyObjectives.length === 0 && monthlyTasksCount === 0) {
      missingItems.push({
        key: 'monthly_plan',
        title: 'Monthly Plan is empty',
        description: 'Set your main monthly objectives to stay aligned beyond today.',
        targetTab: 'monthly',
        actionLabel: 'Add Monthly Plan',
      });
    }
    if (yearlyGoals.length === 0 && yearlyTasksCount === 0) {
      missingItems.push({
        key: 'yearly_plan',
        title: 'Yearly Plan is empty',
        description: 'Define 1–3 meaningful yearly goals and milestones.',
        targetTab: 'yearly',
        actionLabel: 'Add Yearly Plan',
      });
    }
    if (reminders.length === 0) {
      missingItems.push({
        key: 'reminders',
        title: 'No active smart reminders',
        description: 'Add daily focus, prayer, or exercise reminders so nothing slips.',
        targetTab: 'reminders',
        actionLabel: 'Add Reminders',
      });
    }
    if (habits.length === 0) {
      missingItems.push({
        key: 'habits',
        title: 'Habit Tracker is empty',
        description: 'Add 1–3 small daily habits you want to track consistently.',
        targetTab: 'habits',
        actionLabel: 'Add Habit',
      });
    }
    if (reports.length === 0) {
      missingItems.push({
        key: 'progress_report',
        title: 'First Progress Report not logged',
        description: 'Log today’s focus hours and rating out of 10 to start your streak.',
        targetTab: 'productivity',
        actionLabel: 'Log Progress Report',
      });
    }

    const completedTasks = tasks.filter((t) => t.completed).length;
    const completedRoutine = routineBlocks.filter((b) => b.completed).length;
    const streak = computeStreak(reports.map((r) => r.date));
    const latestReport = reports[0] ?? null;

    res.json({
      user,
      missingItems,
      stats: {
        tasksTotal: tasks.length,
        tasksCompleted: completedTasks,
        routineTotal: routineBlocks.length,
        routineCompleted: completedRoutine,
        remindersActive: reminders.length,
        habitsCompletedToday: habitLogs.length,
        habitsTotal: habits.length,
        goalsCompleted: goals.filter((g) => g.completed).length,
        goalsTotal: goals.length,
        weeklyTasksCount,
        monthlyCount: monthlyObjectives.length + monthlyTasksCount,
        yearlyCount: yearlyGoals.length + yearlyTasksCount,
        streak,
        reportsCount: reports.length,
        latestRating: latestReport ? latestReport.rating : null,
        latestFocusHours: latestReport ? latestReport.focusHours : 0,
      },
      routineBlocks: routineBlocks.slice(0, 6),
      tasks: tasks.slice(0, 8),
      reminders: reminders.slice(0, 5),
      goals: goals.slice(0, 4),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Could not load dashboard summary.' });
  }
});

// ==================== AI DAILY ROUTINE PLANNER ====================
app.get('/api/routine', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const blocks = await prisma.routineBlock.findMany({
      where: { userId },
      orderBy: [{ startTime: 'asc' }, { sortOrder: 'asc' }],
    });
    res.json({ blocks });
  } catch (err) {
    console.error('Routine GET error:', err);
    res.status(500).json({ error: 'Failed to load daily routine.' });
  }
});

app.post('/api/routine', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const startTime = typeof req.body?.startTime === 'string' ? req.body.startTime.trim() : '09:00';
    const endTime = typeof req.body?.endTime === 'string' ? req.body.endTime.trim() : '10:00';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : 'Focus';
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';

    if (!title) {
      res.status(400).json({ error: 'Block title is required.' });
      return;
    }

    const count = await prisma.routineBlock.count({ where: { userId } });
    const block = await prisma.routineBlock.create({
      data: { userId, title, startTime, endTime, category, notes, sortOrder: count + 1 },
    });
    res.status(201).json({ block });
  } catch (err) {
    console.error('Routine POST error:', err);
    res.status(500).json({ error: 'Failed to add routine block.' });
  }
});

app.post('/api/routine/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const wakeTime = typeof req.body?.wakeTime === 'string' ? req.body.wakeTime : '06:00';
    const sleepTime = typeof req.body?.sleepTime === 'string' ? req.body.sleepTime : '22:30';
    const energyPeak = typeof req.body?.energyPeak === 'string' ? req.body.energyPeak : 'Morning';
    const primaryGoals =
      typeof req.body?.primaryGoals === 'string' && req.body.primaryGoals.trim()
        ? req.body.primaryGoals.trim()
        : 'Deep study, daily tasks, and consistent rest';
    const includePrayerAndExercise = Boolean(req.body?.includePrayerAndExercise ?? true);
    const focusBlockMinutes = Math.max(25, Math.min(120, Number(req.body?.focusBlockMinutes ?? 60)));
    const replaceExisting = Boolean(req.body?.replaceExisting ?? true);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

    const generated = await generateCustomRoutine({
      userName: user?.name || 'Friend',
      wakeTime,
      sleepTime,
      energyPeak,
      primaryGoals,
      includePrayerAndExercise,
      focusBlockMinutes,
    });

    if (replaceExisting) {
      await prisma.routineBlock.deleteMany({ where: { userId } });
    }

    if (generated.blocks.length > 0) {
      await prisma.routineBlock.createMany({
        data: generated.blocks.map((b, idx) => ({
          userId,
          title: b.title,
          startTime: b.startTime,
          endTime: b.endTime,
          category: b.category || 'Focus',
          notes: b.notes || '',
          completed: false,
          sortOrder: idx + 1,
        })),
      });
    }

    const blocks = await prisma.routineBlock.findMany({
      where: { userId },
      orderBy: [{ startTime: 'asc' }, { sortOrder: 'asc' }],
    });

    res.status(201).json({ summary: generated.summary, blocks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI is waking up, try again in a minute.';
    res.status(503).json({ error: message });
  }
});

app.patch('/api/routine/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    const existing = await prisma.routineBlock.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Routine block not found.' });
      return;
    }

    const block = await prisma.routineBlock.update({
      where: { id },
      data: {
        ...(typeof req.body?.completed === 'boolean' ? { completed: req.body.completed } : {}),
        ...(typeof req.body?.title === 'string' && req.body.title.trim() ? { title: req.body.title.trim() } : {}),
        ...(typeof req.body?.startTime === 'string' ? { startTime: req.body.startTime } : {}),
        ...(typeof req.body?.endTime === 'string' ? { endTime: req.body.endTime } : {}),
        ...(typeof req.body?.category === 'string' ? { category: req.body.category } : {}),
        ...(typeof req.body?.notes === 'string' ? { notes: req.body.notes } : {}),
      },
    });
    res.json({ block });
  } catch (err) {
    console.error('Routine PATCH error:', err);
    res.status(500).json({ error: 'Failed to update routine block.' });
  }
});

app.delete('/api/routine/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.routineBlock.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Routine DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete routine block.' });
  }
});

// ==================== SMART TASK BUILDER & PERIOD TASKS ====================
app.get('/api/tasks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const period = typeof req.query.period === 'string' ? req.query.period : undefined;
    const tasks = await prisma.task.findMany({
      where: { userId, ...(period ? { period } : {}) },
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ tasks });
  } catch (err) {
    console.error('Tasks GET error:', err);
    res.status(500).json({ error: 'Failed to load tasks.' });
  }
});

app.post('/api/tasks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }

    const est = Number(req.body?.estimatedMinutes ?? 30);
    const period = ['daily', 'weekly', 'monthly', 'yearly'].includes(req.body?.period)
      ? req.body.period
      : 'daily';

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        dueDate: typeof req.body?.dueDate === 'string' && req.body.dueDate ? req.body.dueDate : new Date().toISOString().slice(0, 10),
        period,
        category: typeof req.body?.category === 'string' ? req.body.category : 'Focus',
        priority: ['high', 'medium', 'low'].includes(req.body?.priority) ? req.body.priority : 'medium',
        estimatedMinutes: Number.isFinite(est) ? Math.max(5, Math.min(480, Math.round(est))) : 30,
        timeBlock: typeof req.body?.timeBlock === 'string' && req.body.timeBlock ? req.body.timeBlock : null,
        notes: typeof req.body?.notes === 'string' ? req.body.notes.trim() : '',
      },
    });
    res.status(201).json({ task });
  } catch (err) {
    console.error('Tasks POST error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

app.post('/api/tasks/breakdown', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const taskTitle = typeof req.body?.taskTitle === 'string' ? req.body.taskTitle.trim() : '';
    const context = typeof req.body?.context === 'string' ? req.body.context.trim() : '';
    const period = ['daily', 'weekly', 'monthly', 'yearly'].includes(req.body?.period)
      ? req.body.period
      : 'daily';
    if (!taskTitle) {
      res.status(400).json({ error: 'Enter a task title to break down with AI.' });
      return;
    }

    const result = await breakdownSmartTask({ taskTitle, context });
    const today = new Date().toISOString().slice(0, 10);

    if (result.subtasks.length > 0) {
      await prisma.task.createMany({
        data: result.subtasks.map((st) => ({
          userId,
          title: st.title,
          completed: false,
          dueDate: today,
          period,
          category: st.category || 'Focus',
          priority: ['high', 'medium', 'low'].includes(st.priority) ? st.priority : 'medium',
          estimatedMinutes: st.estimatedMinutes || 25,
          notes: `Part of: ${taskTitle}`,
        })),
      });
    }

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
    });
    res.status(201).json({ createdCount: result.subtasks.length, tasks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI is waking up, try again in a minute.';
    res.status(503).json({ error: message });
  }
});

app.patch('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(typeof req.body?.completed === 'boolean' ? { completed: req.body.completed } : {}),
        ...(typeof req.body?.title === 'string' && req.body.title.trim() ? { title: req.body.title.trim() } : {}),
        ...(typeof req.body?.priority === 'string' ? { priority: req.body.priority } : {}),
        ...(typeof req.body?.category === 'string' ? { category: req.body.category } : {}),
        ...(typeof req.body?.period === 'string' ? { period: req.body.period } : {}),
        ...(typeof req.body?.timeBlock === 'string' ? { timeBlock: req.body.timeBlock } : {}),
      },
    });
    res.json({ task });
  } catch (err) {
    console.error('Tasks PATCH error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.task.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Tasks DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// ==================== WEEKLY / MONTHLY / YEARLY PLANS ====================
app.get('/api/planning', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const [monthlyObjectives, yearlyGoals, cycleReviews] = await Promise.all([
      prisma.monthlyObjective.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.yearlyGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.cycleReview.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ monthlyObjectives, yearlyGoals, cycleReviews });
  } catch (err) {
    console.error('Planning GET error:', err);
    res.status(500).json({ error: 'Failed to load plans.' });
  }
});

app.post('/api/objectives', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const month = typeof req.body?.month === 'string' && req.body.month ? req.body.month : new Date().toISOString().slice(0, 7);
    if (!title) {
      res.status(400).json({ error: 'Objective title is required.' });
      return;
    }
    const objective = await prisma.monthlyObjective.create({
      data: { userId, title, month, progress: 0, completed: false },
    });
    res.status(201).json({ objective });
  } catch (err) {
    console.error('Objectives POST error:', err);
    res.status(500).json({ error: 'Failed to create monthly objective.' });
  }
});

app.patch('/api/objectives/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    const existing = await prisma.monthlyObjective.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Objective not found.' });
      return;
    }
    const completed = typeof req.body?.completed === 'boolean' ? req.body.completed : existing.completed;
    const progress =
      typeof req.body?.progress === 'number'
        ? Math.max(0, Math.min(100, Math.round(req.body.progress)))
        : completed
        ? 100
        : 0;
    const objective = await prisma.monthlyObjective.update({
      where: { id },
      data: { completed, progress },
    });
    res.json({ objective });
  } catch (err) {
    console.error('Objectives PATCH error:', err);
    res.status(500).json({ error: 'Failed to update objective.' });
  }
});

app.delete('/api/objectives/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.monthlyObjective.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Objectives DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete objective.' });
  }
});

app.post('/api/yearly-goals', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const year = typeof req.body?.year === 'number' ? req.body.year : new Date().getFullYear();
    const category = typeof req.body?.category === 'string' ? req.body.category : 'Productivity';
    const milestone = typeof req.body?.milestone === 'string' ? req.body.milestone.trim() : '';
    if (!title) {
      res.status(400).json({ error: 'Yearly goal title is required.' });
      return;
    }
    const yearlyGoal = await prisma.yearlyGoal.create({
      data: { userId, title, year, category, milestone, completed: false },
    });
    res.status(201).json({ yearlyGoal });
  } catch (err) {
    console.error('YearlyGoal POST error:', err);
    res.status(500).json({ error: 'Failed to create yearly goal.' });
  }
});

app.patch('/api/yearly-goals/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    const existing = await prisma.yearlyGoal.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Yearly goal not found.' });
      return;
    }
    const yearlyGoal = await prisma.yearlyGoal.update({
      where: { id },
      data: {
        ...(typeof req.body?.completed === 'boolean' ? { completed: req.body.completed } : {}),
      },
    });
    res.json({ yearlyGoal });
  } catch (err) {
    console.error('YearlyGoal PATCH error:', err);
    res.status(500).json({ error: 'Failed to update yearly goal.' });
  }
});

app.delete('/api/yearly-goals/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.yearlyGoal.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('YearlyGoal DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete yearly goal.' });
  }
});

app.post('/api/reviews', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const periodType = typeof req.body?.periodType === 'string' ? req.body.periodType : 'weekly';
    const periodLabel = typeof req.body?.periodLabel === 'string' ? req.body.periodLabel.trim() : '';
    const wins = typeof req.body?.wins === 'string' ? req.body.wins.trim() : '';
    const nextFocus = typeof req.body?.nextFocus === 'string' ? req.body.nextFocus.trim() : '';
    const rating = typeof req.body?.rating === 'number' ? Math.max(1, Math.min(10, Math.round(req.body.rating))) : 8;

    if (!periodLabel || !wins) {
      res.status(400).json({ error: 'Period label and reflection notes are required.' });
      return;
    }
    const review = await prisma.cycleReview.create({
      data: { userId, periodType, periodLabel, wins, nextFocus, rating },
    });
    res.status(201).json({ review });
  } catch (err) {
    console.error('Review POST error:', err);
    res.status(500).json({ error: 'Failed to save reflection.' });
  }
});

app.delete('/api/reviews/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.cycleReview.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Review DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete reflection.' });
  }
});

// ==================== SMART DAILY REMINDERS ====================
app.get('/api/reminders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { timeOfDay: 'asc' },
    });
    res.json({ reminders });
  } catch (err) {
    console.error('Reminders GET error:', err);
    res.status(500).json({ error: 'Failed to load reminders.' });
  }
});

app.post('/api/reminders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const type = typeof req.body?.type === 'string' ? req.body.type : 'Focus';
    const timeOfDay = typeof req.body?.timeOfDay === 'string' ? req.body.timeOfDay : '09:00';
    if (!title) {
      res.status(400).json({ error: 'Reminder title is required.' });
      return;
    }
    const reminder = await prisma.reminder.create({
      data: { userId, title, type, timeOfDay, enabled: true },
    });
    res.status(201).json({ reminder });
  } catch (err) {
    console.error('Reminder POST error:', err);
    res.status(500).json({ error: 'Failed to add reminder.' });
  }
});

app.post('/api/reminders/suggest', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const [settings, routineBlocks, tasks] = await Promise.all([
      prisma.settings.findUnique({ where: { userId } }),
      prisma.routineBlock.findMany({ where: { userId }, orderBy: { startTime: 'asc' } }),
      prisma.task.findMany({ where: { userId, completed: false }, take: 8 }),
    ]);

    const suggested = await suggestSmartReminders({
      wakeTime: settings?.wakeTime || '06:00',
      sleepTime: settings?.sleepTime || '22:30',
      routineSummary: routineBlocks.map((b) => `${b.startTime}-${b.endTime} ${b.title}`),
      pendingTasks: tasks.map((t) => t.title),
    });

    if (suggested.reminders.length > 0) {
      await prisma.reminder.createMany({
        data: suggested.reminders.map((r) => ({
          userId,
          title: r.title,
          type: r.type || 'Focus',
          timeOfDay: r.timeOfDay || '09:00',
          aiReason: r.aiReason || '',
          enabled: true,
        })),
      });
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { timeOfDay: 'asc' },
    });
    res.status(201).json({ addedCount: suggested.reminders.length, reminders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI is waking up, try again in a minute.';
    res.status(503).json({ error: message });
  }
});

app.patch('/api/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Reminder not found.' });
      return;
    }
    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        enabled: typeof req.body?.enabled === 'boolean' ? req.body.enabled : !existing.enabled,
        ...(typeof req.body?.timeOfDay === 'string' ? { timeOfDay: req.body.timeOfDay } : {}),
      },
    });
    res.json({ reminder });
  } catch (err) {
    console.error('Reminder PATCH error:', err);
    res.status(500).json({ error: 'Failed to update reminder.' });
  }
});

app.delete('/api/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.reminder.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Reminder DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete reminder.' });
  }
});

// ==================== HABITS ====================
app.get('/api/habits', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: { logs: { orderBy: { date: 'desc' }, take: 30 } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ habits });
  } catch (err) {
    console.error('Habits GET error:', err);
    res.status(500).json({ error: 'Failed to load habits.' });
  }
});

app.post('/api/habits', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : 'Productivity';
    if (!name) {
      res.status(400).json({ error: 'Habit name is required.' });
      return;
    }
    const habit = await prisma.habit.create({
      data: { userId, name, category, targetFrequency: 'Daily' },
      include: { logs: true },
    });
    res.status(201).json({ habit });
  } catch (err) {
    console.error('Habits POST error:', err);
    res.status(500).json({ error: 'Failed to create habit.' });
  }
});

app.post('/api/habits/:id/log', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const habitId = String(req.params.id);
    const date = typeof req.body?.date === 'string' && req.body.date ? req.body.date : new Date().toISOString().slice(0, 10);
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) {
      res.status(404).json({ error: 'Habit not found.' });
      return;
    }
    const existingLog = await prisma.habitLog.findFirst({ where: { habitId, userId, date } });
    if (existingLog) {
      await prisma.habitLog.delete({ where: { id: existingLog.id } });
      res.json({ completed: false, date });
      return;
    }
    const log = await prisma.habitLog.create({ data: { userId, habitId, date, completed: true } });
    res.status(201).json({ completed: true, log });
  } catch (err) {
    console.error('Habit log error:', err);
    res.status(500).json({ error: 'Failed to update habit log.' });
  }
});

app.delete('/api/habits/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.habitLog.deleteMany({ where: { habitId: id, userId } });
    await prisma.habit.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Habits DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete habit.' });
  }
});

// ==================== GOALS & PROGRESS REPORT ====================
app.get('/api/goals', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.json({ goals });
  } catch (err) {
    console.error('Goals GET error:', err);
    res.status(500).json({ error: 'Failed to load goals.' });
  }
});

app.post('/api/goals', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : 'Productivity';
    const targetDate = typeof req.body?.targetDate === 'string' && req.body.targetDate ? req.body.targetDate : null;
    if (!title) {
      res.status(400).json({ error: 'Goal title is required.' });
      return;
    }
    const goal = await prisma.goal.create({
      data: { userId, title, category, targetDate, progress: 0, completed: false },
    });
    res.status(201).json({ goal });
  } catch (err) {
    console.error('Goals POST error:', err);
    res.status(500).json({ error: 'Failed to create goal.' });
  }
});

app.patch('/api/goals/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    const existing = await prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Goal not found.' });
      return;
    }
    const progress =
      typeof req.body?.progress === 'number'
        ? Math.max(0, Math.min(100, Math.round(req.body.progress)))
        : existing.progress;
    const goal = await prisma.goal.update({
      where: { id },
      data: { progress, completed: progress >= 100 },
    });
    res.json({ goal });
  } catch (err) {
    console.error('Goals PATCH error:', err);
    res.status(500).json({ error: 'Failed to update goal.' });
  }
});

app.delete('/api/goals/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.goal.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Goals DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete goal.' });
  }
});

app.get('/api/reports', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);

    const [reports, routineBlocks, tasks, monthlyObjectives, yearlyGoals, habits, habitLogs] =
      await Promise.all([
        prisma.dailyReport.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
        prisma.routineBlock.findMany({ where: { userId } }),
        prisma.task.findMany({ where: { userId } }),
        prisma.monthlyObjective.findMany({ where: { userId } }),
        prisma.yearlyGoal.findMany({ where: { userId } }),
        prisma.habit.findMany({ where: { userId } }),
        prisma.habitLog.findMany({ where: { userId, date: { gte: sevenDaysAgo }, completed: true } }),
      ]);

    const streak = computeStreak(reports.map((r) => r.date));
    const avgRating =
      reports.length > 0
        ? Number((reports.reduce((acc, r) => acc + r.rating, 0) / reports.length).toFixed(1))
        : 0;
    const totalFocusHours = Number(reports.reduce((acc, r) => acc + r.focusHours, 0).toFixed(1));
    const totalTasksDone = reports.reduce((acc, r) => acc + r.tasksDone, 0);

    const getTaskDate = (t: (typeof tasks)[number]) =>
      t.dueDate && /^\d{4}-\d{2}-\d{2}/.test(t.dueDate)
        ? t.dueDate.slice(0, 10)
        : t.createdAt.toISOString().slice(0, 10);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Daily interval: last 7 days ending today
    const daily = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now.getTime() - (6 - idx) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTasks = tasks.filter((t) => getTaskDate(t) === dateStr);
      const totalTasks = dayTasks.length;
      const completedTasks = dayTasks.filter((t) => t.completed).length;
      const dayReports = reports.filter((r) => r.date === dateStr);
      const focusHours = Number(dayReports.reduce((acc, r) => acc + r.focusHours, 0).toFixed(1));
      const rating =
        dayReports.length > 0
          ? Number((dayReports.reduce((acc, r) => acc + r.rating, 0) / dayReports.length).toFixed(1))
          : 0;

      // Include today's routine blocks on today's bucket if tasks haven't been logged yet or alongside tasks
      const effectiveTotal = totalTasks;
      const effectiveCompleted = completedTasks;
      const completionRate =
        effectiveTotal > 0 ? Math.round((effectiveCompleted / effectiveTotal) * 100) : 0;

      return {
        key: dateStr,
        label: idx === 6 ? 'Today' : weekdayNames[d.getUTCDay()],
        fullLabel: `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
        totalTasks: effectiveTotal,
        completedTasks: effectiveCompleted,
        completionRate,
        focusHours,
        rating,
      };
    });

    // Weekly interval: last 6 weeks ending with current 7-day window
    const weekly = Array.from({ length: 6 }, (_, idx) => {
      const weeksBack = 5 - idx;
      const endDate = new Date(now.getTime() - weeksBack * 7 * 86400000);
      const startDate = new Date(endDate.getTime() - 6 * 86400000);
      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endDate.toISOString().slice(0, 10);

      const weekTasks = tasks.filter((t) => {
        const dt = getTaskDate(t);
        return dt >= startStr && dt <= endStr;
      });
      const totalTasks = weekTasks.length;
      const completedTasks = weekTasks.filter((t) => t.completed).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const weekReports = reports.filter((r) => r.date >= startStr && r.date <= endStr);
      const focusHours = Number(weekReports.reduce((acc, r) => acc + r.focusHours, 0).toFixed(1));

      return {
        key: `${startStr}_${endStr}`,
        label:
          idx === 5
            ? 'This Wk'
            : `${monthNames[startDate.getUTCMonth()]} ${startDate.getUTCDate()}`,
        fullLabel: `${monthNames[startDate.getUTCMonth()]} ${startDate.getUTCDate()} – ${monthNames[endDate.getUTCMonth()]} ${endDate.getUTCDate()}`,
        totalTasks,
        completedTasks,
        completionRate,
        focusHours,
      };
    });

    // Monthly interval: last 6 calendar months ending current month
    const monthly = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - idx), 1));
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const monthKey = `${yyyy}-${mm}`;

      const monthTasks = tasks.filter((t) => getTaskDate(t).startsWith(monthKey));
      const totalTasks = monthTasks.length;
      const completedTasks = monthTasks.filter((t) => t.completed).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const objs = monthlyObjectives.filter((o) => o.month === monthKey);
      const objectivesTotal = objs.length;
      const objectivesAvgProgress =
        objectivesTotal > 0
          ? Math.round(objs.reduce((acc, o) => acc + o.progress, 0) / objectivesTotal)
          : 0;

      const monthReports = reports.filter((r) => r.date.startsWith(monthKey));
      const focusHours = Number(monthReports.reduce((acc, r) => acc + r.focusHours, 0).toFixed(1));

      return {
        key: monthKey,
        label: monthNames[d.getUTCMonth()],
        fullLabel: `${monthNames[d.getUTCMonth()]} ${yyyy}`,
        totalTasks,
        completedTasks,
        completionRate,
        focusHours,
        objectivesTotal,
        objectivesAvgProgress,
      };
    });

    // Breakdown by Plan Period (Daily, Weekly, Monthly, Yearly)
    const byPlanPeriod = (['daily', 'weekly', 'monthly', 'yearly'] as const).map((periodKey) => {
      const list = tasks.filter((t) => (t.period || 'daily') === periodKey);
      const totalTasks = list.length;
      const completedTasks = list.filter((t) => t.completed).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return {
        period: periodKey.charAt(0).toUpperCase() + periodKey.slice(1),
        totalTasks,
        completedTasks,
        completionRate,
      };
    });

    res.json({
      reports,
      summary: {
        streak,
        avgRating,
        totalFocusHours,
        totalTasksDone,
        routineTotal: routineBlocks.length,
        routineCompleted: routineBlocks.filter((b) => b.completed).length,
        tasksTotal: tasks.length,
        tasksCompleted: tasks.filter((t) => t.completed).length,
        weeklyTasksTotal: tasks.filter((t) => t.period === 'weekly').length,
        monthlyObjectivesTotal: monthlyObjectives.length,
        yearlyGoalsTotal: yearlyGoals.length,
        habitsCount: habits.length,
        habitCheckinsLast7Days: habitLogs.length,
      },
      intervals: {
        daily,
        weekly,
        monthly,
        byPlanPeriod,
      },
    });
  } catch (err) {
    console.error('Reports GET error:', err);
    res.status(500).json({ error: 'Failed to load progress reports.' });
  }
});

app.post('/api/reports', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const date = typeof req.body?.date === 'string' && req.body.date ? req.body.date : new Date().toISOString().slice(0, 10);
    const ratingNum = Number(req.body?.rating ?? 8);
    const rating = Number.isFinite(ratingNum) ? Math.max(1, Math.min(10, Math.round(ratingNum * 10) / 10)) : 8;
    const focusNum = Number(req.body?.focusHours ?? 0);
    const focusHours = Number.isFinite(focusNum) ? Math.max(0, Math.min(18, Math.round(focusNum * 10) / 10)) : 0;
    const tasksNum = Number(req.body?.tasksDone ?? 0);
    const tasksDone = Number.isFinite(tasksNum) ? Math.max(0, Math.min(200, Math.round(tasksNum))) : 0;
    const summary = typeof req.body?.summary === 'string' ? req.body.summary.trim() : '';

    const report = await prisma.dailyReport.create({
      data: { userId, date, rating, focusHours, tasksDone, summary },
    });
    res.status(201).json({ report });
  } catch (err) {
    console.error('Reports POST error:', err);
    res.status(500).json({ error: 'Failed to save progress report.' });
  }
});

app.post('/api/reports/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    const [user, reports, routineBlocks, tasks, monthlyObjectives, yearlyGoals, habits, habitLogs] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
        prisma.dailyReport.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
        prisma.routineBlock.findMany({ where: { userId } }),
        prisma.task.findMany({ where: { userId } }),
        prisma.monthlyObjective.findMany({ where: { userId } }),
        prisma.yearlyGoal.findMany({ where: { userId } }),
        prisma.habit.findMany({ where: { userId } }),
        prisma.habitLog.findMany({ where: { userId, date: { gte: sevenDaysAgo }, completed: true } }),
      ]);

    const streak = computeStreak(reports.map((r) => r.date));
    const avgRating =
      reports.length > 0
        ? Number((reports.reduce((acc, r) => acc + r.rating, 0) / reports.length).toFixed(1))
        : 0;
    const totalFocusHours = Number(reports.reduce((acc, r) => acc + r.focusHours, 0).toFixed(1));

    const analysis = await generateProgressReportAnalysis({
      userName: user?.name || 'Friend',
      routineTotal: routineBlocks.length,
      routineCompleted: routineBlocks.filter((b) => b.completed).length,
      tasksTotal: tasks.length,
      tasksCompleted: tasks.filter((t) => t.completed).length,
      weeklyTasksCount: tasks.filter((t) => t.period === 'weekly').length,
      monthlyObjectivesCount: monthlyObjectives.length,
      yearlyGoalsCount: yearlyGoals.length,
      habitsCount: habits.length,
      habitCheckinsLast7Days: habitLogs.length,
      reportsCount: reports.length,
      avgRating,
      totalFocusHours,
      streak,
    });

    res.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI is waking up, try again in a minute.';
    res.status(503).json({ error: message });
  }
});

app.delete('/api/reports/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const id = String(req.params.id);
    await prisma.dailyReport.deleteMany({ where: { id, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Reports DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

// ==================== AI COACH CHAT ====================
app.get('/api/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 60,
    });
    res.json({ messages });
  } catch (err) {
    console.error('Chat GET error:', err);
    res.status(500).json({ error: 'Failed to load chat history.' });
  }
});

app.post('/api/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const content = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!content) {
      res.status(400).json({ error: 'Please write a message first.' });
      return;
    }

    const [user, settings, routineBlocks, tasks, reminders, habits, goals, reports, recentMessages] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
        prisma.settings.findUnique({ where: { userId } }),
        prisma.routineBlock.findMany({ where: { userId }, orderBy: { startTime: 'asc' } }),
        prisma.task.findMany({ where: { userId } }),
        prisma.reminder.count({ where: { userId, enabled: true } }),
        prisma.habit.count({ where: { userId } }),
        prisma.goal.findMany({ where: { userId } }),
        prisma.dailyReport.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 5 }),
        prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 8 }),
      ]);

    const context = {
      userName: user?.name || 'Friend',
      language: settings?.language || 'English',
      wakeTime: settings?.wakeTime || '06:00',
      sleepTime: settings?.sleepTime || '22:30',
      dailyFocusTargetHours: settings?.dailyFocusTargetHours ?? 4,
      routineBlocks: routineBlocks.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
        title: b.title,
        completed: b.completed,
      })),
      tasksSummary: {
        total: tasks.length,
        completed: tasks.filter((t) => t.completed).length,
        pendingTitles: tasks.filter((t) => !t.completed).slice(0, 8).map((t) => t.title),
      },
      remindersCount: reminders,
      habitsCount: habits,
      goalsSummary: goals.map((g) => ({ title: g.title, progress: g.progress, completed: g.completed })),
      reportsSummary: {
        count: reports.length,
        latestRating: reports[0]?.rating ?? null,
        latestFocusHours: reports[0]?.focusHours ?? null,
      },
    };

    const historyTurns = recentMessages
      .reverse()
      .map((m) => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: m.content }));

    const aiResult = await generateAssistantReply(content, historyTurns, context);

    const userMsg = await prisma.chatMessage.create({
      data: { userId, role: 'user', content, agentUsed: 'User' },
    });
    const assistantMsg = await prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: aiResult.reply, agentUsed: aiResult.agentUsed },
    });

    res.status(201).json({ userMessage: userMsg, assistantMessage: assistantMsg });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI is waking up, try again in a minute.';
    res.status(503).json({ error: message });
  }
});

app.delete('/api/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    await prisma.chatMessage.deleteMany({ where: { userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Chat DELETE error:', err);
    res.status(500).json({ error: 'Failed to clear chat history.' });
  }
});

// ==================== PROFILE & PERSONALIZATION SETTINGS ====================
app.get('/api/profile-settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const [user, profile, settings] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
      prisma.profile.findUnique({ where: { userId } }),
      prisma.settings.findUnique({ where: { userId } }),
    ]);
    res.json({ user, profile, settings });
  } catch (err) {
    console.error('ProfileSettings GET error:', err);
    res.status(500).json({ error: 'Failed to load profile settings.' });
  }
});

app.put('/api/profile-settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : undefined;
    if (name) {
      await prisma.user.update({ where: { id: userId }, data: { name } });
    }

    const profileData = {
      city: typeof req.body?.city === 'string' ? req.body.city.trim() : 'Quetta, Balochistan, Pakistan',
      roleTitle: typeof req.body?.roleTitle === 'string' ? req.body.roleTitle.trim() : 'Student & Builder',
      primaryFocus: typeof req.body?.primaryFocus === 'string' ? req.body.primaryFocus.trim() : '',
      bio: typeof req.body?.bio === 'string' ? req.body.bio.trim() : '',
    };

    const focusHoursNum = Number(req.body?.dailyFocusTargetHours ?? 4);
    const settingsData = {
      language: typeof req.body?.language === 'string' ? req.body.language : 'English',
      wakeTime: typeof req.body?.wakeTime === 'string' ? req.body.wakeTime : '06:00',
      sleepTime: typeof req.body?.sleepTime === 'string' ? req.body.sleepTime : '22:30',
      dailyFocusTargetHours: Number.isFinite(focusHoursNum) ? Math.max(0.5, Math.min(16, focusHoursNum)) : 4,
      dashboardWidgets:
        typeof req.body?.dashboardWidgets === 'string'
          ? req.body.dashboardWidgets
          : 'focus,routine,tasks,reminders,habits,goals',
      focusMotto: typeof req.body?.focusMotto === 'string' ? req.body.focusMotto.trim() : 'One focused block at a time.',
    };

    const [profile, settings, user] = await Promise.all([
      prisma.profile.upsert({ where: { userId }, update: profileData, create: { userId, ...profileData } }),
      prisma.settings.upsert({ where: { userId }, update: settingsData, create: { userId, ...settingsData } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } }),
    ]);

    res.json({ user: { ...user, profile, settings } });
  } catch (err) {
    console.error('ProfileSettings PUT error:', err);
    res.status(500).json({ error: 'Failed to save preferences.' });
  }
});

// ==================== VITE / STATIC SERVER ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FARAZ AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
