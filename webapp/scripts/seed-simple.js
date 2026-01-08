/**
 * Simple seed runner without TypeScript compilation
 * Run with: node scripts/seed-simple.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo profiles data (from config/demo-profiles.yml)
const demoProfiles = [
  {
    id: 'greenline365',
    slug: 'greenline365',
    business_name: 'GreenLine365',
    city_location: 'Tampa, FL',
    industry: 'technology',
    primary_color: '#39FF14',
    accent_color: '#0CE293',
    description: 'AI-powered planning and accountability platform',
    is_default: true,
  },
  {
    id: 'tampa-bay-bakery',
    slug: 'tampa-bay-bakery',
    business_name: 'Tampa Bay Bakery',
    city_location: 'Tampa, FL',
    industry: 'food_beverage',
    primary_color: '#FF6B35',
    accent_color: '#F7C59F',
    description: 'Local artisan bakery and cafe',
    is_default: false,
  },
  {
    id: 'miami-auto-group',
    slug: 'miami-auto-group',
    business_name: 'Miami Auto Group',
    city_location: 'Miami, FL',
    industry: 'automotive',
    primary_color: '#00D4FF',
    accent_color: '#7B68EE',
    description: 'Premium automotive dealership',
    is_default: false,
  },
  {
    id: 'orlando-med-spa',
    slug: 'orlando-med-spa',
    business_name: 'Orlando Med Spa',
    city_location: 'Orlando, FL',
    industry: 'healthcare',
    primary_color: '#E91E8C',
    accent_color: '#9B59B6',
    description: 'Medical spa and wellness center',
    is_default: false,
  },
  {
    id: 'jacksonville-fitness',
    slug: 'jacksonville-fitness',
    business_name: 'Jacksonville Fitness',
    city_location: 'Jacksonville, FL',
    industry: 'fitness',
    primary_color: '#FFD700',
    accent_color: '#FF4500',
    description: 'Full-service fitness center and gym',
    is_default: false,
  },
  {
    id: 'st-pete-realty',
    slug: 'st-pete-realty',
    business_name: 'St. Pete Realty',
    city_location: 'St. Petersburg, FL',
    industry: 'real_estate',
    primary_color: '#4A90D9',
    accent_color: '#2ECC71',
    description: 'Residential and commercial real estate',
    is_default: false,
  },
];

// Industries data (from config/industries.yml)
const industries = [
  { id: 'technology', name: 'Technology & Software', default_demo_profile_id: 'greenline365', icon: '💻', description: 'SaaS, apps, and tech services', sort_order: 0 },
  { id: 'food_beverage', name: 'Food & Beverage', default_demo_profile_id: 'tampa-bay-bakery', icon: '🍽️', description: 'Restaurants, cafes, and food service', sort_order: 1 },
  { id: 'automotive', name: 'Automotive', default_demo_profile_id: 'miami-auto-group', icon: '🚗', description: 'Dealerships, repair shops, and auto services', sort_order: 2 },
  { id: 'healthcare', name: 'Healthcare & Wellness', default_demo_profile_id: 'orlando-med-spa', icon: '🏥', description: 'Medical practices, spas, and wellness centers', sort_order: 3 },
  { id: 'fitness', name: 'Fitness & Sports', default_demo_profile_id: 'jacksonville-fitness', icon: '💪', description: 'Gyms, fitness studios, and sports facilities', sort_order: 4 },
  { id: 'real_estate', name: 'Real Estate', default_demo_profile_id: 'st-pete-realty', icon: '🏠', description: 'Residential and commercial real estate', sort_order: 5 },
  { id: 'retail', name: 'Retail & E-commerce', default_demo_profile_id: 'greenline365', icon: '🛍️', description: 'Shops, stores, and online retail', sort_order: 6 },
  { id: 'professional_services', name: 'Professional Services', default_demo_profile_id: 'greenline365', icon: '💼', description: 'Consulting, legal, accounting, and more', sort_order: 7 },
  { id: 'hospitality', name: 'Hospitality & Tourism', default_demo_profile_id: 'greenline365', icon: '🏨', description: 'Hotels, travel, and tourism services', sort_order: 8 },
  { id: 'education', name: 'Education & Training', default_demo_profile_id: 'greenline365', icon: '📚', description: 'Schools, courses, and training programs', sort_order: 9 },
  { id: 'other', name: 'Other', default_demo_profile_id: 'greenline365', icon: '🔧', description: 'Other industries not listed', sort_order: 10 },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed demo profiles first
  console.log('\n📦 Seeding demo_profiles...');
  for (const profile of demoProfiles) {
    const { error } = await supabase
      .from('demo_profiles')
      .upsert(profile, { onConflict: 'id' });
    
    if (error) {
      console.log(`  ❌ ${profile.business_name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${profile.business_name}`);
    }
  }

  // Seed industries
  console.log('\n🏭 Seeding industries...');
  for (const industry of industries) {
    const { error } = await supabase
      .from('industries')
      .upsert(industry, { onConflict: 'id' });
    
    if (error) {
      console.log(`  ❌ ${industry.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${industry.name}`);
    }
  }

  console.log('\n✅ Seeding complete!');
}

seed().catch(console.error);
