# ✨ GlowReserve — Premium Beauty & Wellness Marketplace

A full-stack, production-ready beauty booking marketplace built with **Next.js 14**, **Supabase**, **Resend**, and **Twilio**.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + custom design system |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Email | Resend |
| SMS | Twilio |
| Charts | Recharts |
| Deployment | Vercel |

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
cp .env.local.example .env.local
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

Run in **SQL Editor**:
1. `supabase/schema.sql` — tables, RLS, triggers
2. `supabase/seed.sql` — demo data (update owner UUIDs first)

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
- CRON_SECRET protects cron endpoint

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

```bash
vercel --prod
```

Add all env vars to Vercel dashboard. Cron (`vercel.json`) runs every minute.
