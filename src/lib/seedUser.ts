import { prisma } from './prisma.ts';

export async function initializeNewUserWorkspace(userId: string, userName: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const firstName = userName.trim().split(/\s+/)[0] || 'Friend';

  await prisma.profile.create({
    data: {
      userId,
      city: 'Quetta, Balochistan, Pakistan',
      roleTitle: 'Student & Builder',
      primaryFocus: '',
      bio: '',
    },
  });

  await prisma.settings.create({
    data: {
      userId,
      language: 'English',
      wakeTime: '06:00',
      sleepTime: '22:30',
      dailyFocusTargetHours: 4.0,
      dashboardWidgets: 'focus,routine,tasks,reminders,habits,goals',
      focusMotto: `Stay steady, ${firstName}. One focused block at a time.`,
    },
  });

  // Light starter daily routine & one starter task so the workspace isn't overwhelming,
  // while Weekly Plan, Monthly Plan, Yearly Plan, Progress Report, and Profile Focus remain visibly missing for onboarding!
  await prisma.routineBlock.createMany({
    data: [
      {
        userId,
        title: 'Morning Focus & Priority Review',
        startTime: '08:00',
        endTime: '09:00',
        category: 'Focus',
        notes: 'Starter block — customize your full day in AI Routine Planner.',
        completed: false,
        sortOrder: 1,
      },
      {
        userId,
        title: 'Evening Walk & Exercise',
        startTime: '17:30',
        endTime: '18:15',
        category: 'Health',
        notes: 'Reset energy away from screens.',
        completed: false,
        sortOrder: 2,
      },
    ],
  });

  await prisma.task.create({
    data: {
      userId,
      title: 'Complete first 25-minute Focus Timer session',
      completed: false,
      dueDate: today,
      period: 'daily',
      category: 'Focus',
      priority: 'high',
      estimatedMinutes: 25,
      notes: 'Use the Focus Timer right on your dashboard.',
    },
  });

  await prisma.reminder.create({
    data: {
      userId,
      title: 'Morning Focus Kickoff',
      type: 'Focus',
      timeOfDay: '07:55',
      aiReason: '5 minutes before your morning focus block.',
      enabled: true,
    },
  });

  await prisma.habit.create({
    data: {
      userId,
      name: 'Daily Focus Session',
      category: 'Productivity',
      targetFrequency: 'Daily',
    },
  });
}
