
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  LogOut,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Settings2,
  Fingerprint,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = (() => {
    if (!newPassword) return 0;

    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    return score;
  })();

  const strengthLabel = [
    'Very weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
  ][passwordStrength];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordChangeMsg({
        type: 'error',
        text: 'New passwords do not match.',
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeMsg({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordChangeMsg({
        type: 'error',
        text: 'Your new password must be different from your current password.',
      });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetchApi('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.success) {
        setPasswordChangeMsg({
          type: 'success',
          text: 'Your password has been successfully updated.',
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordChangeMsg({
          type: 'error',
          text: res.error?.message || 'Failed to update password.',
        });
      }
    } catch (err: any) {
      setPasswordChangeMsg({
        type: 'error',
        text: err.message || 'An error occurred while updating your password.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetchApi('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue clearing local authentication state.
    }

    authStorage.clear();
    router.push('/login');
  };

  const inputClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-11 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10';

  const labelClass =
    'mb-2 block text-xs font-semibold tracking-wide text-[var(--foreground)]';

  const renderPasswordInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    toggleVisible: () => void,
    placeholder: string,
    autoComplete: string,
    minLength?: number,
  ) => (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          className={inputClass}
        />
        <button
          type="button"
          onClick={toggleVisible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
            <Settings2 className="h-3.5 w-3.5" />
            Developer Workspace
            <span className="text-[var(--border)]">/</span>
            Settings
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Account Settings
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Manage your account security and authentication preferences.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-[var(--success)]/20 bg-[var(--success)]/10 px-3.5 py-2">
          <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
          <span className="text-xs font-semibold text-[var(--success)]">
            Security Center
          </span>
        </div>
      </div>

      {/* Security Overview */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[var(--primary)]/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--success)]/20 bg-[var(--success)]/10">
              <Fingerprint className="h-6 w-6 text-[var(--success)]" />
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">
                Account Security
              </h2>
              <p className="mt-1 max-w-md text-xs leading-5 text-[var(--muted)]">
                Keep your account protected by using a strong, unique password
                and signing out of sessions you no longer need.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[var(--success)]">
            <CheckCircle2 className="h-4 w-4" />
            Security controls available
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
              <KeyRound className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Password Management
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Update your account password
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
              <LogOut className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Session Management
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Sign out of your current session
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10">
            <Lock className="h-5 w-5 text-[var(--primary)]" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Change Password
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Update the password associated with your account.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {passwordChangeMsg && (
            <div
              role="alert"
              className={`mb-5 flex items-start gap-3 rounded-xl border p-3.5 ${
                passwordChangeMsg.type === 'success'
                  ? 'border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]'
                  : 'border-[var(--danger)]/20 bg-[var(--danger)]/10 text-[var(--danger)]'
              }`}
            >
              {passwordChangeMsg.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}

              <p className="text-xs font-medium leading-5">
                {passwordChangeMsg.text}
              </p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="max-w-xl space-y-4">
              {renderPasswordInput(
                'Current Password',
                currentPassword,
                setCurrentPassword,
                showCurrent,
                () => setShowCurrent(!showCurrent),
                'Enter your current password',
                'current-password',
              )}

              <div className="border-t border-[var(--border)] pt-4">
                {renderPasswordInput(
                  'New Password',
                  newPassword,
                  setNewPassword,
                  showNew,
                  () => setShowNew(!showNew),
                  'Enter a new password',
                  'new-password',
                  8,
                )}

                {newPassword && (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] text-[var(--muted)]">
                        Password strength
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--foreground)]">
                        {strengthLabel}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            passwordStrength >= level
                              ? 'bg-[var(--success)]'
                              : 'bg-[var(--surface-secondary)]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {renderPasswordInput(
                'Confirm New Password',
                confirmPassword,
                setConfirmPassword,
                showConfirm,
                () => setShowConfirm(!showConfirm),
                'Re-enter your new password',
                'new-password',
                8,
              )}

              {confirmPassword && (
                <div className={`flex items-center gap-2 text-[11px] ${
                  newPassword === confirmPassword
                    ? 'text-[var(--success)]'
                    : 'text-[var(--danger)]'
                }`}>
                  {newPassword === confirmPassword ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {newPassword === confirmPassword
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Minimum 8 characters required
              </div>

              <button
                type="submit"
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Session Section */}
      <section className="overflow-hidden rounded-2xl border border-[var(--danger)]/20 bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--danger)]/10">
            <LogOut className="h-5 w-5 text-[var(--danger)]" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Session Management
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Manage your current authenticated session.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="max-w-md">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Sign out of OneAPI
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
              End your current session and return to the login screen.
              You will need to authenticate again to access your workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-5 py-3 text-xs font-semibold text-[var(--danger)] transition-all hover:bg-[var(--danger)]/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-col items-center justify-between gap-2 border-t border-[var(--border)] pt-5 text-center sm:flex-row sm:text-left">
        <p className="text-[11px] text-[var(--muted)]">
          OneAPI Account Security
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Account security controls
        </div>
      </div>
    </div>
  );
}
