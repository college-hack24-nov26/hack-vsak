'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  CheckCircle2,
  Database,
  Mail,
  Phone,
  Shield,
  Calendar,
  Key,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = authStorage.getUser();
    if (cached) setUser(cached);

    fetchApi('/api/v1/auth/me')
      .then((res) => {
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          authStorage.setUser(res.data.user);
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 md:p-8 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-sky-500/20">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DV'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name || 'Developer'}</h2>
            <p className="text-xs text-slate-400">{user?.email || 'dev@oneapi.io'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {user?.role || 'user'}
              </span>
              {user?.isVerified ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Email Verified
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Verification Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-sky-400" /> Developer User ID
            </span>
            <span className="font-mono text-white font-semibold break-all">
              {user?.user_id || user?._id || 'usr_••••'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" /> Email Address
            </span>
            <span className="text-white font-semibold">{user?.email || 'N/A'}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-400" /> Phone Number
            </span>
            <span className="text-white font-semibold">{user?.phone_no || 'N/A'}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-400" /> Terms & Conditions
            </span>
            <span className="text-emerald-400 font-semibold">
              {user?.terms_accepted ? 'Accepted' : 'Pending'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" /> Account Created At
            </span>
            <span className="text-white font-semibold">
              {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Database Sync
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Live MongoDB Mongoose Document
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
