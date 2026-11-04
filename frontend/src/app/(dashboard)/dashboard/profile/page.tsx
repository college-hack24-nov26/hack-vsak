
'use client';

import React, { useEffect, useState } from 'react';
import {
  UserCircle,
  CheckCircle2,
  Database,
  Mail,
  Phone,
  Shield,
  Calendar,
  Key,
  UserRound,
  ShieldCheck,
  Clock3,
  BadgeCheck,
  AlertCircle,
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
          setError('Unable to retrieve your profile information.');
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setError('Unable to connect to the account service.');
      })
      .finally(() => {
        setLoading(false);
      });
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

  const profileDetails = [
    {
      label: 'Developer User ID',
      value: user?.user_id || user?._id || 'Not available',
      icon: Key,
      type: 'code',
    },
    {
      label: 'Email Address',
      value: user?.email || 'Not available',
      icon: Mail,
      type: 'normal',
    },
    {
      label: 'Phone Number',
      value: user?.phone_no || 'Not available',
      icon: Phone,
      type: 'normal',
    },
    {
      label: 'Account Created',
      value: accountCreated,
      icon: Calendar,
      type: 'normal',
    },
  ];

  if (loading && !user) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-icon">
          <UserCircle size={28} />
        </div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* Page heading */}
      <div className="profile-page-heading">
        <div>
          <span className="profile-eyebrow">ACCOUNT MANAGEMENT</span>
          <h2>My Profile</h2>
          <p>Manage and review your OneAPI developer account information.</p>
        </div>

        <div className="profile-heading-icon">
          <UserRound size={22} />
        </div>
      </div>

      {error && (
        <div className="profile-error">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {/* Profile overview */}
      <section className="profile-card profile-overview">
        <div className="profile-overview-main">
          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-identity">
            <span className="profile-section-label">
              DEVELOPER ACCOUNT
            </span>

            <h3>{user?.name || 'Developer'}</h3>

            <p>{user?.email || 'No email available'}</p>

            <div className="profile-badges">
              <span className="profile-role-badge">
                <UserCircle size={13} />
                {user?.role || 'USER'}
              </span>

              {user?.isVerified ? (
                <span className="profile-verified-badge">
                  <CheckCircle2 size={13} />
                  Email Verified
                </span>
              ) : (
                <span className="profile-pending-badge">
                  <AlertCircle size={13} />
                  Verification Pending
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-account-status">
          <span className="profile-status-dot" />
          <span>Account Active</span>
        </div>
      </section>

      {/* Account information */}
      <section className="profile-section">
        <div className="profile-section-heading">
          <div>
            <h3>Personal Information</h3>
            <p>Your registered account details.</p>
          </div>

          <span className="profile-section-tag">
            <ShieldCheck size={13} />
            Account Details
          </span>
        </div>

        <div className="profile-details-grid">
          {profileDetails.map((item) => {
            const Icon = item.icon;

            return (
              <div className="profile-detail-card" key={item.label}>
                <div className="profile-detail-icon">
                  <Icon size={18} />
                </div>

                <div className="profile-detail-content">
                  <span className="profile-detail-label">
                    {item.label}
                  </span>

                  <span
                    className={`profile-detail-value ${
                      item.type === 'code' ? 'is-code' : ''
                    }`}
                    title={item.value}
                  >
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Account security */}
      <section className="profile-section">
        <div className="profile-section-heading">
          <div>
            <h3>Account & Security</h3>
            <p>Verification and account compliance status.</p>
          </div>
        </div>

        <div className="profile-security-grid">
          <div className="profile-security-card">
            <div className="profile-security-icon">
              <Shield size={19} />
            </div>

            <div className="profile-security-content">
              <span>Terms & Conditions</span>
              <strong className={
                user?.terms_accepted ? 'is-success' : 'is-warning'
              }>
                {user?.terms_accepted ? 'Accepted' : 'Pending'}
              </strong>
            </div>

            {user?.terms_accepted ? (
              <CheckCircle2 className="profile-security-check" size={19} />
            ) : (
              <AlertCircle className="profile-security-warning" size={19} />
            )}
          </div>

          <div className="profile-security-card">
            <div className="profile-security-icon">
              <Mail size={19} />
            </div>

            <div className="profile-security-content">
              <span>Email Verification</span>
              <strong className={
                user?.isVerified ? 'is-success' : 'is-warning'
              }>
                {user?.isVerified ? 'Verified' : 'Pending'}
              </strong>
            </div>

            {user?.isVerified ? (
              <CheckCircle2 className="profile-security-check" size={19} />
            ) : (
              <AlertCircle className="profile-security-warning" size={19} />
            )}
          </div>

          <div className="profile-security-card">
            <div className="profile-security-icon">
              <Database size={19} />
            </div>

            <div className="profile-security-content">
              <span>Database Connection</span>
              <strong className="is-success">Connected</strong>
            </div>

            <CheckCircle2 className="profile-security-check" size={19} />
          </div>

          <div className="profile-security-card">
            <div className="profile-security-icon">
              <Clock3 size={19} />
            </div>

            <div className="profile-security-content">
              <span>Account Registration</span>
              <strong>{accountCreated}</strong>
            </div>

            <BadgeCheck className="profile-security-check" size={19} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="profile-footer">
        <ShieldCheck size={16} />
        <span>
          Your account information is managed securely by OneAPI.
        </span>
      </div>
    </div>
  );
}
