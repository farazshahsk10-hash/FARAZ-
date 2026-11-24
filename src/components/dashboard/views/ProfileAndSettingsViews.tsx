import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import type { AuthUser, UserProfile, UserSettings } from '../../../types';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input, Textarea } from '../../ui/input';

interface ProfileSettingsViewProps {
  onUserUpdated: (user: AuthUser) => void;
}

const WIDGET_OPTIONS = [
  { id: 'focus', label: 'Focus Timer' },
  { id: 'routine', label: "Today's Routine" },
  { id: 'tasks', label: 'Priority Tasks' },
  { id: 'reminders', label: 'AI Coach Card' },
  { id: 'goals', label: 'Goal Productivity' },
];

export function ProfileSettingsView({ onUserUpdated }: ProfileSettingsViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [primaryFocus, setPrimaryFocus] = useState('');
  const [bio, setBio] = useState('');

  const [language, setLanguage] = useState('English');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepTime, setSleepTime] = useState('22:30');
  const [dailyFocusTargetHours, setDailyFocusTargetHours] = useState('4');
  const [focusMotto, setFocusMotto] = useState('One focused block at a time.');
  const [widgets, setWidgets] = useState<string[]>(['focus', 'routine', 'tasks', 'reminders', 'goals']);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ user: AuthUser; profile: UserProfile | null; settings: UserSettings | null }>(
          '/api/profile-settings'
        );
        setName(res.user.name);
        setEmail(res.user.email);
        if (res.profile) {
          setCity(res.profile.city);
          setRoleTitle(res.profile.roleTitle);
          setPrimaryFocus(res.profile.primaryFocus);
          setBio(res.profile.bio);
        }
        if (res.settings) {
          setLanguage(res.settings.language);
          setWakeTime(res.settings.wakeTime);
          setSleepTime(res.settings.sleepTime);
          setDailyFocusTargetHours(String(res.settings.dailyFocusTargetHours));
          setFocusMotto(res.settings.focusMotto);
          setWidgets(res.settings.dashboardWidgets.split(',').filter(Boolean));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile & settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggleWidget(id: string) {
    setWidgets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    setError(null);
    try {
      const res = await apiFetch<{ user: AuthUser }>('/api/profile-settings', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          city,
          roleTitle,
          primaryFocus,
          bio,
          language,
          wakeTime,
          sleepTime,
          dailyFocusTargetHours: Number(dailyFocusTargetHours) || 4,
          focusMotto,
          dashboardWidgets: widgets.join(','),
        }),
      });
      onUserUpdated(res.user);
      setSavedNotice(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#3B2A1E]">Profile &amp; Personalization</h1>
        <p className="text-sm text-[#7A6A58]">
          Customize your daily schedule boundaries, dashboard widgets, and profile details.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]">
          {error}
        </div>
      )}

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-[0.625rem] border border-[#5F7A5A]/35 bg-[#5F7A5A]/12 px-4 py-3 text-sm font-medium text-[#5F7A5A]">
          <CheckCircle2 className="h-4 w-4" />
          Profile and personalization preferences saved.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Details &amp; Schedule Defaults</CardTitle>
          <CardDescription>Account email: {email}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="ps-name" className="block text-xs font-medium text-[#7A6A58]">
                    Full Name
                  </label>
                  <Input id="ps-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ps-role" className="block text-xs font-medium text-[#7A6A58]">
                    Role (e.g., Student, Developer)
                  </label>
                  <Input id="ps-role" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ps-city" className="block text-xs font-medium text-[#7A6A58]">
                    City
                  </label>
                  <Input id="ps-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ps-lang" className="block text-xs font-medium text-[#7A6A58]">
                    AI Coach Language
                  </label>
                  <select
                    id="ps-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="flex min-h-[44px] sm:min-h-[40px] w-full rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#3B2A1E]"
                  >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Balochi">Balochi</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="ps-wake" className="block text-xs font-medium text-[#7A6A58]">
                    Default Wake Time
                  </label>
                  <Input id="ps-wake" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ps-sleep" className="block text-xs font-medium text-[#7A6A58]">
                    Default Sleep Time
                  </label>
                  <Input id="ps-sleep" type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ps-target" className="block text-xs font-medium text-[#7A6A58]">
                    Daily Focus Target (hrs)
                  </label>
                  <Input
                    id="ps-target"
                    type="number"
                    min={0.5}
                    max={16}
                    step={0.5}
                    value={dailyFocusTargetHours}
                    onChange={(e) => setDailyFocusTargetHours(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ps-motto" className="block text-xs font-medium text-[#7A6A58]">
                  Dashboard Focus Motto
                </label>
                <Input id="ps-motto" value={focusMotto} onChange={(e) => setFocusMotto(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ps-focus" className="block text-xs font-medium text-[#7A6A58]">
                  Primary Focus Area
                </label>
                <Input id="ps-focus" value={primaryFocus} onChange={(e) => setPrimaryFocus(e.target.value)} />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-[#7A6A58]">Visible Dashboard Widgets</p>
                <div className="flex flex-wrap gap-2">
                  {WIDGET_OPTIONS.map((w) => (
                    <label
                      key={w.id}
                      className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] px-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={widgets.includes(w.id)}
                        onChange={() => toggleWidget(w.id)}
                        className="h-4 w-4 accent-[#9E2B25]"
                      />
                      <span>{w.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ps-bio" className="block text-xs font-medium text-[#7A6A58]">
                  Short Bio
                </label>
                <Textarea id="ps-bio" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
