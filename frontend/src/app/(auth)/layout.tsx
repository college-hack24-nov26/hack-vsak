
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, ShieldCheck, Activity, Workflow, Code2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeProvider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page min-h-screen bg-[var(--background)] text-[var(--foreground)]">

      {/* Top navigation */}
      <header className="auth-nav max-w-[1240px] mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Zap className="w-5 h-5 fill-current" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            One<span className="text-blue-600">API</span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <Link href="/" className="hidden sm:block text-sm text-[var(--muted)] hover:text-blue-600">
            Home
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Authentication content */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5 sm:py-8">
        <div className="auth-main-grid grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] rounded-2xl overflow-hidden">

          {/* LEFT: Form */}
          <section className="auth-form-area flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-[480px]">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-[var(--muted)] hover:text-blue-600 mb-9"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to home
              </Link>

              {children}

            </div>
          </section>

          {/* RIGHT: Visual panel */}
        
{/* RIGHT: Atmospheric branding panel */}
<section className="auth-visual-panel relative overflow-hidden hidden lg:flex flex-col justify-between p-10 xl:p-14">

  {/* Background decoration */}
  <div className="auth-visual-glow" />
  <div className="auth-visual-orbit orbit-one" />
  <div className="auth-visual-orbit orbit-two" />

  {/* Top label */}
  <div className="relative z-10">
    <span className="auth-status-badge inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs">
      <span className="gateway-status-dot" />
      API infrastructure, simplified
    </span>
  </div>

  {/* Main branding */}
  <div className="relative z-10 max-w-lg my-auto py-16">

    <div className="auth-illustration-mark mb-10">
      <Zap className="w-9 h-9 text-white fill-white" />
    </div>

    <p className="text-xs font-semibold uppercase tracking-[0.2em] auth-eyebrow mb-5">
      The unified API platform
    </p>

    <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.15] auth-visual-heading">
      One connection.
      <br />
      <span className="auth-highlight">
        Endless possibilities.
      </span>
    </h2>

    <p className="text-sm leading-7 mt-6 max-w-sm auth-visual-description">
      Connect multiple API providers through one intelligent
      gateway. Simplify integrations, manage requests and
      keep your applications running.
    </p>

    {/* Gateway features */}
   
{/* Gateway features */}
<div className="mt-10 space-y-3">

  <div className="auth-feature flex flex-row flex-nowrap items-center gap-3">
    <Workflow className="w-4 h-4 shrink-0" />
    <span className="flex-1 min-w-0 whitespace-nowrap">
      Intelligent API routing
    </span>
    <span className="auth-feature-status ml-auto shrink-0">
      Active
    </span>
  </div>

  <div className="auth-feature flex flex-row flex-nowrap items-center gap-3">
    <Activity className="w-4 h-4 shrink-0" />
    <span className="flex-1 min-w-0 whitespace-nowrap">
      Automatic failover
    </span>
    <span className="auth-feature-status ml-auto shrink-0">
      Ready
    </span>
  </div>

  <div className="auth-feature flex flex-row flex-nowrap items-center gap-3">
    <Code2 className="w-4 h-4 shrink-0" />
    <span className="flex-1 min-w-0 whitespace-nowrap">
      Unified API integration
    </span>
    <span className="auth-feature-status ml-auto shrink-0">
      Connected
    </span>
  </div>

</div>


    {/* Animated availability */}
    <div className="mt-9">
      <div className="flex justify-between text-xs mb-3">
        <span className="auth-secondary-text">Gateway availability</span>
        <span className="gateway-ready-text">Monitoring</span>
      </div>

      <div className="gateway-progress-track">
        <div className="gateway-progress-fill" />
      </div>
    </div>

  </div>

  {/* Bottom branding */}
  <div className="relative z-10 flex justify-between items-center">
    <span className="text-xs auth-secondary-text">
      Built for modern developers
    </span>

    <span className="text-xl font-bold tracking-tight auth-watermark">
      OneAPI<span className="text-blue-500">.</span>
    </span>
  </div>

</section>

        </div>

        <footer className="text-center text-xs text-[var(--muted)] mt-6">
          © {new Date().getFullYear()} OneAPI. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
