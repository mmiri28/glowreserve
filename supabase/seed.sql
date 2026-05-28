-- ============================================================
-- GlowReserve Seed Data (Demo)
-- Run AFTER schema.sql
-- ============================================================

-- NOTE: Replace UUIDs with real auth user IDs from your Supabase project.
-- These are placeholder values for demonstration.

-- Demo business owners (create these users in Supabase Auth first)
-- Then insert their profiles and businesses below.

-- ---- DEMO BUSINESSES ----

INSERT INTO businesses (id, owner_id, name, slug, description, category, city, address, phone, email, is_verified, rating, total_reviews)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001', -- replace with real owner_id
    'Luxe Lash Lounge',
    'luxe-lash-lounge',
    'Premium lash extensions and brow services in the heart of Manhattan. Over 5 years of experience creating stunning, natural-looking enhancements.',
    'Lashes',
    'New York, NY',
    '123 Fifth Avenue, Suite 4B',
    '+1 (212) 555-0101',
    'hello@luxelash.com',
    true,
    4.9,
    342
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Glow Nail Studio',
    'glow-nail-studio',
    'Artisan nail care with a focus on nail health and creative designs. From minimalist classics to intricate nail art.',
    'Nails',
    'Los Angeles, CA',
    '456 Sunset Boulevard',
    '+1 (310) 555-0202',
    'book@glownails.com',
    true,
    4.8,
    218
  ),
  (
    'b3000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Velvet Hair Salon',
    'velvet-hair-salon',
    'Luxury hair salon specializing in balayage, precision cuts, and restorative treatments. Your hair transformation starts here.',
    'Hair',
    'Miami, FL',
    '789 Ocean Drive',
    '+1 (305) 555-0303',
    'style@velvethair.com',
    true,
    4.7,
    481
  )
ON CONFLICT (slug) DO NOTHING;


-- ---- DEMO SERVICES ----

INSERT INTO services (business_id, name, description, duration_minutes, price, category)
VALUES
  -- Luxe Lash Lounge
  ('b1000000-0000-0000-0000-000000000001', 'Classic Full Set', 'Natural-looking individual lash extensions applied to each natural lash.', 90, 120.00, 'Lashes'),
  ('b1000000-0000-0000-0000-000000000001', 'Volume Full Set', 'Multi-dimensional fans for a dramatic, fluffy effect.', 120, 160.00, 'Lashes'),
  ('b1000000-0000-0000-0000-000000000001', 'Lash Fill (2 weeks)', 'Maintenance fill for existing lash sets.', 60, 75.00, 'Lashes'),
  ('b1000000-0000-0000-0000-000000000001', 'Brow Lamination', 'Sleek, defined brows that last up to 6 weeks.', 45, 85.00, 'Brows'),
  ('b1000000-0000-0000-0000-000000000001', 'Brow Tint & Shape', 'Custom brow tinting and professional shaping.', 30, 55.00, 'Brows'),

  -- Glow Nail Studio
  ('b2000000-0000-0000-0000-000000000002', 'Classic Manicure', 'Shape, cuticle care, and polish of your choice.', 45, 35.00, 'Nails'),
  ('b2000000-0000-0000-0000-000000000002', 'Gel Manicure', 'Long-lasting gel polish with LED cure.', 60, 55.00, 'Nails'),
  ('b2000000-0000-0000-0000-000000000002', 'Acrylic Full Set', 'Durable acrylic extensions with custom shape.', 90, 75.00, 'Nails'),
  ('b2000000-0000-0000-0000-000000000002', 'Nail Art (per nail)', 'Custom hand-painted designs.', 15, 5.00, 'Nails'),
  ('b2000000-0000-0000-0000-000000000002', 'Pedicure Deluxe', 'Soak, exfoliation, massage, and polish.', 75, 65.00, 'Nails'),

  -- Velvet Hair Salon
  ('b3000000-0000-0000-0000-000000000003', 'Balayage', 'Hand-painted highlights for a sun-kissed, natural look.', 180, 220.00, 'Hair'),
  ('b3000000-0000-0000-0000-000000000003', 'Precision Cut', 'Custom cut tailored to your face shape and lifestyle.', 60, 85.00, 'Hair'),
  ('b3000000-0000-0000-0000-000000000003', 'Blowout', 'Professional blowdry and style.', 45, 60.00, 'Hair'),
  ('b3000000-0000-0000-0000-000000000003', 'Keratin Treatment', 'Smoothing treatment for frizz-free, silky hair.', 150, 280.00, 'Hair'),
  ('b3000000-0000-0000-0000-000000000003', 'Color Correction', 'Expert color correction for previous coloring mistakes.', 240, 350.00, 'Hair')
ON CONFLICT DO NOTHING;


-- ---- AVAILABILITY TEMPLATES ----

-- Luxe Lash: Mon–Fri 10am–6pm
INSERT INTO availability_templates (business_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 1, '10:00', '18:00', 60, true),
  ('b1000000-0000-0000-0000-000000000001', 2, '10:00', '18:00', 60, true),
  ('b1000000-0000-0000-0000-000000000001', 3, '10:00', '18:00', 60, true),
  ('b1000000-0000-0000-0000-000000000001', 4, '10:00', '18:00', 60, true),
  ('b1000000-0000-0000-0000-000000000001', 5, '10:00', '18:00', 60, true)
ON CONFLICT (business_id, day_of_week) DO NOTHING;

-- Glow Nails: Tue–Sat 9am–7pm
INSERT INTO availability_templates (business_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES
  ('b2000000-0000-0000-0000-000000000002', 2, '09:00', '19:00', 60, true),
  ('b2000000-0000-0000-0000-000000000002', 3, '09:00', '19:00', 60, true),
  ('b2000000-0000-0000-0000-000000000002', 4, '09:00', '19:00', 60, true),
  ('b2000000-0000-0000-0000-000000000002', 5, '09:00', '19:00', 60, true),
  ('b2000000-0000-0000-0000-000000000002', 6, '09:00', '17:00', 60, true)
ON CONFLICT (business_id, day_of_week) DO NOTHING;

-- Velvet Hair: Mon–Sat 9am–7pm
INSERT INTO availability_templates (business_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES
  ('b3000000-0000-0000-0000-000000000003', 1, '09:00', '19:00', 60, true),
  ('b3000000-0000-0000-0000-000000000003', 2, '09:00', '19:00', 60, true),
  ('b3000000-0000-0000-0000-000000000003', 3, '09:00', '19:00', 60, true),
  ('b3000000-0000-0000-0000-000000000003', 4, '09:00', '19:00', 60, true),
  ('b3000000-0000-0000-0000-000000000003', 5, '09:00', '19:00', 60, true),
  ('b3000000-0000-0000-0000-000000000003', 6, '09:00', '17:00', 60, true)
ON CONFLICT (business_id, day_of_week) DO NOTHING;
