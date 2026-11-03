
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { authStorage } from '@/lib/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = authStorage.getToken();

    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-2xl bg-[var(--primary)]/10 blur-xl animate-pulse" />

          <div className="relative w-12 h-12 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <h1 className="text-sm font-semibold tracking-tight">
            Connecting to OneAPI
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Preparing your developer workspace...
          </p>
        </div>

        <div className="w-32 h-1 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-[var(--primary)] animate-pulse" />
        </div>
      </div>
    </main>
  );
}
