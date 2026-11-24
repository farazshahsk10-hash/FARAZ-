export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  profile?: UserProfile | null;
  settings?: UserSettings | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  city: string;
  roleTitle: string;
  primaryFocus: string;
  bio: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  language: string;
  wakeTime: string;
  sleepTime: string;
  dailyFocusTargetHours: number;
  dashboardWidgets: string;
  focusMotto: string;
}

export interface RoutineBlockItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  notes: string;
  completed: boolean;
  sortOrder: number;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | string;
  category: string;
  priority: string;
  estimatedMinutes: number;
  timeBlock: string | null;
  notes: string;
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  type: string;
  timeOfDay: string;
  aiReason: string;
  enabled: boolean;
}

export interface HabitLogItem {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export interface HabitItem {
  id: string;
  name: string;
  category: string;
  targetFrequency: string;
  logs: HabitLogItem[];
}

export interface GoalItem {
  id: string;
  title: string;
  category: string;
  targetDate: string | null;
  progress: number;
  completed: boolean;
}

export interface MonthlyObjectiveItem {
  id: string;
  month: string;
  title: string;
  completed: boolean;
  progress: number;
}

export interface YearlyGoalItem {
  id: string;
  year: number;
  title: string;
  category: string;
  milestone: string;
  completed: boolean;
}

export interface CycleReviewItem {
  id: string;
  periodType: string;
  periodLabel: string;
  wins: string;
  nextFocus: string;
  rating: number;
  createdAt: string;
}

export interface DailyReportItem {
  id: string;
  date: string;
  rating: number;
  focusHours: number;
  tasksDone: number;
  summary: string;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | string;
  content: string;
  agentUsed: string;
  createdAt: string;
}

export interface MissingWorkspaceItem {
  key: string;
  title: string;
  description: string;
  targetTab:
    | 'routine'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'tasks'
    | 'reminders'
    | 'habits'
    | 'productivity'
    | 'settings';
  actionLabel: string;
}

export interface TaskCompletionIntervalPoint {
  key: string;
  label: string;
  fullLabel: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  focusHours: number;
  rating?: number;
  objectivesTotal?: number;
  objectivesAvgProgress?: number;
}

export interface PlanPeriodCompletionPoint {
  period: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface ReportsResponse {
  reports: DailyReportItem[];
  summary: {
    streak: number;
    avgRating: number;
    totalFocusHours: number;
    totalTasksDone: number;
    routineTotal: number;
    routineCompleted: number;
    tasksTotal: number;
    tasksCompleted: number;
    weeklyTasksTotal: number;
    monthlyObjectivesTotal: number;
    yearlyGoalsTotal: number;
    habitsCount: number;
    habitCheckinsLast7Days: number;
  };
  intervals: {
    daily: TaskCompletionIntervalPoint[];
    weekly: TaskCompletionIntervalPoint[];
    monthly: TaskCompletionIntervalPoint[];
    byPlanPeriod: PlanPeriodCompletionPoint[];
  };
}

