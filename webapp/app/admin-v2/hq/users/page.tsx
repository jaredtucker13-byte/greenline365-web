'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  businesses: Array<{
    role: string;
    business: { id: string; name: string; slug: string; tier: string } | null;
  }>;
}

const tierColors: Record<string, string> = { tier1: '#60A5FA', tier2: '#A78BFA', tier3: '#34D399' };

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adminOnly, setAdminOnly] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'users',
          search: search || undefined,
          adminOnly: adminOnly || undefined,
          page,
        }),
      });
      const json = await res.json();
      setUsers(json.users || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, adminOnly, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleAdmin = async (user: UserData) => {
    const confirmed = window.confirm(
      user.is_admin
        ? `Remove admin privileges from ${user.email}?`
        : `Grant admin privileges to ${user.email}?`
    );
    if (!confirmed) return;

    await fetch('/api/admin/hq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'user-toggle-admin',
        userId: user.id,
        is_admin: !user.is_admin,
      }),
    });
    fetchUsers();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Users</h1>
        <p className="text-sm text-white/40 mt-1">{total} registered users across the platform</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 max-w-sm px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40"
        />
        <button
          onClick={() => { setAdminOnly(!adminOnly); setPage(1); }}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            adminOnly
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.06]'
          }`}
        >
          Admins Only
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Businesses</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Joined</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td colSpan={5} className="px-5 py-4"><div className="h-5 bg-white/[0.04] rounded animate-pulse" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-white/30 text-sm">No users found</td>
              </tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xs font-bold text-white/60 border border-white/[0.08]">
                      {(u.full_name || u.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white/90 font-medium">{u.full_name || 'No name'}</p>
                      <p className="text-[11px] text-white/30">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {u.is_admin ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-white/[0.06] text-white/40 border border-white/[0.08]">
                      User
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {u.businesses.length === 0 ? (
                      <span className="text-[11px] text-white/20">None</span>
                    ) : u.businesses.map((b, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: (tierColors[b.business?.tier || ''] || '#60A5FA') + '15',
                          color: tierColors[b.business?.tier || ''] || '#60A5FA',
                          border: `1px solid ${tierColors[b.business?.tier || ''] || '#60A5FA'}25`,
                        }}
                      >
                        {b.business?.name || 'Unknown'} ({b.role})
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-white/40">{new Date(u.created_at).toLocaleDateString()}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => handleToggleAdmin(u)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
                      u.is_admin
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/30">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-xs text-white/60 disabled:opacity-30 hover:bg-white/[0.1] transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-xs text-white/60 disabled:opacity-30 hover:bg-white/[0.1] transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
