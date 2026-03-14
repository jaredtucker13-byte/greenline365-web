'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';
import UpgradeCTA from '@/components/portal/UpgradeCTA';

interface TeamMember {
  id: string;
  user_id: string;
  role_id: string;
  status: 'active' | 'invited' | 'revoked';
  created_at: string;
  role?: { id: string; slug: string; name: string };
  member?: { email: string; full_name: string | null };
}

interface RoleOption {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Owner: ['Full access to all features, billing, and team management'],
  Admin: [
    'Manage listings',
    'Respond to reviews',
    'View analytics and stats',
  ],
  Editor: [
    'Edit listing details',
    'Upload photos',
    'Manage hours and menu',
  ],
  Viewer: ['View-only access to dashboard and stats'],
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: 'bg-gold-500/20 text-gold-500',
  admin: 'bg-purple-500/20 text-purple-400',
  editor: 'bg-blue-500/20 text-blue-400',
  viewer: 'bg-white/10 text-white/60',
};

function getRoleBadgeColor(slug: string): string {
  return ROLE_BADGE_COLORS[slug] || 'bg-white/10 text-white/60';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function TeamManagementPage() {
  const { user } = usePortalContext();
  const teamGate = useFeatureGate('team_members_max');

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<TeamMember | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const showToast = useCallback(
    (type: 'success' | 'error', text: string) => {
      setToast({ type, text });
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    },
    []
  );

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [teamRes, rolesRes] = await Promise.all([
        fetch('/api/team'),
        fetch('/api/roles'),
      ]);

      if (teamRes.ok) {
        const data = await teamRes.json();
        setMembers(data.members || []);
      }

      if (rolesRes.ok) {
        const data = await rolesRes.json();
        const fetchedRoles = (data.roles || []).filter(
          (r: RoleOption) => r.slug !== 'owner'
        );
        setRoles(fetchedRoles);
        setInviteRoleId((prev) => {
          if (prev && fetchedRoles.some((r: RoleOption) => r.id === prev))
            return prev;
          return fetchedRoles[0]?.id || '';
        });
      }
    } catch {
      showToast('error', 'Failed to load team data.');
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (teamGate.isAvailable) {
      loadData();
    }
  }, [teamGate.isAvailable, loadData]);

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || !inviteRoleId) return;

    if (!isValidEmail(email)) {
      showToast('error', 'Please enter a valid email address.');
      return;
    }

    setInviting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role_id: inviteRoleId }),
      });

      const data = await res.json();

      if (res.ok) {
        setInviteEmail('');
        showToast('success', `Invitation sent to ${email}.`);
        loadData();
      } else {
        showToast('error', data.error || 'Failed to send invitation.');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRoleId: string) => {
    setChangingRoleId(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: newRoleId }),
      });

      if (res.ok) {
        showToast('success', 'Role updated successfully.');
        loadData();
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to update role.');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/team/${revokeTarget.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('success', 'Team member removed.');
        setRevokeTarget(null);
        loadData();
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to remove team member.');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setRevoking(false);
    }
  };

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingInvites = members.filter((m) => m.status === 'invited');
  const totalCount = members.filter((m) => m.status !== 'revoked').length + 1; // +1 for owner
  const activeCount = activeMembers.length + 1; // +1 for owner
  const pendingCount = pendingInvites.length;

  // Blurred preview for gated state
  if (teamGate.isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="mt-1 text-sm text-white/50">
            Invite team members and manage access.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-gold-500" />
        </div>
      </div>
    );
  }

  if (!teamGate.isAvailable) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="mt-1 text-sm text-white/50">
            Invite team members and manage access.
          </p>
        </div>

        <div className="relative">
          {/* Blurred preview */}
          <div className="pointer-events-none select-none space-y-6 blur-sm">
            {/* Stats preview */}
            <div className="grid grid-cols-3 gap-4">
              {['Total Members', 'Active', 'Pending Invites'].map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">3</p>
                </div>
              ))}
            </div>

            {/* Invite preview */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                Invite Member
              </h2>
              <div className="mt-4 flex gap-3">
                <div className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5">
                  <span className="text-sm text-white/30">
                    Enter email address
                  </span>
                </div>
                <div className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-sm text-white/30">Editor</span>
                </div>
                <div className="rounded-lg bg-gold-500/50 px-6 py-2.5">
                  <span className="text-sm font-semibold text-black/50">
                    Send Invite
                  </span>
                </div>
              </div>
            </div>

            {/* Members preview */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                Team Members
              </h2>
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3"
                  >
                    <div className="h-9 w-9 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-3.5 w-28 rounded bg-white/10" />
                      <div className="mt-1.5 h-2.5 w-40 rounded bg-white/5" />
                    </div>
                    <div className="h-5 w-14 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <UpgradeCTA
              feature="Team Management"
              description="Invite team members and manage roles with a Pro subscription."
              variant="overlay"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Team Management</h1>
        <p className="mt-1 text-sm text-white/50">
          Invite team members and manage access.
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm transition-all ${
            toast.type === 'success'
              ? 'border-green-500/20 bg-green-500/10 text-green-400'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{toast.text}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-4 text-current opacity-60 hover:opacity-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            Total Members
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {loadingData ? '\u2014' : totalCount}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            Active Members
          </p>
          <p className="mt-2 text-2xl font-bold text-green-400">
            {loadingData ? '\u2014' : activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            Pending Invites
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-400">
            {loadingData ? '\u2014' : pendingCount}
          </p>
        </div>
      </div>

      {/* Invite Member */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Invite Member
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInvite();
            }}
            placeholder="Enter email address"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 transition-colors focus:border-gold-500 focus:outline-none"
          />
          <select
            value={inviteRoleId}
            onChange={(e) => setInviteRoleId(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white transition-colors focus:border-gold-500 focus:outline-none"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id} className="bg-neutral-900">
                {r.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim() || !inviteRoleId}
            className="rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inviting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              'Send Invite'
            )}
          </button>
        </div>
      </section>

      {/* Team Members List */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Team Members
        </h2>

        {loadingData ? (
          <div className="mt-6 flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-gold-500" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {/* Owner (current user) */}
            <div className="group flex flex-col gap-3 rounded-lg bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-sm font-bold text-gold-500">
                  {(user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-white">
                      {user?.email || 'You'}
                    </p>
                    <span className="shrink-0 rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-500">
                      You
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/40">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeColor('owner')}`}
                >
                  Owner
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-white/50">Active</span>
                </div>
              </div>
            </div>

            {/* Other members */}
            {members
              .filter((m) => m.status !== 'revoked')
              .map((member) => {
                const displayName =
                  member.member?.full_name || member.member?.email || 'Pending Invite';
                const displayEmail = member.member?.email || '';
                const avatarLetter = (
                  member.member?.full_name ||
                  member.member?.email ||
                  'P'
                )
                  .charAt(0)
                  .toUpperCase();
                const roleSlug = member.role?.slug || 'viewer';
                const roleName = member.role?.name || 'Member';

                return (
                  <div
                    key={member.id}
                    className="group flex flex-col gap-3 rounded-lg bg-white/5 px-4 py-4 transition-colors hover:bg-white/[0.07] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/50">
                        {avatarLetter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {displayName}
                        </p>
                        {displayEmail && (
                          <p className="mt-0.5 truncate text-xs text-white/40">
                            {displayEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Role badge / change role dropdown */}
                      <div className="relative">
                        <select
                          value={member.role_id}
                          onChange={(e) =>
                            handleChangeRole(member.id, e.target.value)
                          }
                          disabled={changingRoleId === member.id}
                          className={`appearance-none rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-gold-500 ${getRoleBadgeColor(roleSlug)} cursor-pointer bg-opacity-100 disabled:cursor-wait disabled:opacity-50`}
                          title="Change role"
                        >
                          {roles.map((r) => (
                            <option
                              key={r.id}
                              value={r.id}
                              className="bg-neutral-900 text-white"
                            >
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-current opacity-50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            member.status === 'active'
                              ? 'bg-green-500'
                              : member.status === 'invited'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span className="text-xs text-white/50">
                          {member.status === 'active'
                            ? 'Active'
                            : member.status === 'invited'
                              ? 'Pending'
                              : 'Revoked'}
                        </span>
                      </div>

                      {/* Date */}
                      <span className="hidden text-xs text-white/30 lg:inline">
                        {formatDate(member.created_at)}
                      </span>

                      {/* Revoke button */}
                      <button
                        onClick={() => setRevokeTarget(member)}
                        className="rounded-lg px-2.5 py-1.5 text-xs text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Remove member"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Revoked members */}
            {members.filter((m) => m.status === 'revoked').length > 0 && (
              <>
                <div className="pt-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/20">
                    Revoked
                  </p>
                </div>
                {members
                  .filter((m) => m.status === 'revoked')
                  .map((member) => {
                    const displayName =
                      member.member?.full_name ||
                      member.member?.email ||
                      'Unknown';
                    const avatarLetter = (
                      member.member?.full_name ||
                      member.member?.email ||
                      'R'
                    )
                      .charAt(0)
                      .toUpperCase();

                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 rounded-lg bg-white/[0.02] px-4 py-4 opacity-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white/30">
                            {avatarLetter}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white/50">
                              {displayName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-white/30">
                              {member.member?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-xs text-white/40">
                              Revoked
                            </span>
                          </div>
                          <span className="text-xs text-white/20">
                            {formatDate(member.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {members.filter((m) => m.status !== 'revoked').length === 0 &&
              !loadingData && (
                <div className="py-8 text-center">
                  <p className="text-sm text-white/40">
                    No team members yet. Send an invite above to get started.
                  </p>
                </div>
              )}
          </div>
        )}
      </section>

      {/* Permissions Info */}
      <section className="rounded-xl border border-white/10 bg-white/5">
        <button
          onClick={() => setPermissionsOpen(!permissionsOpen)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Role Permissions
          </h2>
          <svg
            className={`h-4 w-4 text-white/30 transition-transform ${
              permissionsOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {permissionsOpen && (
          <div className="border-t border-white/5 px-6 pb-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(ROLE_PERMISSIONS).map(
                ([role, permissions]) => (
                  <div
                    key={role}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(role.toLowerCase())}`}
                      >
                        {role}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {permissions.map((perm) => (
                        <li
                          key={perm}
                          className="flex items-start gap-2 text-xs text-white/50"
                        >
                          <svg
                            className="mt-0.5 h-3 w-3 shrink-0 text-green-500/60"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/* Revoke Confirmation Modal */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!revoking) setRevokeTarget(null);
            }}
          />
          {/* Modal */}
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">
              Remove{' '}
              {revokeTarget.member?.full_name ||
                revokeTarget.member?.email ||
                'this member'}
              ?
            </h3>
            <p className="mt-2 text-sm text-white/50">
              They will lose access to all listings immediately.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                disabled={revoking}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {revoking ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Removing...
                  </span>
                ) : (
                  'Remove'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
