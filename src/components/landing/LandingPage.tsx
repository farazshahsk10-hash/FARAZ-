import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  CheckSquare,
  Clock,
  ListTodo,
  Menu,
  ShieldCheck,
  TrendingUp,
  WandSparkles,
  X,
} from 'lucide-react';
import type { AuthUser } from '../../types';
import { AuthCard } from '../auth/AuthCard';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface LandingPageProps {
  onAuthenticated: (user: AuthUser) => void;
}

const FEATURES = [
  {
    icon: WandSparkles,
    title: 'Customizable AI Daily Routine Planner',
    description: 'Generate a realistic time-blocked schedule around your wake time, energy peak, and breaks — then edit any block freely.',
  },
  {
    icon: Clock,
    title: 'Daily, Weekly, Monthly & Yearly Plans',
    description: 'Connect today’s schedule with weekly priorities, monthly objectives, and clear yearly milestones in one place.',
  },
  {
    icon: ListTodo,
    title: 'Smart Task Builder & AI Breakdown',
    description: 'Organize daily tasks by priority, category, and minutes — or split big tasks into clear steps with AI.',
  },
  {
    icon: Bell,
    title: 'AI-Powered Daily Reminders',
    description: 'Get smart reminder timings for deep focus blocks, prayer, hydration, and exercise without notification clutter.',
  },
  {
    icon: CheckSquare,
    title: 'Habit Tracker',
    description: 'Build lasting daily consistency with a visual 7-day habit grid and honest streak tracking.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Report & Focus Timer',
    description: 'View completion rates, focus hours, daily score charts, and AI Progress Reports grounded in your real activity.',
  },
];

export function LandingPage({ onAuthenticated }: LandingPageProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function scrollToJoin(mode: 'signin' | 'signup') {
    setAuthMode(mode);
    setMobileMenuOpen(false);
    const el = document.getElementById('join');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#3B2A1E]">
      {/* Sticky Dark Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#C89B5A]/20 bg-[#2E1F16]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="#top"
            className="font-display text-lg font-extrabold tracking-tight text-[#FAF7F0] whitespace-nowrap shrink-0"
          >
            FARAZ AI
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#FAF7F0]/85 md:flex" aria-label="Main navigation">
            <a href="#features" className="hover:text-[#C89B5A] transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#routine" className="hover:text-[#C89B5A] transition-colors whitespace-nowrap shrink-0">
              Routine AI
            </a>
            <a href="#how" className="hover:text-[#C89B5A] transition-colors whitespace-nowrap shrink-0">
              How it works
            </a>
            <a href="#assistant" className="hover:text-[#C89B5A] transition-colors whitespace-nowrap shrink-0">
              AI Coach
            </a>
          </nav>

          <div className="hidden items-center gap-2.5 md:flex shrink-0">
            <PWAInstallButton variant="navbar" />
            <Button variant="ghostLight" size="sm" onClick={() => scrollToJoin('signin')}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => scrollToJoin('signup')}>
              Get started free
            </Button>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[0.625rem] text-[#FAF7F0] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B5A] md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#C89B5A]/20 bg-[#2E1F16] px-4 py-4 md:hidden">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-[#FAF7F0]">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-[0.625rem] px-3 hover:bg-white/10"
              >
                Features
              </a>
              <a
                href="#routine"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-[0.625rem] px-3 hover:bg-white/10"
              >
                Routine AI
              </a>
              <a
                href="#how"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-[0.625rem] px-3 hover:bg-white/10"
              >
                How it works
              </a>
              <a
                href="#assistant"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-[0.625rem] px-3 hover:bg-white/10"
              >
                AI Coach
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <PWAInstallButton variant="navbar" className="w-full" />
                <Button variant="outlineLight" className="w-full" onClick={() => scrollToJoin('signin')}>
                  Sign in
                </Button>
                <Button className="w-full" onClick={() => scrollToJoin('signup')}>
                  Get started free
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="top" className="relative overflow-hidden dark-balochi-glow text-[#FAF7F0]">
        <div className="balochi-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
          <div className="space-y-6 lg:col-span-6">
            <p className="text-sm font-semibold tracking-wide text-[#C89B5A]">
              AI Daily Routine × Smart Task Builder
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-[#FAF7F0] sm:text-5xl [text-wrap:balance]">
              Plan Every Day.{' '}
              <span className="text-[#C89B5A]">Master Your Focus</span> with AI.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#FAF7F0]/80 sm:text-lg">
              A beginner-friendly AI daily routine planner, smart task builder, and smart reminder workspace. Organize daily tasks efficiently, track habits and goal productivity, and personalize your focus dashboard.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="lg" onClick={() => scrollToJoin('signup')}>
                Start free today
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outlineLight"
                size="lg"
                onClick={() => {
                  document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                See how it works
              </Button>
            </div>
          </div>

          {/* Right Mock App Preview + Floating Cards */}
          <div className="relative mx-auto w-full max-w-lg py-6 lg:col-span-6">
            <div className="relative z-10 rounded-[0.625rem] border border-[#C89B5A]/30 bg-[#FFFDF8] p-5 text-[#3B2A1E] shadow-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-[#E5D9C3] pb-4">
                <div>
                  <p className="text-xs font-medium text-[#7A6A58]">Today’s AI Routine</p>
                  <p className="font-display text-lg font-bold text-[#3B2A1E]">
                    Good morning, Ahmed
                  </p>
                </div>
                <span className="text-xs font-semibold tabular-nums text-[#5F7A5A]">
                  2 of 4 blocks done
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#5F7A5A] shrink-0" />
                    <span className="text-sm font-medium line-through text-[#7A6A58]">
                      Morning Fajr &amp; day review
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#7A6A58]">06:00</span>
                </div>

                <div className="flex items-center justify-between rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#5F7A5A] shrink-0" />
                    <span className="text-sm font-medium line-through text-[#7A6A58]">
                      90-min deep focus block
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#7A6A58]">08:30</span>
                </div>

                <div className="flex items-center justify-between rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-4 w-4 rounded-[0.25rem] border border-[#9E2B25] shrink-0" />
                    <span className="text-sm font-medium text-[#3B2A1E]">
                      Smart Task: Finish project slides
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#9E2B25] font-medium">14:30</span>
                </div>

                <div className="flex items-center justify-between rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-4 w-4 rounded-[0.25rem] border border-[#C89B5A] shrink-0" />
                    <span className="text-sm font-medium text-[#3B2A1E]">
                      Reminder: Evening walk &amp; log
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#7A6A58]">17:30</span>
                </div>
              </div>
            </div>

            <div className="float-slow relative z-20 mt-4 grid grid-cols-2 gap-3 sm:mt-0">
              <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5 text-[#3B2A1E] shadow-lg sm:absolute sm:-left-6 sm:-top-64">
                <p className="text-[11px] font-medium text-[#7A6A58]">Productivity</p>
                <p className="font-display text-lg font-bold tabular-nums text-[#9E2B25]">8.6 / 10</p>
              </div>

              <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5 text-[#3B2A1E] shadow-lg sm:absolute sm:-right-4 sm:-top-56 float-slower">
                <p className="text-[11px] font-medium text-[#7A6A58]">Focus Timer</p>
                <p className="font-display text-lg font-bold tabular-nums text-[#3B2A1E]">4.5 hrs</p>
              </div>

              <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5 text-[#3B2A1E] shadow-lg sm:absolute sm:-left-4 sm:-bottom-5 float-slower">
                <p className="text-[11px] font-medium text-[#7A6A58]">Reminders</p>
                <p className="font-display text-lg font-bold tabular-nums text-[#5F7A5A]">5 active</p>
              </div>

              <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5 text-[#3B2A1E] shadow-lg sm:absolute sm:-right-6 sm:-bottom-4 float-slow">
                <p className="text-[11px] font-medium text-[#7A6A58]">Habit Streak</p>
                <p className="font-display text-lg font-bold tabular-nums text-[#B07A3F]">7 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars Bar */}
      <section className="border-y border-[#E5D9C3] bg-[#F3ECDF]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-9 sm:px-6 lg:grid-cols-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-display text-lg font-extrabold text-[#9E2B25]">AI Routine Planner</p>
            <p className="text-xs text-[#7A6A58]">Custom time-blocked days</p>
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-display text-lg font-extrabold text-[#9E2B25]">Smart Task Builder</p>
            <p className="text-xs text-[#7A6A58]">Priority &amp; AI task breakdown</p>
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-display text-lg font-extrabold text-[#9E2B25]">Smart Reminders</p>
            <p className="text-xs text-[#7A6A58]">AI-timed focus &amp; wellness alerts</p>
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-display text-lg font-extrabold text-[#9E2B25]">Plans &amp; Reports</p>
            <p className="text-xs text-[#7A6A58]">Daily to yearly plans &amp; progress charts</p>
          </div>
        </div>
      </section>

      {/* Features (6 Focused Cards) */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold text-[#9E2B25]">Focused Productivity Toolkit</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#3B2A1E] sm:text-4xl [text-wrap:balance]">
            Everything you need to organize your day — nothing extra
          </h2>
          <p className="text-base text-[#7A6A58]">
            Clean, beginner-friendly tools built to improve time management, focus, and daily consistency.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[0.625rem] border border-[#E5D9C3] bg-[#F3ECDF] text-[#9E2B25]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-[#3B2A1E]">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-[#7A6A58]">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="embroidered-divider" />
      </div>

      {/* Routine AI & Smart Reminders Spotlight */}
      <section id="routine" className="relative mt-16 overflow-hidden dark-balochi-glow py-16 text-[#FAF7F0] lg:py-20">
        <div className="balochi-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-6">
              <p className="text-sm font-semibold text-[#C89B5A]">Built around your energy</p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#FAF7F0] sm:text-4xl">
                Customizable AI Routine &amp; Smart Reminders
              </h2>
              <p className="text-base leading-relaxed text-[#FAF7F0]/80">
                Set your wake time, sleep time, and peak focus window. AI builds a realistic day with deep work blocks, breaks, prayer, and exercise — then suggests smart reminders right before key transitions.
              </p>
              <ul className="space-y-2.5 text-sm text-[#FAF7F0]/90">
                <li className="flex items-center gap-3">
                  <span className="diamond-bullet" aria-hidden="true" />
                  Edit any generated time block inline anytime
                </li>
                <li className="flex items-center gap-3">
                  <span className="diamond-bullet" aria-hidden="true" />
                  Split overwhelming tasks into 15–45 min steps
                </li>
                <li className="flex items-center gap-3">
                  <span className="diamond-bullet" aria-hidden="true" />
                  Toggle dashboard widgets to fit your workflow
                </li>
              </ul>
            </div>

            <div className="rounded-[0.625rem] border border-[#C89B5A]/30 bg-[#FFFDF8] p-6 text-[#3B2A1E] shadow-lg lg:col-span-6">
              <div className="flex items-center justify-between border-b border-[#E5D9C3] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#9E2B25]" />
                  <span className="font-display text-base font-bold">Sample AI Schedule</span>
                </div>
                <span className="text-xs font-semibold text-[#5F7A5A]">Morning Peak</span>
              </div>
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between rounded-[0.5rem] bg-[#FAF7F0] px-3 py-2">
                  <span className="font-mono text-xs font-bold text-[#9E2B25]">06:00 – 06:45</span>
                  <span className="font-medium">Fajr, Hydration &amp; Priority Check</span>
                </div>
                <div className="flex items-center justify-between rounded-[0.5rem] bg-[#FAF7F0] px-3 py-2">
                  <span className="font-mono text-xs font-bold text-[#9E2B25]">08:30 – 10:30</span>
                  <span className="font-medium">Deep Focus Block (Phone Silent)</span>
                </div>
                <div className="flex items-center justify-between rounded-[0.5rem] bg-[#FAF7F0] px-3 py-2">
                  <span className="font-mono text-xs font-bold text-[#9E2B25]">15:00 – 15:15</span>
                  <span className="font-medium">Smart Reminder: Hydration &amp; Stretch</span>
                </div>
                <div className="flex items-center justify-between rounded-[0.5rem] bg-[#FAF7F0] px-3 py-2">
                  <span className="font-mono text-xs font-bold text-[#9E2B25]">17:30 – 18:15</span>
                  <span className="font-medium">Evening Walk &amp; Daily Log</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-xl space-y-2">
          <p className="text-sm font-semibold text-[#9E2B25]">How it works</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#3B2A1E] sm:text-4xl">
            Beginner-friendly setup in three simple steps
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <span className="font-display text-3xl font-extrabold tabular-nums text-[#C89B5A]">01</span>
              <CardTitle className="pt-2 text-lg">Personalize your schedule.</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[#7A6A58]">
                Create your free account and choose your wake time, daily focus hours goal, and preferred dashboard widgets.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <span className="font-display text-3xl font-extrabold tabular-nums text-[#C89B5A]">02</span>
              <CardTitle className="pt-2 text-lg">Build your AI routine &amp; tasks.</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[#7A6A58]">
                Generate a customizable daily routine, break large tasks into smaller steps, and activate smart reminders.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <span className="font-display text-3xl font-extrabold tabular-nums text-[#C89B5A]">03</span>
              <CardTitle className="pt-2 text-lg">Track habits &amp; goal productivity.</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[#7A6A58]">
                Use the focus timer, check off habits daily, and watch your productivity streak grow honestly over time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Coach Section */}
      <section id="assistant" className="border-y border-[#E5D9C3] bg-[#F3ECDF] py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <p className="text-sm font-semibold text-[#9E2B25]">Focused Guidance</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#3B2A1E] sm:text-4xl">
              An honest AI Coach for time management
            </h2>
            <p className="text-base leading-relaxed text-[#7A6A58]">
              Your AI Coach reads only your real saved routine, tasks, habits, and goals. It never invents fake progress and gives concise, practical help when your day gets busy.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[0.625rem] border border-[#C89B5A]/30 dark-balochi-glow p-5 text-[#FAF7F0] shadow-lg sm:p-6">
              <div className="balochi-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Bot className="h-5 w-5 text-[#C89B5A]" />
                    <span className="font-display text-sm font-bold">FARAZ AI Coach</span>
                  </div>
                  <span className="text-xs text-[#C89B5A]">Daily Routine &amp; Focus</span>
                </div>
                <div className="space-y-3">
                  <div className="ml-auto max-w-[85%] rounded-[0.625rem] bg-[#9E2B25] px-4 py-3 text-sm text-[#FAF7F0]">
                    I missed my morning block. How should I organize the next 2 hours?
                  </div>
                  <div className="max-w-[90%] rounded-[0.625rem] border border-white/15 bg-white/10 px-4 py-3 text-sm leading-relaxed text-[#FAF7F0]/95">
                    No stress — you still have 2 open high-priority tasks. Start a 45-minute Focus Timer on your top task now, take a 10-minute walk, then knock out one 25-minute quick win before your evening reminder.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Bar */}
      <section className="border-b border-[#E5D9C3] bg-[#FFFDF8] py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 text-center sm:px-6">
          <ShieldCheck className="h-5 w-5 text-[#5F7A5A] shrink-0" />
          <p className="text-sm font-semibold text-[#3B2A1E]">
            Your data stays yours. No selling, no spam, ever.
          </p>
        </div>
      </section>

      {/* Join Section */}
      <section id="join" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col items-center">
          <AuthCard defaultMode={authMode} onSuccess={onAuthenticated} />
        </div>
      </section>

      {/* Footer */}
      <footer className="dark-balochi-glow relative border-t border-[#C89B5A]/20 text-[#FAF7F0]">
        <div className="balochi-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <p className="font-display text-lg font-extrabold tracking-tight text-[#FAF7F0]">FARAZ AI</p>
            <p className="text-sm text-[#FAF7F0]/75">
              AI Daily Routine Planner, Smart Task Builder &amp; Focus Workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-[#FAF7F0]/80">
            <a href="#features" className="hover:text-[#C89B5A] transition-colors">Features</a>
            <a href="#routine" className="hover:text-[#C89B5A] transition-colors">Routine AI</a>
            <a href="#how" className="hover:text-[#C89B5A] transition-colors">How it works</a>
            <a href="#assistant" className="hover:text-[#C89B5A] transition-colors">AI Coach</a>
            <a href="#join" className="hover:text-[#C89B5A] transition-colors">Join</a>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-[#FAF7F0]/65 sm:flex-row sm:px-6">
            <p>© {new Date().getFullYear()} FARAZ AI — Personal Routine &amp; Productivity</p>
            <p>Quetta, Balochistan, Pakistan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
