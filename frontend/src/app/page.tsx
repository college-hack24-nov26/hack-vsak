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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 text-[var(--foreground)] transition-colors duration-300">

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/10 blur-[110px] transition-colors duration-300" />

        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/10 blur-[70px]" />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--surface-secondary)]/20" />
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-28 w-28 animate-pulse rounded-[2rem] bg-[var(--primary)]/20 blur-2xl" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xl shadow-[var(--primary)]/20">
            <Zap className="h-8 w-8 fill-current" />
          </div>
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            One<span className="text-[var(--primary)]">API</span>
          </h1>

          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
            Developer Gateway
          </p>
        </div>

        {/* Loading Message */}
        <div className="mt-2 space-y-2 text-center">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Connecting to OneAPI
          </h2>

          <p className="text-xs text-[var(--muted)]">
            Preparing your developer workspace...
          </p>
        </div>

        {/* Loading Bar */}
        <div className="h-1 w-40 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--primary)]" />
        </div>

        {/* Footer */}
        <p className="mt-3 text-[10px] font-medium tracking-wide text-[var(--muted)]">
          SECURE API INFRASTRUCTURE
        </p>
      </div>
    </main>
  );
}