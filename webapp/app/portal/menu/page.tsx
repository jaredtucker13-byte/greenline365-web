'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import FeatureGate from '@/components/portal/FeatureGate';
import UpgradeCTA from '@/components/portal/UpgradeCTA';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  photo_url: string;
  position: number;
}

interface MenuSection {
  id: string;
  name: string;
  position: number;
  items: MenuItem[];
}

function generateId() {
  return crypto.randomUUID();
}

function MenuEditor({ listingId }: { listingId: string }) {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadMenu = useCallback(async () => {
    const res = await fetch(`/api/portal/listing/menu?listing_id=${listingId}`);
    if (res.ok) {
      const data = await res.json();
      setSections(data.menu?.sections || []);
    }
  }, [listingId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: generateId(),
        name: '',
        position: sections.length,
        items: [],
      },
    ]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, name: string) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, name } : s))
    );
  };

  const addItem = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: generateId(),
                  name: '',
                  description: '',
                  price: '',
                  photo_url: '',
                  position: s.items.length,
                },
              ],
            }
          : s
      )
    );
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
          : s
      )
    );
  };

  const updateItem = (
    sectionId: string,
    itemId: string,
    field: keyof MenuItem,
    value: string
  ) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((i) =>
                i.id === itemId ? { ...i, [field]: value } : i
              ),
            }
          : s
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/portal/listing/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, sections }),
    });

    setSaving(false);

    if (res.ok) {
      setMessage({ type: 'success', text: 'Menu saved.' });
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to save.' });
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setSections(reordered.map((s, i) => ({ ...s, position: i })));
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-3 text-sm text-white/40">
            No menu sections yet. Add your first section to get started.
          </p>
        </div>
      ) : (
        sections.map((section, sIdx) => (
          <div
            key={section.id}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveSection(sIdx, -1)}
                  disabled={sIdx === 0}
                  className="text-white/30 hover:text-white disabled:opacity-20"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveSection(sIdx, 1)}
                  disabled={sIdx === sections.length - 1}
                  className="text-white/30 hover:text-white disabled:opacity-20"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={section.name}
                onChange={(e) => updateSection(section.id, e.target.value)}
                placeholder="Section name (e.g., Appetizers)"
                className="flex-1 border-b border-white/10 bg-transparent pb-1 text-lg font-semibold text-white placeholder-white/30 focus:border-neon-green-500 focus:outline-none"
              />
              <button
                onClick={() => removeSection(section.id)}
                className="text-white/30 hover:text-red-400"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="mt-4 space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-white/5 bg-white/5 p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(section.id, item.id, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full rounded bg-transparent px-2 py-1 text-sm text-white placeholder-white/30 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(section.id, item.id, 'description', e.target.value)
                      }
                      placeholder="Description"
                      className="w-full rounded bg-transparent px-2 py-1 text-sm text-white/60 placeholder-white/20 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={item.price}
                      onChange={(e) => updateItem(section.id, item.id, 'price', e.target.value)}
                      placeholder="$0.00"
                      className="w-full rounded bg-transparent px-2 py-1 text-sm text-neon-green-500 placeholder-white/20 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end sm:col-span-2">
                    <button
                      onClick={() => removeItem(section.id, item.id)}
                      className="text-white/20 hover:text-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addItem(section.id)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-neon-green-500 hover:text-neon-green-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        ))
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={addSection}
          className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-neon-green-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neon-green-400 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Menu'}
        </button>
      </div>
    </div>
  );
}

function MenuPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none space-y-4 opacity-40 blur-[2px]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="h-6 w-32 rounded bg-white/10" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <div className="space-y-1">
                  <div className="h-4 w-24 rounded bg-white/10" />
                  <div className="h-3 w-40 rounded bg-white/5" />
                </div>
                <div className="h-4 w-12 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <UpgradeCTA feature="Menu Editor" variant="overlay" />
    </div>
  );
}

export default function MenuPage() {
  const { activeListing } = usePortalContext();

  if (!activeListing) {
    return <p className="text-white/50">No listing found.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Menu Editor</h1>
        <p className="mt-1 text-sm text-white/50">
          Build your menu with sections and items. Drag to reorder.
        </p>
      </div>

      <FeatureGate feature="menu_editor" fallback={<MenuPreview />}>
        <MenuEditor listingId={activeListing.id} />
      </FeatureGate>
    </div>
  );
}
