import { GoogleGenAI, Type } from '@google/genai';

const MODEL_NAME = 'gemini-4-hydrogen';

export const AI_RULES = [
  'Never invent completed tasks, streaks, ratings, or progress.',
  'Work strictly with the real data saved in your workspace.',
  'Keep advice short, practical, and easy to follow.',
  'Focus on realistic time management rather than perfection.',
] as const;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GeneratedRoutineBlock {
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  notes: string;
}

export async function generateCustomRoutine(input: {
  userName: string;
  wakeTime: string;
  sleepTime: string;
  energyPeak: string;
  primaryGoals: string;
  includePrayerAndExercise: boolean;
  focusBlockMinutes: number;
}): Promise<{ summary: string; blocks: GeneratedRoutineBlock[] }> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI is waking up, try again in a minute.');
  }

  const systemInstruction = `You are a practical daily routine architect for ${input.userName}.
Design a realistic, customizable, beginner-friendly daily routine using 24-hour HH:MM time blocks between wakeTime and sleepTime.
Include clear breaks so the schedule is sustainable. No emojis.`;

  const prompt = `Build a complete daily routine from ${input.wakeTime} to ${input.sleepTime}:
- Energy peak: ${input.energyPeak}
- Main daily priorities: ${input.primaryGoals}
- Preferred deep focus block length: ${input.focusBlockMinutes} minutes
- Include Prayer & Physical Exercise blocks: ${input.includePrayerAndExercise ? 'Yes' : 'Optional light breaks'}

Return JSON with:
- summary: 1-2 sentence overview of why this schedule fits their energy peak
- blocks: 6 to 9 chronological time blocks covering the day (title, startTime in HH:MM, endTime in HH:MM, category one of "Focus" | "Wellness" | "Health" | "Break" | "Admin", notes 1 short sentence)`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  category: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ['title', 'startTime', 'endTime', 'category', 'notes'],
              },
            },
          },
          required: ['summary', 'blocks'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    return JSON.parse(raw) as { summary: string; blocks: GeneratedRoutineBlock[] };
  } catch (err) {
    console.error('Routine AI error:', err);
    throw new Error('AI is waking up, try again in a minute.');
  }
}

export interface BrokenDownSubtask {
  title: string;
  estimatedMinutes: number;
  priority: string;
  category: string;
}

export async function breakdownSmartTask(input: {
  taskTitle: string;
  context: string;
}): Promise<{ subtasks: BrokenDownSubtask[] }> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI is waking up, try again in a minute.');
  }

  const systemInstruction = `You are a Smart Task Builder assistant. Break a broad task into 3 to 5 small, concrete, beginner-friendly action steps that take 15 to 45 minutes each. No emojis.`;

  const prompt = `Break down this task into actionable sub-tasks:
Task: ${input.taskTitle}
Extra context: ${input.context || 'None'}

Return JSON with "subtasks" array (title, estimatedMinutes integer 10-60, priority "high" | "medium" | "low", category "Focus" | "Study" | "Work" | "Admin" | "Health").`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  priority: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['title', 'estimatedMinutes', 'priority', 'category'],
              },
            },
          },
          required: ['subtasks'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    return JSON.parse(raw) as { subtasks: BrokenDownSubtask[] };
  } catch (err) {
    console.error('Task breakdown AI error:', err);
    throw new Error('AI is waking up, try again in a minute.');
  }
}

export interface SuggestedReminder {
  title: string;
  type: string;
  timeOfDay: string;
  aiReason: string;
}

export async function suggestSmartReminders(input: {
  wakeTime: string;
  sleepTime: string;
  routineSummary: string[];
  pendingTasks: string[];
}): Promise<{ reminders: SuggestedReminder[] }> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI is waking up, try again in a minute.');
  }

  const systemInstruction = `You are a Smart Daily Reminder planner. Suggest 3 to 4 well-timed daily reminders that fit the user's real wake/sleep schedule and open tasks without spamming them. No emojis.`;

  const prompt = `User schedule:
- Wake: ${input.wakeTime}, Sleep: ${input.sleepTime}
- Routine blocks: ${input.routineSummary.join('; ') || 'None yet'}
- Open tasks: ${input.pendingTasks.join('; ') || 'None yet'}

Return JSON with "reminders" array (title, type "Focus" | "Prayer" | "Exercise" | "Wellness" | "Review", timeOfDay in HH:MM 24h format, aiReason 1 short sentence).`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reminders: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  timeOfDay: { type: Type.STRING },
                  aiReason: { type: Type.STRING },
                },
                required: ['title', 'type', 'timeOfDay', 'aiReason'],
              },
            },
          },
          required: ['reminders'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    return JSON.parse(raw) as { reminders: SuggestedReminder[] };
  } catch (err) {
    console.error('Smart reminder AI error:', err);
    throw new Error('AI is waking up, try again in a minute.');
  }
}

export interface UserContextSnapshot {
  userName: string;
  language: string;
  wakeTime: string;
  sleepTime: string;
  dailyFocusTargetHours: number;
  routineBlocks: { startTime: string; endTime: string; title: string; completed: boolean }[];
  tasksSummary: {
    total: number;
    completed: number;
    pendingTitles: string[];
  };
  remindersCount: number;
  habitsCount: number;
  goalsSummary: { title: string; progress: number; completed: boolean }[];
  reportsSummary: {
    count: number;
    latestRating: number | null;
    latestFocusHours: number | null;
  };
}

export async function generateAssistantReply(
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  context: UserContextSnapshot
): Promise<{ reply: string; agentUsed: string }> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI is waking up, try again in a minute.');
  }

  const systemInstruction = `You are FARAZ AI Coach, a focused daily routine, time management, and productivity coach for ${context.userName}.

STRICT HONESTY & STYLE RULES:
- NEVER invent completed tasks, streaks, focus hours, or ratings not present in REAL USER DATA below.
- If a metric is 0 or empty, acknowledge that honestly and suggest one tiny next step.
- Reply in ${context.language} (or match the language the user writes in).
- Keep replies concise (3 to 5 sentences or 3 clear bullet points), warm, and practical. No emojis.

REAL USER DATA:
${JSON.stringify(context, null, 2)}

Return JSON with:
- "agentUsed": one of "Daily Routine" | "Smart Tasks" | "Smart Reminders" | "Habit & Focus" | "Goal Productivity"
- "reply": your concise, honest response`;

  const conversationLines = history
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
    .join('\n');

  const prompt = conversationLines
    ? `Recent chat:\n${conversationLines}\n\nUser: ${userMessage}`
    : `User: ${userMessage}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            agentUsed: { type: Type.STRING },
            reply: { type: Type.STRING },
          },
          required: ['agentUsed', 'reply'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    const parsed = JSON.parse(raw) as { agentUsed?: string; reply?: string };
    if (!parsed.reply) {
      throw new Error('Empty AI response');
    }
    return {
      agentUsed: parsed.agentUsed || 'Daily Routine',
      reply: parsed.reply,
    };
  } catch (err) {
    console.error('Coach AI error:', err);
    throw new Error('AI is waking up, try again in a minute.');
  }
}

export async function generateProgressReportAnalysis(snapshot: {
  userName: string;
  routineTotal: number;
  routineCompleted: number;
  tasksTotal: number;
  tasksCompleted: number;
  weeklyTasksCount: number;
  monthlyObjectivesCount: number;
  yearlyGoalsCount: number;
  habitsCount: number;
  habitCheckinsLast7Days: number;
  reportsCount: number;
  avgRating: number;
  totalFocusHours: number;
  streak: number;
}): Promise<{ headline: string; strengths: string[]; gaps: string[]; nextAction: string }> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI is waking up, try again in a minute.');
  }

  const systemInstruction = `You are an honest Progress Report analyst for ${snapshot.userName}.
Analyze ONLY the real metrics below. Never invent completed tasks, hours, or streaks.
If something is 0, state clearly that it hasn't been logged yet and encourage one simple next step. No emojis.`;

  const prompt = `Generate a concise Progress Report based strictly on these real metrics:
${JSON.stringify(snapshot, null, 2)}

Return JSON with:
- headline: 1 crisp summary sentence
- strengths: 2 short honest observations of what is working (or what they've started)
- gaps: 2 short honest observations of what is missing or low
- nextAction: 1 concrete action to take today`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextAction: { type: Type.STRING },
          },
          required: ['headline', 'strengths', 'gaps', 'nextAction'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    return JSON.parse(raw) as {
      headline: string;
      strengths: string[];
      gaps: string[];
      nextAction: string;
    };
  } catch (err) {
    console.error('Progress analysis AI error:', err);
    throw new Error('AI is waking up, try again in a minute.');
  }
}
