-- ============================================================
-- GlowReserve Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE (extends Supabase Auth users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'business_owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Username is permanent — no updates allowed via RLS
CREATE POLICY "Profiles: users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles: users can update own profile (not username)"
  ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND username = (SELECT username FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Profiles: anyone can read public profiles"
  ON profiles FOR SELECT USING (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BUSINESSES TABLE
-- ============================================================
CREATE TABLE businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  cover_image_url TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses: public read"
  ON businesses FOR SELECT USING (true);

CREATE POLICY "Businesses: owner can manage"
  ON businesses FOR ALL USING (auth.uid() = owner_id);

-- ============================================================
-- SERVICES TABLE
-- ============================================================
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  price DECIMAL(10,2),
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services: public read active"
  ON services FOR SELECT USING (is_active = true);

CREATE POLICY "Services: owner full access"
  ON services FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- ============================================================
-- STAFF TABLE
-- ============================================================
CREATE TABLE staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  avatar_url TEXT,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff: public read"
  ON staff FOR SELECT USING (true);

CREATE POLICY "Staff: owner full access"
  ON staff FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- ============================================================
-- SLOTS TABLE (Availability)
-- ============================================================
CREATE TABLE slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id),
  slot_datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'hold', 'reserved', 'blocked')),
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Anti-double booking: unique constraint on provider + time
  CONSTRAINT unique_slot_per_provider UNIQUE (business_id, staff_id, slot_datetime)
);

ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slots: public read free slots"
  ON slots FOR SELECT USING (true);

CREATE POLICY "Slots: owner full access"
  ON slots FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Slots: customers can update to hold"
  ON slots FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id),
  slot_id UUID REFERENCES slots(id),
  slot_datetime TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookings: customer sees own bookings"
  ON bookings FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Bookings: owner sees their business bookings"
  ON bookings FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Bookings: customer can create"
  ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Bookings: owner can update status"
  ON bookings FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Bookings: customer can cancel own"
  ON bookings FOR UPDATE USING (
    auth.uid() = customer_id AND status = 'pending'
  );

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews: public read"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Reviews: customer can create once per booking"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- ============================================================
-- AVAILABILITY TEMPLATES
-- ============================================================
CREATE TABLE availability_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(business_id, day_of_week)
);

ALTER TABLE availability_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability: public read"
  ON availability_templates FOR SELECT USING (true);

CREATE POLICY "Availability: owner manage"
  ON availability_templates FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: user sees own"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Notifications: user can mark read"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update business rating on review
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE businesses
  SET
    rating = (SELECT AVG(rating)::DECIMAL(2,1) FROM reviews WHERE business_id = NEW.business_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE business_id = NEW.business_id)
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_business_rating();

-- Release expired holds
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS void AS $$
BEGIN
  UPDATE slots
  SET status = 'free', hold_expires_at = NULL
  WHERE status = 'hold' AND hold_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
