import React, { useEffect, useState } from 'react';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { apiFetch, setClientSessionToken } from '../../lib/api';
import type { AuthUser } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AuthCardProps {
  defaultMode?: 'signin' | 'signup';
  onSuccess: (user: AuthUser) => void;
}

export function AuthCard({ defaultMode = 'signup', onSuccess }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(defaultMode);
    setError(null);
  }, [defaultMode]);

  async function handleSubmit(e: React.FormEvent, targetMode: 'signin' | 'signup') {
    e.preventDefault();
    setError(null);

    if (targetMode === 'signup' && name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email.trim().includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = targetMode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const payload =
        targetMode === 'signup'
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password };

      const data = await apiFetch<{ user: AuthUser; token: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setClientSessionToken(data.token);
      onSuccess(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-[#E5D9C3] bg-[#FFFDF8] shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-[#3B2A1E]">Join FARAZ AI today</CardTitle>
        <CardDescription className="text-[#7A6A58]">
          Your daily study system, English tracker, and Hamar Career AI workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(val) => {
            setMode(val as 'signin' | 'signup');
            setError(null);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-3.5 py-2.5 text-sm text-[#9E2B25]"
            >
              {error}
            </div>
          )}

          <TabsContent value="signin">
            <form onSubmit={(e) => handleSubmit(e, 'signin')} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="signin-email" className="block text-sm font-medium text-[#3B2A1E]">
                  Email address
                </label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="faraz@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signin-password" className="block text-sm font-medium text-[#3B2A1E]">
                  Password
                </label>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign in to workspace
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={(e) => handleSubmit(e, 'signup')} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="block text-sm font-medium text-[#3B2A1E]">
                  Full name
                </label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Faraz Shah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="block text-sm font-medium text-[#3B2A1E]">
                  Email address
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="faraz@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="block text-sm font-medium text-[#3B2A1E]">
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create free account
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
