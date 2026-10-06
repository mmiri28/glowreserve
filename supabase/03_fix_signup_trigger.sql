-- ============================================================
-- GlowReserve — 03: fix "Database error saving new user"
-- Run in the Supabase SQL Editor after 02. Safe to run more than once.
--
-- Sign-up inserts into auth.users as Supabase's internal auth role,
-- whose search_path does not include `public`. A trigger function
-- that says `profiles` instead of `public.profiles` then fails with
-- "relation profiles does not exist". Every name below is written in
-- full and search_path is empty, as Supabase recommends for
-- SECURITY DEFINER functions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_role TEXT := NEW.raw_user_meta_data->>'role';
BEGIN
  INSERT INTO public.profiles (id, username, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    CASE WHEN requested_role = 'business_owner' THEN 'business_owner' ELSE 'customer' END
  );
  RETURN NEW;
END;
$$;

-- Same hardening for the other functions that run as their owner.
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.businesses
  SET
    rating = (SELECT AVG(rating)::DECIMAL(2,1) FROM public.reviews WHERE business_id = NEW.business_id),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE business_id = NEW.business_id)
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_expired_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.slots
  SET status = 'free', hold_expires_at = NULL
  WHERE status = 'hold' AND hold_expires_at < NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Make sure sign-up is connected to the fixed function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Shows the live setting; expect: handle_new_user | {search_path=""}
SELECT proname, proconfig FROM pg_proc WHERE proname = 'handle_new_user';
