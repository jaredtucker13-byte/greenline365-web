/**
 * Seed Script for GreenLine365
 * 
 * Reads configuration from /config/*.yml files and upserts into Supabase
 * 
 * Usage: npm run supabase:seed
 * Or: npx ts-node scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DemoProfile {
  id: string;
  slug: string;
  business_name: string;
  city_location: string;
  industry: string;
  primary_color: string;
  accent_color: string;
  description?: string;
  logo_url?: string;
  is_default?: boolean;
}

interface Industry {
  id: string;
  name: string;
  default_demo_profile_id: string;
  icon: string;
  description: string;
}

async function loadYamlFile(filename: string): Promise<any> {
  const filePath = path.join(__dirname, '..', 'config', filename);
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

async function seedDemoProfiles(): Promise<void> {
  console.log('\n📦 Seeding demo_profiles...');
  
  const data = await loadYamlFile('demo-profiles.yml');
  if (!data?.profiles) {
    console.log('  No profiles found in demo-profiles.yml');
    return;
  }

  const profiles: DemoProfile[] = data.profiles.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    business_name: p.business_name,
    city_location: p.city_location,
    industry: p.industry,
    primary_color: p.primary_color,
    accent_color: p.accent_color,
    description: p.description || null,
    logo_url: p.logo_url || null,
    is_default: p.is_default || false,
  }));

  for (const profile of profiles) {
    const { error } = await supabase
      .from('demo_profiles')
      .upsert(profile, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Error upserting profile ${profile.id}:`, error.message);
    } else {
      console.log(`  ✅ ${profile.business_name}`);
    }
  }

  console.log(`  Seeded ${profiles.length} demo profiles`);
}

async function seedIndustries(): Promise<void> {
  console.log('\n🏭 Seeding industries...');
  
  const data = await loadYamlFile('industries.yml');
  if (!data?.industries) {
    console.log('  No industries found in industries.yml');
    return;
  }

  const industries: Industry[] = data.industries.map((i: any, index: number) => ({
    id: i.id,
    name: i.name,
    default_demo_profile_id: i.default_demo_profile_id,
    icon: i.icon,
    description: i.description,
    sort_order: index,
  }));

  for (const industry of industries) {
    const { error } = await supabase
      .from('industries')
      .upsert(industry, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Error upserting industry ${industry.id}:`, error.message);
    } else {
      console.log(`  ✅ ${industry.name}`);
    }
  }

  console.log(`  Seeded ${industries.length} industries`);
}

async function main() {
  console.log('🌱 GreenLine365 Database Seeder');
  console.log('================================');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  try {
    // Seed in order (demo_profiles first since industries references it)
    await seedDemoProfiles();
    await seedIndustries();

    console.log('\n✅ Seeding complete!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
