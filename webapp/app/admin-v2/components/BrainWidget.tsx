'use client';

/**
 * Brain Widget - Command Center Integration
 * 
 * Displays daily/weekly reminders and allows thought capture
 * Shows actionable items from all 4 buckets
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, Check, Clock, Sparkles, Users, Lightbulb, CheckSquare, X } from 'lucide-react';
import { useBusiness } from '@/lib/business';

interface BrainItem {
  id: string;
  type: 'people' | 'projects' | 'ideas' | 'admin';
  text: string;
  dueDate?: string;
  completed?: boolean;
}

export function BrainWidget() {
  const { activeBusiness, isSwitchingBusiness } = useBusiness();
  const [items, setItems] = useState<BrainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddThought, setShowAddThought] = useState(false);
  const [newThought, setNewThought] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all'>('today');
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Track last fetched business to prevent duplicate requests
  const lastFetchedBusiness = React.useRef<string | null>(null);

  useEffect(() => {
    // Only fetch if business changed and not switching
    if (activeBusiness && !isSwitchingBusiness && lastFetchedBusiness.current !== activeBusiness.id) {
      lastFetchedBusiness.current = activeBusiness.id;
      fetchBrainItems();
    }
  }, [activeBusiness, isSwitchingBusiness]);

  const fetchBrainItems = async () => {
    if (!activeBusiness) return;
    
    try {
      setLoading(true);
      setFetchError(null);
      
      // Fetch from all buckets with error handling per request
      const [peopleRes, projectsRes, ideasRes, adminRes] = await Promise.allSettled([
        fetch(`/api/brain/people?businessId=${activeBusiness.id}`),
        fetch(`/api/brain/projects?businessId=${activeBusiness.id}`),
        fetch(`/api/brain/ideas?businessId=${activeBusiness.id}`),
        fetch(`/api/brain/admin?businessId=${activeBusiness.id}`),
      ]);

      // Combine and format
      const allItems: BrainItem[] = [];
      
      // Add people with upcoming follow-ups
      if (peopleRes.status === 'fulfilled' && peopleRes.value.ok) {
        const people = await peopleRes.value.json();
        people.items?.forEach((person: any) => {
          if (person.next_followup) {
            allItems.push({
              id: person.id,
              type: 'people',
              text: `Follow up with ${person.name}`,
              dueDate: person.next_followup,
            });
          }
        });
      }

      // Add active projects
      if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) {
        const projects = await projectsRes.value.json();
        projects.items?.forEach((project: any) => {
          if (project.next_action && project.status === 'active') {
            allItems.push({
              id: project.id,
              type: 'projects',
              text: project.next_action,
              dueDate: project.due_date,
            });
          }
        });
      }

      // Add admin tasks
      if (adminRes.status === 'fulfilled' && adminRes.value.ok) {
        const admin = await adminRes.value.json();
        admin.items?.forEach((task: any) => {
          if (!task.completed) {
            allItems.push({
              id: task.id,
              type: 'admin',
              text: task.task,
              dueDate: task.due_date,
              completed: false,
            });
          }
        });
      }

      setItems(allItems);
    } catch (error) {
      console.error('Failed to fetch brain items:', error);
      setFetchError('Could not load brain items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddThought = async () => {
    if (!newThought.trim() || !activeBusiness) return;

    try {
      const response = await fetch('/api/brain/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          text: newThought,
          source: 'web',
        }),
      });

      if (response.ok) {
        setNewThought('');
        setShowAddThought(false);
        fetchBrainItems();
      }
    } catch (error) {
      console.error('Failed to add thought:', error);
    }
  };

  const handleCompleteItem = async (item: BrainItem) => {
    if (!activeBusiness) return;

    try {
      // Mark as complete based on type
      const endpoint = `/api/brain/${item.type}`;
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          itemId: item.id,
          completed: true,
        }),
      });

      fetchBrainItems();
    } catch (error) {
      console.error('Failed to complete item:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'people': return <Users className="w-4 h-4" />;
      case 'projects': return <CheckSquare className="w-4 h-4" />;
      case 'ideas': return <Lightbulb className="w-4 h-4" />;
      case 'admin': return <Clock className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'people': return 'text-blue-400 bg-blue-400/10';
      case 'projects': return 'text-purple-400 bg-purple-400/10';
      case 'ideas': return 'text-yellow-400 bg-yellow-400/10';
      case 'admin': return 'text-green-400 bg-green-400/10';
      default: return 'text-white/60 bg-white/5';
    }
  };

  if (!activeBusiness || isSwitchingBusiness) {
    // Show skeleton loader during business switch instead of disappearing
    return (
      <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const filteredItems = items.filter(item => {
    if (activeTab === 'today') {
      // Show items due today or overdue
      if (!item.dueDate) return false;
      const dueDate = new Date(item.dueDate);
      const today = new Date();
      return dueDate <= today;
    }
    if (activeTab === 'week') {
      // Show items due this week
      if (!item.dueDate) return false;
      const dueDate = new Date(item.dueDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return dueDate <= weekFromNow;
    }
    return true; // 'all'
  });

  return (
    <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#39FF14] to-[#0CE293] rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Brain</h3>
            <p className="text-xs text-white/60">Thoughts & Reminders</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddThought(!showAddThought)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <Plus className="w-5 h-5 text-[#39FF14]" />
        </button>
      </div>

      {/* Add Thought Input */}
      <AnimatePresence>
        {showAddThought && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newThought}
                onChange={(e) => setNewThought(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddThought()}
                placeholder="Capture a thought..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:border-[#39FF14] outline-none"
                autoFocus
              />
              <button
                onClick={handleAddThought}
                className="px-4 py-2 bg-[#39FF14] text-black text-sm font-medium rounded-lg hover:bg-[#32E012] transition"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['today', 'week', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === tab
                ? 'bg-[#39FF14] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {tab === 'today' && 'Today'}
            {tab === 'week' && 'This Week'}
            {tab === 'all' && 'All Items'}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-white/40 text-sm">
            Loading...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              {activeTab === 'today' && 'No items due today'}
              {activeTab === 'week' && 'No items this week'}
              {activeTab === 'all' && 'Your brain is empty - add a thought!'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition"
            >
              <button
                onClick={() => handleCompleteItem(item)}
                className="flex-shrink-0 w-5 h-5 rounded border-2 border-white/30 hover:border-[#39FF14] hover:bg-[#39FF14]/20 transition flex items-center justify-center"
              >
                {item.completed && <Check className="w-3 h-3 text-[#39FF14]" />}
              </button>

              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getColor(item.type)}`}>
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.text}</p>
                {item.dueDate && (
                  <p className="text-xs text-white/50 mt-0.5">
                    {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <span className={`text-[10px] px-2 py-1 rounded ${getColor(item.type)} uppercase font-medium`}>
                {item.type}
              </span>
            </motion.div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">
            {items.filter(i => i.type === 'people').length}
          </div>
          <div className="text-[10px] text-white/50">People</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">
            {items.filter(i => i.type === 'projects').length}
          </div>
          <div className="text-[10px] text-white/50">Projects</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-400">
            {items.filter(i => i.type === 'ideas').length}
          </div>
          <div className="text-[10px] text-white/50">Ideas</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            {items.filter(i => i.type === 'admin').length}
          </div>
          <div className="text-[10px] text-white/50">Admin</div>
        </div>
      </div>
    </div>
  );
}

export default BrainWidget;
