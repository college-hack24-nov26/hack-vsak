'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Lock,
  LogOut,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordChangeMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
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
        setPasswordChangeMsg({ type: 'success', text: 'Password successfully updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordChangeMsg({ type: 'error', text: res.error?.message || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPasswordChangeMsg({ type: 'error', text: err.message || 'Error updating password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchApi('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    authStorage.clear();
    router.push('/login');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Password Change Card */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-sky-400" />
          Change Account Password
        </h3>
        <p className="text-xs text-slate-400">
          Update your security credentials directly on the backend authentication server.
        </p>

        {passwordChangeMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              passwordChangeMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {passwordChangeMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
          >
            {changingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Sign Out Card */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Sign Out of Session</h3>
          <p className="text-xs text-slate-400 mt-0.5">Revoke tokens and return to the login screen.</p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
