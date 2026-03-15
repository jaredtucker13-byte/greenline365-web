'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase, signOut } from '@/lib/supabase/client';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  zip_code: string;
}

export default function ConsumerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    zip_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('full_name, email, phone, zip_code')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email || session.user.email || '',
        phone: data.phone || '',
        zip_code: data.zip_code || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        zip_code: profile.zip_code,
      })
      .eq('id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordForm.new.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({ current: '', new: '', confirm: '' });
    }
    setChangingPassword(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Profile Settings</h1>
        <p className="text-white/50 text-sm mb-6">Manage your account information</p>
      </motion.div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Personal Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/[0.03] border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4">Personal Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm text-white/60 mb-1.5">Full Name</label>
            <input
              id="full_name"
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500/50 transition"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/40 text-sm cursor-not-allowed"
            />
            <p className="text-white/30 text-xs mt-1">Email cannot be changed</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm text-white/60 mb-1.5">Phone</label>
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500/50 transition"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label htmlFor="zip_code" className="block text-sm text-white/60 mb-1.5">Zip Code</label>
              <input
                id="zip_code"
                type="text"
                value={profile.zip_code}
                onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500/50 transition"
                placeholder="12345"
                maxLength={10}
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 transition text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.03] border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="new_password" className="block text-sm text-white/60 mb-1.5">New Password</label>
            <input
              id="new_password"
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500/50 transition"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className="block text-sm text-white/60 mb-1.5">Confirm New Password</label>
            <input
              id="confirm_password"
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500/50 transition"
              placeholder="Repeat new password"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={changingPassword || !passwordForm.new || !passwordForm.confirm}
            className="px-6 py-2.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/15 transition text-sm disabled:opacity-50"
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.03] border border-white/10 rounded-xl p-6"
      >
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-red-500/10 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition text-sm"
        >
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
