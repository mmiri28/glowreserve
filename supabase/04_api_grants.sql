-- ============================================================
-- GlowReserve — 04: let the website's roles reach the tables
-- Run in the Supabase SQL Editor after 03. Safe to run more than once.
--
-- Newer Supabase projects do not automatically grant the API roles
-- (anon = logged-out visitors, authenticated = logged-in users) access
-- to tables created in the SQL Editor. Without these grants every
-- read from the site fails with "permission denied", and the app
-- cannot even see a user's own profile or role.
--
-- Granting table access does NOT open the data: row level security
-- (set up in schema.sql and 02) still decides which rows each user
-- may see or change.
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Logged-in users: full table access, filtered row by row by RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Server routes using the service-role key.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Logged-out visitors: read-only (business pages, services, reviews,
-- free slots). RLS limits the rows.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- …but never phone numbers or other private profile columns.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, username, full_name, avatar_url, role, verification_status, created_at, updated_at)
  ON public.profiles TO anon;

-- Functions used inside the security rules.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Tables added later get the same treatment automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;

-- Check: every value should be true.
SELECT
  has_table_privilege('authenticated', 'public.profiles', 'SELECT')   AS users_can_read_profiles,
  has_table_privilege('authenticated', 'public.bookings', 'INSERT')   AS users_can_book,
  has_table_privilege('anon', 'public.businesses', 'SELECT')          AS visitors_can_see_businesses,
  NOT has_column_privilege('anon', 'public.profiles', 'phone', 'SELECT') AS visitors_cannot_see_phones;
