-- ============================================================
-- GlowReserve — 02: reconcile schema with the code + security fixes
-- Run AFTER schema.sql and BEFORE seed.sql, in the Supabase SQL Editor.
--
-- Why this file exists: the verification, waitlist and staff-schedule
-- features were added in code, but their database changes only ever
-- lived in the (now deleted) Supabase dashboard. This file rebuilds
-- them from how the code uses them, and closes access holes found in
-- the October 2026 review.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Helper: is the current user an admin?
--    SECURITY DEFINER so policies on profiles can call it without
--    recursing into profiles' own RLS.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- True when the request runs with the service-role key (server routes).
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
      OR coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') = 'service_role'
      OR current_user IN ('postgres', 'service_role', 'supabase_admin');
$$;


-- ------------------------------------------------------------
-- 2. Missing columns
-- ------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (verification_status IN
      ('not_started', 'email_verified', 'phone_verified', 'pending_review', 'verified', 'rejected'));

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 3. Missing tables
-- ------------------------------------------------------------

-- Weekly working hours per staff member (business dashboard → Staff).
CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (staff_id, day_of_week)
);

ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff availability: public read"
  ON staff_availability FOR SELECT USING (true);

CREATE POLICY "Staff availability: owner manage"
  ON staff_availability FOR ALL USING (
    staff_id IN (
      SELECT s.id FROM staff s JOIN businesses b ON b.id = s.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Business-owner identity verification (one row per user).
CREATE TABLE IF NOT EXISTS verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  document_type TEXT,
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  selfie_with_id_url TEXT,
  phone TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (verification_status IN ('pending_review', 'verified', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications: user reads own"
  ON verifications FOR SELECT USING (auth.uid() = user_id);

-- A user may submit or resubmit, but only ever as 'pending_review'.
CREATE POLICY "Verifications: user submits own"
  ON verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND verification_status = 'pending_review');

CREATE POLICY "Verifications: user resubmits own"
  ON verifications FOR UPDATE
  USING (auth.uid() = user_id AND verification_status <> 'verified')
  WITH CHECK (auth.uid() = user_id AND verification_status = 'pending_review');

CREATE POLICY "Verifications: admin full access"
  ON verifications FOR ALL USING (public.is_admin());

-- Waitlist. The table exists so the schema matches the code, but the
-- feature is switched off in the app until /api/waitlist is built.
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  preferred_date DATE NOT NULL,
  preferred_time_start TIME,
  preferred_time_end TIME,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (customer_id, business_id, preferred_date)
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Waitlist: customer manages own"
  ON waitlist FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Waitlist: owner reads their business"
  ON waitlist FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );


-- ------------------------------------------------------------
-- 4. SECURITY: profiles
-- ------------------------------------------------------------

-- 4a. Signup: the trigger now sets role (customer / business_owner only,
--     never admin) and phone from the signup data. This replaces the
--     job the unauthenticated /api/auth/set-role route used to do.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT := NEW.raw_user_meta_data->>'role';
BEGIN
  INSERT INTO profiles (id, username, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    CASE WHEN requested_role = 'business_owner' THEN 'business_owner' ELSE 'customer' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4b. Nobody but an admin (or a server route using the service role)
--     can change a role, and users cannot mark themselves verified.
CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_service_role() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only an admin can change a role';
  END IF;

  IF NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Username cannot be changed';
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NEW.verification_status IN ('verified', 'rejected') THEN
    RAISE EXCEPTION 'Only an admin can approve or reject verification';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;  -- runs as the caller on purpose

DROP TRIGGER IF EXISTS profiles_protect_fields ON profiles;
CREATE TRIGGER profiles_protect_fields BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_fields();

-- The original update rule looked up profiles inside its own check, which
-- Postgres rejects as infinite recursion, so profile edits always failed.
-- The username lock now lives in the trigger above instead.
DROP POLICY IF EXISTS "Profiles: users can update own profile (not username)" ON profiles;
CREATE POLICY "Profiles: users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4c. Reading profiles. Replaces "anyone can read public profiles"
--     (USING true), which exposed every user's phone number.
DROP POLICY IF EXISTS "Profiles: anyone can read public profiles" ON profiles;

CREATE POLICY "Profiles: admin reads all"
  ON profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "Profiles: owner reads their customers"
  ON profiles FOR SELECT USING (
    id IN (
      SELECT bk.customer_id FROM bookings bk
      JOIN businesses b ON b.id = bk.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Reviewer names/avatars on public business pages, business owners'
-- names in listings, and admins (so users can notify them).
CREATE POLICY "Profiles: public rows for reviewers, owners and admins"
  ON profiles FOR SELECT USING (
    role IN ('business_owner', 'admin')
    OR id IN (SELECT customer_id FROM reviews WHERE customer_id IS NOT NULL)
  );

-- Logged-out visitors never see phone numbers, whatever row they can see.
-- (Logged-in users can still see the phone of a reviewer, business owner
--  or admin — see "Known limits" in the README.)
REVOKE SELECT ON profiles FROM anon;
GRANT SELECT (id, username, full_name, avatar_url, role, verification_status, created_at, updated_at)
  ON profiles TO anon;

CREATE POLICY "Profiles: admin updates all"
  ON profiles FOR UPDATE USING (public.is_admin());


-- ------------------------------------------------------------
-- 5. SECURITY: businesses — owners cannot verify themselves or edit
--    their own rating.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION protect_business_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_service_role() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := FALSE;
    NEW.rating := 0.0;
    NEW.total_reviews := 0;
    RETURN NEW;
  END IF;

  -- update_business_rating() runs as the database owner, so its updates
  -- pass is_service_role(); a business owner's own update keeps the old values.
  NEW.is_verified := OLD.is_verified;
  NEW.rating := OLD.rating;
  NEW.total_reviews := OLD.total_reviews;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;  -- runs as the caller on purpose

DROP TRIGGER IF EXISTS businesses_protect_fields ON businesses;
CREATE TRIGGER businesses_protect_fields BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION protect_business_fields();

CREATE POLICY "Businesses: admin full access"
  ON businesses FOR ALL USING (public.is_admin());


-- ------------------------------------------------------------
-- 6. Admin access the admin pages rely on (they were empty before).
-- ------------------------------------------------------------
CREATE POLICY "Bookings: admin reads all"
  ON bookings FOR SELECT USING (public.is_admin());

CREATE POLICY "Reviews: admin full access"
  ON reviews FOR ALL USING (public.is_admin());


-- ------------------------------------------------------------
-- 7. Notifications had no INSERT rule, so in-app notifications failed.
-- ------------------------------------------------------------
CREATE POLICY "Notifications: admin can notify anyone"
  ON notifications FOR INSERT WITH CHECK (public.is_admin());

-- A user may notify admins (e.g. "verification submitted"), nobody else.
CREATE POLICY "Notifications: user can notify admins"
  ON notifications FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id IN (SELECT id FROM profiles WHERE role = 'admin')
  );


-- ------------------------------------------------------------
-- 8. Storage buckets
-- ------------------------------------------------------------

-- Public: business logos and cover images, stored as <business_id>/<file>.
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "business-assets: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'business-assets');

CREATE POLICY "business-assets: owner writes own business folder"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "business-assets: owner updates own business folder"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM businesses WHERE owner_id = auth.uid())
  );

-- Private: ID documents and selfies, stored as <user_id>/<file>.
-- Readable only by the uploader and admins (admins use 5-minute signed URLs).
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "verifications: user uploads own folder"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "verifications: user updates own folder"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "verifications: user and admin read"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'verifications'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );


-- ------------------------------------------------------------
-- 9. Scheduled job: release expired slot holds every minute.
--    Runs inside Supabase (pg_cron), so no external scheduler is needed.
--    Replaces the Vercel cron in vercel.json, which does not run on Netlify.
--    Reminders and waitlist notifications are not built yet.
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('release-expired-holds', '* * * * *', $$SELECT public.release_expired_holds()$$);
