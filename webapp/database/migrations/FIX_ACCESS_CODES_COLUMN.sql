-- Quick Fix: Add missing created_by column to access_codes
-- Run this in Supabase SQL Editor

ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
