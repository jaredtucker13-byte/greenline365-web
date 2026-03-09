'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ─── Types ────────────────────────────────────────────────── */

/** JSONB shape stored in businesses.smart_attributes */
export interface SmartAttributes {
  // Dining
  cuisine_type?: string;
  price_range?: string;        // "$" | "$$" | "$$$" | "$$$$"
  outdoor_seating?: boolean;
  reservations?: boolean;

  // Home & Professional Services
  license_number?: string;
  service_radius_miles?: number;
  emergency_available?: boolean;

  // Professional Experts
  years_experience?: number;
  practice_areas?: string[];
  certifications?: string[];

  // General
  established_year?: number;
  languages?: string[];
  accepts_insurance?: boolean;

  // Catch-all for future categories
  [key: string]: unknown;
}

export type BusinessCategory = 'dining' | 'services' | 'professional' | 'general';

interface SmartCardProps {
  category: BusinessCategory;
  attributes: SmartAttributes | null | undefined;
  className?: string;
}

/* ─── Helpers ──────────────────────────────────────────────── */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] text-white/60 border border-white/[0.08]">
      {children}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-widest text-gold/50 font-semibold shrink-0">{label}</span>
      <span className="text-sm text-white/70">{value}</span>
    </div>
  );
}

/* ─── Category-specific renderers ──────────────────────────── */

function DiningFields({ a }: { a: SmartAttributes }) {
  return (
    <>
      <Field label="Cuisine" value={a.cuisine_type} />
      <Field label="Price" value={a.price_range} />
      {a.outdoor_seating && <Pill>Outdoor Seating</Pill>}
      {a.reservations && <Pill>Reservations</Pill>}
    </>
  );
}

function ServiceFields({ a }: { a: SmartAttributes }) {
  return (
    <>
      <Field label="License" value={a.license_number} />
      <Field label="Radius" value={a.service_radius_miles ? `${a.service_radius_miles} mi` : undefined} />
      {a.emergency_available && <Pill>24/7 Emergency</Pill>}
    </>
  );
}

function ProfessionalFields({ a }: { a: SmartAttributes }) {
  return (
    <>
      <Field label="Experience" value={a.years_experience ? `${a.years_experience} yrs` : undefined} />
      {a.practice_areas && a.practice_areas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {a.practice_areas.map((area) => (
            <Pill key={area}>{area}</Pill>
          ))}
        </div>
      )}
      {a.certifications && a.certifications.length > 0 && (
        <Field label="Certs" value={a.certifications.join(', ')} />
      )}
    </>
  );
}

function GeneralFields({ a }: { a: SmartAttributes }) {
  return (
    <>
      <Field label="Est." value={a.established_year} />
      {a.languages && a.languages.length > 0 && (
        <Field label="Languages" value={a.languages.join(', ')} />
      )}
      {a.accepts_insurance && <Pill>Accepts Insurance</Pill>}
    </>
  );
}

/* ─── Main Component ───────────────────────────────────────── */

export default function SmartCard({ category, attributes, className }: SmartCardProps) {
  if (!attributes || Object.keys(attributes).length === 0) return null;

  const Renderer = {
    dining:       DiningFields,
    services:     ServiceFields,
    professional: ProfessionalFields,
    general:      GeneralFields,
  }[category] ?? GeneralFields;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'rounded-2xl border border-white/[0.08] p-4 space-y-2.5',
        'bg-white/[0.03] backdrop-blur-md',
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.15em] text-gold/40 font-semibold">
        {category === 'dining' && 'Dining Details'}
        {category === 'services' && 'Service Details'}
        {category === 'professional' && 'Professional Details'}
        {category === 'general' && 'Business Details'}
      </p>
      <Renderer a={attributes} />
    </motion.div>
  );
}
