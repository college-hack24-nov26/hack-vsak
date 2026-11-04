
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { fetchApi, authStorage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetchApi('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res.success) {
        if (res.error?.code === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
          return;
        }

        setError(res.error?.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (res.data?.tokens) {
        authStorage.setToken(res.data.tokens.accessToken);
        authStorage.setRefreshToken(res.data.tokens.refreshToken);
        authStorage.setUser(res.data.user);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10';

  return (
    <div className="w-full max-w-[440px] mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-5">
          <LogIn className="w-5 h-5 text-blue-600" />
        </div>

        <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">
          Welcome back
        </h1>

        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Sign in to access your OneAPI developer workspace.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm"
        >
          {error}
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleLogin} className="space-y-5">

        {/* Email */}
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
            Email address
          </label>

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-medium text-slate-700">
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${inputClass} pr-11`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            'Signing in...'
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Signup link */}
      <div className="mt-7 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link
          href="/signup"
          className="text-blue-600 font-semibold hover:text-blue-700"
        >
          Create an account
        </Link>
      </div>

      {/* Security */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        Secure authentication powered by OneAPI
      </div>
    </div>
  );
}
