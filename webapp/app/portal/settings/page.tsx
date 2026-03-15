'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import TierBadge from '@/components/portal/TierBadge';
import Link from 'next/link';

interface NotificationPreferences {
  email_reviews: boolean;
  email_stats_weekly: boolean;
  email_tips: boolean;
  email_billing: boolean;
  push_reviews: boolean;
  push_messages: boolean;
}

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  email_reviews: true,
  email_stats_weekly: true,
  email_tips: true,
  email_billing: true,
  push_reviews: true,
  push_messages: true,
};

export default function SettingsPage() {
  const {
    user,
    activeListing,
    directorySubscription,
    refresh,
  } = usePortalContext();

  // Profile state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    company_name: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIF_PREFS);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMessage, setNotifMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password
  const [passwordForm, setPasswordForm] = useState({ current: '', new_password: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Billing portal
  const [portalLoading, setPortalLoading] = useState(false);

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const tierSlug = directorySubscription?.plan?.slug || 'free';
  const isFree = !directorySubscription;

  // Load profile data
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        company_name: user.user_metadata?.company_name || '',
      });
    }
  }, [user]);

  // Load notification preferences
  useEffect(() => {
    if (!activeListing) return;
    fetch(`/api/portal/listing?listing_id=${activeListing.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.listings?.[0]?.metadata?.notification_preferences) {
          setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...data.listings[0].metadata.notification_preferences });
        }
      });
  }, [activeListing]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        const data = await res.json();
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleNotifSave = async () => {
    if (!activeListing) return;
    setNotifSaving(true);
    setNotifMessage(null);

    try {
      const res = await fetch('/api/portal/listing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: activeListing.id,
          metadata: {
            ...(activeListing.metadata || {}),
            notification_preferences: notifPrefs,
          },
        }),
      });

      if (res.ok) {
        setNotifMessage({ type: 'success', text: 'Notification preferences saved.' });
      } else {
        setNotifMessage({ type: 'error', text: 'Failed to save preferences.' });
      }
    } catch {
      setNotifMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setNotifSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordForm.current,
          new_password: passwordForm.new_password,
        }),
      });

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
        setPasswordForm({ current: '', new_password: '', confirm: '' });
      } else {
        const data = await res.json();
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_url: window.location.href }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const inputClass = 'mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500';

  const NotifToggle = ({ label, description, checked, onChange }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? 'bg-gold-500' : 'bg-white/20'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your profile, notifications, and account preferences.
        </p>
      </div>

      {/* Business Profile */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-5">
          Business Profile
        </h2>

        {profileMessage && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            profileMessage.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {profileMessage.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70">Full Name</label>
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              placeholder="Your full name"
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-white/70">Email</label>
              <p className="mt-1 text-sm text-white/50 py-2.5">{user?.email || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70">Phone</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">Company Name</label>
            <input
              type="text"
              value={profileForm.company_name}
              onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
              placeholder="Your company name"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-400 disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </section>

      {/* Current Plan */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
          Subscription
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">
              {directorySubscription?.plan?.name || 'Free Listing'}
            </span>
            <TierBadge tier={tierSlug} size="md" />
          </div>
          {!isFree && (
            <div className="text-right text-sm text-white/50">
              <p>
                ${((directorySubscription?.plan?.price_monthly_cents || 0) / 100).toFixed(0)}/mo
              </p>
              <p>
                Renews {formatDate(directorySubscription?.current_period_end ?? null)}
              </p>
            </div>
          )}
        </div>

        {directorySubscription?.cancel_at_period_end && (
          <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
            Your plan will end on {formatDate(directorySubscription.current_period_end)}. You&apos;ll be downgraded to Free.
          </div>
        )}

        <div className="mt-4 flex gap-3">
          {isFree ? (
            <Link
              href="/portal/upgrade"
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
            >
              Upgrade
            </Link>
          ) : (
            <>
              <Link
                href="/portal/billing"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5"
              >
                View Billing
              </Link>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                {portalLoading ? 'Loading...' : 'Manage in Stripe'}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-2">
          Notification Preferences
        </h2>

        {notifMessage && (
          <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${
            notifMessage.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {notifMessage.text}
          </div>
        )}

        <div className="mt-2">
          <h3 className="text-xs font-medium text-white/30 uppercase tracking-wide mb-1">Email Notifications</h3>
          <div className="divide-y divide-white/5">
            <NotifToggle
              label="New Reviews"
              description="Get notified when someone leaves a review"
              checked={notifPrefs.email_reviews}
              onChange={(val) => setNotifPrefs({ ...notifPrefs, email_reviews: val })}
            />
            <NotifToggle
              label="Weekly Stats Report"
              description="Weekly summary of your listing performance"
              checked={notifPrefs.email_stats_weekly}
              onChange={(val) => setNotifPrefs({ ...notifPrefs, email_stats_weekly: val })}
            />
            <NotifToggle
              label="Tips & Best Practices"
              description="Helpful tips to improve your listing"
              checked={notifPrefs.email_tips}
              onChange={(val) => setNotifPrefs({ ...notifPrefs, email_tips: val })}
            />
            <NotifToggle
              label="Billing & Receipts"
              description="Payment confirmations and invoice receipts"
              checked={notifPrefs.email_billing}
              onChange={(val) => setNotifPrefs({ ...notifPrefs, email_billing: val })}
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-medium text-white/30 uppercase tracking-wide mb-1">Push Notifications</h3>
          <div className="divide-y divide-white/5">
            <NotifToggle
              label="Review Alerts"
              description="Instant alerts for new reviews"
              checked={notifPrefs.push_reviews}
              onChange={(val) => setNotifPrefs({ ...notifPrefs, push_reviews: val })}
            />
            <NotifToggle
              label="Direct Messages"
              description="When someone sends you a message"
              checked={notifPrefs.push_messages}
              onChange={(val) => setNotifPrefs({ ...notifPrefs, push_messages: val })}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleNotifSave}
            disabled={notifSaving}
            className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-400 disabled:opacity-50"
          >
            {notifSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </section>

      {/* Change Password */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-5">
          Change Password
        </h2>

        {passwordMessage && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            passwordMessage.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {passwordMessage.text}
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-white/70">Current Password</label>
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">New Password</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              placeholder="Min 8 characters"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !passwordForm.current || !passwordForm.new_password || !passwordForm.confirm}
              className="rounded-lg bg-white/10 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-50"
            >
              {passwordSaving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </section>

      {/* Account Info */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
          Account Info
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs text-white/40">Email</label>
              <p className="mt-0.5 text-sm text-white/70">{user?.email || '—'}</p>
            </div>
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
              Verified
            </span>
          </div>
          <div>
            <label className="block text-xs text-white/40">Account ID</label>
            <p className="mt-0.5 font-mono text-xs text-white/30">{user?.id || '—'}</p>
          </div>
          <div>
            <label className="block text-xs text-white/40">Member Since</label>
            <p className="mt-0.5 text-sm text-white/50">
              {user?.created_at ? formatDate(user.created_at) : '—'}
            </p>
          </div>
          <div>
            <label className="block text-xs text-white/40">Auth Provider</label>
            <p className="mt-0.5 text-sm text-white/50">
              {user?.app_metadata?.provider || 'email'}
            </p>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400/60 mb-4">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">Delete Account</p>
            <p className="text-xs text-white/40">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            Delete Account
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400 mb-3">
              Type <span className="font-mono font-bold">DELETE</span> to confirm account deletion.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full rounded-lg border border-red-500/30 bg-transparent px-4 py-2 text-sm text-red-400 placeholder-red-400/30 focus:outline-none"
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== 'DELETE'}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-30"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
