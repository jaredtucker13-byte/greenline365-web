'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';
import TierBadge from '@/components/portal/TierBadge';
import Link from 'next/link';

interface TeamMember {
  id: string;
  user_id: string;
  role_id: string;
  status: string;
  role?: { slug: string; name: string };
  member?: { email: string; full_name: string | null };
}

interface RoleOption {
  id: string;
  slug: string;
  name: string;
}

export default function SettingsPage() {
  const {
    user,
    activeListing,
    directorySubscription,
    refresh,
  } = usePortalContext();
  const teamGate = useFeatureGate('team_members_max');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const tierSlug = directorySubscription?.plan?.slug || 'free';
  const isFree = !directorySubscription;

  const loadTeam = useCallback(async () => {
    const [teamRes, rolesRes] = await Promise.all([
      fetch('/api/team'),
      fetch('/api/roles'),
    ]);

    if (teamRes.ok) {
      const data = await teamRes.json();
      setTeamMembers(data.members || []);
    }

    if (rolesRes.ok) {
      const data = await rolesRes.json();
      const fetchedRoles = (data.roles || []).filter(
        (r: RoleOption) => r.slug !== 'owner'
      );
      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0 && !inviteRoleId) {
        setInviteRoleId(fetchedRoles[0].id);
      }
    }
  }, [inviteRoleId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteRoleId) return;
    setInviting(true);
    setMessage(null);

    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        role_id: inviteRoleId,
      }),
    });

    const data = await res.json();
    setInviting(false);

    if (res.ok) {
      setInviteEmail('');
      setMessage({ type: 'success', text: 'Team member invited.' });
      loadTeam();
    } else {
      setMessage({ type: 'error', text: data.error || 'Failed to invite.' });
    }
  };

  const handleRevoke = async (memberId: string) => {
    const res = await fetch(`/api/team/${memberId}`, { method: 'DELETE' });
    if (res.ok) {
      loadTeam();
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ return_url: window.location.href }),
    });

    const data = await res.json();
    setPortalLoading(false);

    if (data.url) {
      window.location.href = data.url;
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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your subscription, team, and account.
        </p>
      </div>

      {/* Current Plan */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Current Plan
        </h2>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">
              {directorySubscription?.plan?.name || 'Free Listing'}
            </span>
            <TierBadge tier={tierSlug} size="md" />
          </div>
          {!isFree && (
            <div className="text-right text-sm text-white/50">
              <p>
                $
                {(
                  (directorySubscription?.plan?.price_monthly_cents || 0) / 100
                ).toFixed(0)}
                /mo
              </p>
              <p>
                Renews{' '}
                {formatDate(directorySubscription?.current_period_end ?? null)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          {isFree ? (
            <Link
              href="/portal/upgrade"
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
            >
              Upgrade
            </Link>
          ) : (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          )}
        </div>
      </section>

      {/* Team Members */}
      {teamGate.isAvailable && (
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Team Members
          </h2>

          {message && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Existing members */}
          <div className="mt-4 space-y-2">
            {/* Owner (current user) */}
            <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-500">
                  {(user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.email}</p>
                  <p className="text-xs text-white/40">Owner</p>
                </div>
              </div>
              <span className="text-xs text-white/30">You</span>
            </div>

            {teamMembers
              .filter((m) => m.status !== 'revoked')
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/50">
                      {(member.member?.email || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {member.member?.full_name || member.member?.email || 'Invited'}
                      </p>
                      <p className="text-xs text-white/40">
                        {member.role?.name || 'Member'} &middot;{' '}
                        {member.status === 'invited' ? 'Pending invite' : 'Active'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(member.id)}
                    className="text-xs text-red-400/60 hover:text-red-400"
                  >
                    Revoke
                  </button>
                </div>
              ))}
          </div>

          {/* Invite form */}
          <div className="mt-4 flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="team@example.com"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
            />
            <select
              value={inviteRoleId}
              onChange={(e) => setInviteRoleId(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-400 disabled:opacity-50"
            >
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </section>
      )}

      {/* Account */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Account
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-white/40">Email</label>
            <p className="mt-1 text-sm text-white/70">{user?.email || '—'}</p>
          </div>
          <div>
            <label className="block text-xs text-white/40">Account ID</label>
            <p className="mt-1 font-mono text-xs text-white/30">{user?.id || '—'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
