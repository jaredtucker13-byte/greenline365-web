'use client';

import { supabase } from '@/lib/supabase/client';

export function HQSignOutButton() {
  const handleSignOut = async () => {
    localStorage.removeItem('greenline365_active_business');
    localStorage.removeItem('greenline365_edit_mode');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-3 py-1 rounded-lg text-[10px] font-medium text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-400/10 border border-yellow-400/20 transition"
    >
      Sign Out
    </button>
  );
}
