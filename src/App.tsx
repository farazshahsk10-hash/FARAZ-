import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { LandingPage } from './components/landing/LandingPage';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { apiFetch } from './lib/api';
import type { AuthUser } from './types';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<{ user: AuthUser }>('/api/auth/me');
        if (active) {
          setUser(res.user);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setCheckingAuth(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F0] text-[#3B2A1E]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#9E2B25]" />
          <p className="text-sm font-medium text-[#7A6A58]">Loading FARAZ AI...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <LandingPage onAuthenticated={(loggedInUser) => setUser(loggedInUser)} />
      ) : (
        <DashboardLayout
          user={user}
          onUserUpdated={(updated) => setUser(updated)}
          onSignedOut={() => setUser(null)}
        />
      )}
      <OfflineIndicator />
    </>
  );
}
