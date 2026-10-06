# ✨ GlowReserve — Premium Beauty & Wellness Marketplace

A full-stack, production-ready beauty booking marketplace built with **Next.js 16**, **Supabase**, **Resend**, and **Twilio**.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + custom design system |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Email | Resend |
| SMS | Twilio |
| Charts | Recharts |
| Deployment | Netlify |

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone <your-repo-url> glowreserve
cd glowreserve
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-secret-cron-token
```

### 3. Set up Supabase

Run in the **SQL Editor**, in this order:
1. `supabase/schema.sql` — base tables, RLS, triggers
2. `supabase/02_reconcile_and_security.sql` — verification, waitlist and staff-hours tables, storage buckets, admin access, security fixes, and the pg_cron job that releases expired holds
3. `supabase/03_fix_signup_trigger.sql` — makes the sign-up trigger name tables in full (without it, sign-up fails with "Database error saving new user")
4. `supabase/seed.sql` — demo data (optional; update owner UUIDs first)

To make the first admin: sign up normally, then in the SQL Editor run
`update profiles set role = 'admin' where username = '<your-username>';`
Admins can promote other users from `/admin/users` after that.

### 4. Run

```bash
npm run dev
```

---

## 📁 Project Structure

```
app/
  page.tsx                    Landing page
  explore/                    Search & browse
  auth/login|register         Authentication
  dashboard/                  Customer portal
    book/                     4-step booking wizard
    appointments/             Manage bookings + reviews
    profile/                  Settings (username locked)
    notifications/            Real-time notifications
  business/
    [slug]/                   Public profile + booking widget
    register/                 Onboarding flow
    dashboard/
      analytics/              KPIs + bar chart
      calendar/               Month/Week/Day view
      appointments/           Approve / decline queue
      services/               CRUD services
      availability/           Template + slot generator
  api/
    bookings/                 Create booking (anti-double-book)
    reviews/                  Submit review
    slots/[id]/               Hold / release
    notifications/            Email + SMS triggers
    cron/release-holds/       Clean up expired holds
```

---

## 🔑 Key Mechanics

### Registration Validation
Username, email, and phone checked for uniqueness **before** creating auth user. Username is **permanently locked** after registration at both UI and DB level.

### Anti-Double Booking
`UNIQUE(business_id, staff_id, slot_datetime)` constraint at the DB level. Slots flow: `free → hold (5 min) → reserved`. Cron releases expired holds every minute.

### Notification Flow
```
Book  → Email owner + SMS owner + in-app "Pending"
Approve → Email customer + SMS customer + in-app "Confirmed"
Decline → in-app "Declined" + SMS customer
Complete → in-app "Leave a Review" prompt
```

### Security
- RLS on every table
- Service role key server-side only
- Roles are set at signup by the database trigger (customer or business_owner only). Only admins can change roles or approve verification.
- Business owners cannot verify their own business or edit their rating.
- Logged-out visitors cannot read phone numbers.
- CRON_SECRET protects the cron endpoint

**Known limits**
- A logged-in user can still read the phone number of a business owner, an admin, or a customer who has written a review. Fully hiding phone numbers needs them moved to a separate private table.
- The waitlist is switched off (`lib/features.ts`) until `/api/waitlist` and the waitlist notification job are built.
- Appointment reminders are not built yet.

---

## 🎨 Design Tokens

| Token | Value |
|---|---|
| Gold | `#D4AF37` |
| Charcoal | `#1A1A1A` |
| Cream | `#FDFBF7` |
| Blush | `#F5E6E8` |
| Heading | Playfair Display |
| Body | Montserrat |

---

## 🌐 Deploy

Netlify detects Next.js automatically. Add the variables from `.env.example` under Site configuration → Environment variables, then deploy.
No external cron is needed: expired holds are released by pg_cron inside Supabase.
