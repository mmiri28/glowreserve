-- ============================================================
-- GlowReserve — 05: profiles are private
-- Run in the Supabase SQL Editor after 04. Safe to run more than once.
--
-- Before: any logged-in user could read the full profile, phone included, of
-- every reviewer, business owner and admin (rule "Profiles: public rows for
-- reviewers, owners and admins" from 02).
--
-- After:
--   • you read your own profile (rule from schema.sql, unchanged);
--   • admins read all profiles;
--   • a business owner reads the profiles of customers who booked with
--     their business (needed to serve them; matches the privacy policy);
--   • everyone else sees only the name and picture of people who wrote
--     a review, through public.public_profiles(), never the phone number.
-- ============================================================

-- ---------- helpers (run as the table owner, so they can look past RLS) ----------

-- True when the signed-in user owns a business this person has booked with.
CREATE OR REPLACE FUNCTION public.is_my_customer(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.businesses bz ON bz.id = b.business_id
    WHERE b.customer_id = profile_id
      AND bz.owner_id = auth.uid()
  );
$$;

-- IDs of the admins, so a user can notify them (e.g. "verification submitted").
CREATE OR REPLACE FUNCTION public.admin_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT id FROM public.profiles WHERE role = 'admin';
$$;

-- Public name and picture of review authors (for business pages). Only people
-- who have written at least one review; never phone, role or other fields.
CREATE OR REPLACE FUNCTION public.public_profiles(ids UUID[])
RETURNS TABLE (id UUID, username TEXT, full_name TEXT, avatar_url TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT p.id, p.username, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY (ids[1:200])
    AND EXISTS (SELECT 1 FROM public.reviews r WHERE r.customer_id = p.id);
$$;

-- Who may call them. Functions used inside security rules must be callable by
-- the roles whose requests those rules check.
REVOKE ALL ON FUNCTION public.is_my_customer(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_my_customer(UUID) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_ids() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.public_profiles(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_profiles(UUID[]) TO anon, authenticated, service_role;

-- ---------- profile reading rules ----------

-- Remove the wide rules: the original "anyone can read" (schema.sql) and its
-- replacement from 02, which still let every logged-in user read the full
-- profiles (phone included) of all reviewers, business owners and admins.
DROP POLICY IF EXISTS "Profiles: anyone can read public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: public rows for reviewers, owners and admins" ON public.profiles;

-- Admins read all (same as 02; recreated so this file works on its own).
DROP POLICY IF EXISTS "Profiles: admin reads all" ON public.profiles;
CREATE POLICY "Profiles: admin reads all"
  ON public.profiles FOR SELECT USING (public.is_admin());

-- Business owners read the profiles of customers who booked with them (as in
-- 02, now through the helper so it does not depend on other tables' rules).
DROP POLICY IF EXISTS "Profiles: owner reads their customers" ON public.profiles;
CREATE POLICY "Profiles: owner reads their customers"
  ON public.profiles FOR SELECT USING (public.is_my_customer(id));

-- Names used by an earlier draft of this file, in case it was run.
DROP POLICY IF EXISTS "Profiles: admins read all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: business owners read their customers" ON public.profiles;

-- Unchanged: "Profiles: users can read own profile" (schema.sql).

-- ---------- notifying admins no longer needs to read their profiles ----------

DROP POLICY IF EXISTS "Notifications: user can notify admins" ON public.notifications;
CREATE POLICY "Notifications: user can notify admins"
  ON public.notifications FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id IN (SELECT public.admin_ids())
  );
