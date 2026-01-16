'use client';

/**
 * Admin Edit Mode Context
 * 
 * Provides a global "God Mode" editing state for admins.
 * When enabled, EditableRegion components show pencil icons on hover.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AdminEditModeContextType {
  isAdmin: boolean;
  isEditMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
}

const AdminEditModeContext = createContext<AdminEditModeContextType>({
  isAdmin: false,
  isEditMode: false,
  toggleEditMode: () => {},
  setEditMode: () => {},
});

export function AdminEditModeProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        setIsEditMode(false);
        setIsChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      const adminStatus = profile?.is_admin || false;
      setIsAdmin(adminStatus);
      
      // Restore edit mode from localStorage if admin
      if (adminStatus && typeof window !== 'undefined') {
        const savedMode = localStorage.getItem('greenline365_edit_mode');
        setIsEditMode(savedMode === 'true');
      }
      
      setIsChecked(true);
    } catch (error) {
      console.error('[AdminEditMode] Error checking status:', error);
      setIsChecked(true);
    }
  };

  const toggleEditMode = () => {
    if (!isAdmin) return;
    
    const newMode = !isEditMode;
    setIsEditMode(newMode);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('greenline365_edit_mode', String(newMode));
    }
  };

  const handleSetEditMode = (enabled: boolean) => {
    if (!isAdmin) return;
    
    setIsEditMode(enabled);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('greenline365_edit_mode', String(enabled));
    }
  };

  return (
    <AdminEditModeContext.Provider value={{
      isAdmin,
      isEditMode,
      toggleEditMode,
      setEditMode: handleSetEditMode,
    }}>
      {children}
      
      {/* Floating Edit Mode Toggle for Admins */}
      {isChecked && isAdmin && (
        <AdminEditModeToggle 
          isEditMode={isEditMode} 
          onToggle={toggleEditMode} 
        />
      )}
    </AdminEditModeContext.Provider>
  );
}

// Floating toggle button component
function AdminEditModeToggle({ isEditMode, onToggle }: { isEditMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-6 right-6 z-[9998] flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 ${
        isEditMode 
          ? 'bg-purple-500 text-white shadow-purple-500/30' 
          : 'bg-white/10 backdrop-blur-xl text-white/70 hover:text-white border border-white/10'
      }`}
      title={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      <span className="text-sm font-medium">
        {isEditMode ? 'Editing' : 'Edit Mode'}
      </span>
      {isEditMode && (
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
      )}
    </button>
  );
}

export function useAdminEditMode() {
  return useContext(AdminEditModeContext);
}

export default AdminEditModeProvider;
