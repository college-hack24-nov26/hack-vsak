
'use client';

import React, { useEffect, useState } from 'react';
import {
  UserCircle,
  Mail,
  Phone,
  Shield,
  Key,
  UserRound,
  ShieldCheck,
  Clock3,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

interface ProfileUser {
  name?: string;
  email?: string;
  phone_no?: string;
  role?: string;
  user_id?: string;
  _id?: string;
  isVerified?: boolean;
  terms_accepted?: boolean;
  createdAt?: string;
}

const detailItems = [
  { label: 'Developer User ID', icon: Key, key: 'id' },
  { label: 'Email Address', icon: Mail, key: 'email' },
  { label: 'Phone Number', icon: Phone, key: 'phone' },
  { label: 'Account Created', icon: CalendarDays, key: 'created' },
] as const;

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = authStorage.getUser();

    if (cached) {
      setUser(cached);
    }

    fetchApi('/api/v1/auth/me')
      .then((res) => {
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          authStorage.setUser(res.data.user);
        } else {
          setError(
            res.error?.message ||
            'Unable to retrieve your profile information.'
          );
        }
      })
      .catch((err: any) => {
        console.error('Failed to load profile:', err);
        setError(
          err.message || 'Unable to connect to the account service.'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'DV';

  const accountCreated = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not available';

  const details: Record<string, string> = {
    id: user?.user_id || user?._id || 'Not available',
    email: user?.email || 'Not available',
    phone: user?.phone_no || 'Not available',
    created: accountCreated,
  };

  const securityItems = [
    {
      label: 'Terms & Conditions',
      value: user?.terms_accepted ? 'Accepted' : 'Pending',
      success: !!user?.terms_accepted,
      icon: Shield,
    },
    {
      label: 'Email Verification',
      value: user?.isVerified ? 'Verified' : 'Pending',
      success: !!user?.isVerified,
      icon: Mail,
    },
    {
      label: 'Account Registration',
      value: accountCreated,
      success: !!user?.createdAt,
      icon: Clock3,
    },
  ];

  if (loading && !user) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-[var(--muted)]">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]">
          <Loader2
            size={26}
            className="animate-spin text-[var(--primary)]"
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Loading your profile
          </p>
          <p className="mt-1 text-xs">
            Retrieving your account information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10 text-[var(--foreground)]">

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-[0.18em] text-[var(--primary)]">
            ACCOUNT MANAGEMENT
          </span>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Manage and review your OneAPI developer account information.
          </p>
        </div>

        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--primary)]">
          <UserRound size={22} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Profile Overview */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-[var(--primary)]/10 blur-3xl" />

        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-xl font-extrabold text-white shadow-lg sm:size-20 sm:text-2xl">
              {initials}
            </div>

            <div className="min-w-0">
              <span className="text-[9px] font-bold tracking-widest text-[var(--muted)]">
                DEVELOPER ACCOUNT
              </span>

              <h2 className="mt-1 truncate text-xl font-extrabold sm:text-2xl">
                {user?.name || 'Developer'}
              </h2>

              <p className="mt-1 break-all text-xs text-[var(--muted)]">
                {user?.email || 'No email available'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1 text-[9px] font-bold uppercase text-[var(--primary)]">
                  <UserCircle size={12} />
                  {user?.role || 'USER'}
                </span>

                {user?.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--success)]/10 px-2.5 py-1 text-[9px] font-bold text-[var(--success)]">
                    <CheckCircle2 size={12} />
                    Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-yellow)]/10 px-2.5 py-1 text-[9px] font-bold text-[var(--accent-yellow)]">
                    <AlertCircle size={12} />
                    Verification Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-[10px] font-semibold text-[var(--muted)]">
            <ShieldCheck size={14} className="text-[var(--success)]" />
            OneAPI Developer
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold">
              Personal Information
            </h3>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Your registered account details.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1.5 text-[9px] font-semibold text-[var(--muted)]">
            <ShieldCheck size={13} />
            Account Details
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {detailItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)]/10">
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-[var(--muted)]">
                    {item.label}
                  </p>

                  <p
                    className={`mt-1 break-all text-xs font-bold ${
                      item.key === 'id' ? 'font-mono' : ''
                    }`}
                    title={details[item.key]}
                  >
                    {details[item.key]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Account Security */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold">
              Account & Security
            </h3>
          </div>

          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Verification and account compliance status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {securityItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--primary)]">
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[var(--muted)]">
                    {item.label}
                  </p>

                  <p
                    className={`mt-1 break-words text-xs font-bold ${
                      item.success
                        ? 'text-[var(--success)]'
                        : 'text-[var(--accent-yellow)]'
                    }`}
                  >
                    {item.value}
                  </p>
                </div>

                {item.success ? (
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-[var(--success)]"
                  />
                ) : (
                  <AlertCircle
                    size={18}
                    className="shrink-0 text-[var(--accent-yellow)]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[11px] text-[var(--muted)]">
        <ShieldCheck
          size={16}
          className="shrink-0 text-[var(--success)]"
        />
        Your account information is managed securely by OneAPI.
      </div>
    </div>
  );
}
