# Supabase Setup & Deployment Guide

This guide will walk you through setting up your connected Supabase database and deploying your applet to hosting platforms like Vercel or Netlify.

---

## Part 1: Supabase Database Setup

Now that your Supabase credentials are connected to the app, you need to create the required database tables and enable real-time synching. 

### Step 1: Open the Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click on your project **iqqbrfzejzauegrfyvaz**.
3. In the left navigation bar, click on **SQL Editor** (icon looking like `_>`).
4. Click **New Query** to open a fresh SQL editor tab.

### Step 2: Copy & Run the Database Schema SQL
Copy the entire block of SQL below, paste it into the query editor, and click **Run** (at the bottom-right of the editor).

```sql
-- 1. Enable UUID Extension (usually enabled by default)
create extension if not exists "uuid-ossp";

-- 2. Create USERS Table
create table if not exists public.users (
  id uuid primary key, -- matches auth.users.id
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'store', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create ITEMS (Inventory) Table
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  quantity integer not null check (quantity >= 0) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create REQUESTS Table
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create ASSIGNED_ITEMS Table
create table if not exists public.assigned_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  assigned_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create COMPLAINTS Table
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  message text not null,
  status text not null check (status in ('pending', 'resolved')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Add Seed Data for Inventory Items
insert into public.items (name, category, quantity) values
  ('MacBook Pro 16" M3', 'Hardware', 12),
  ('Dell UltraSharp 27" Monitor', 'Hardware', 8),
  ('Keychron K2 Keyboard', 'Accessories', 20),
  ('Logitech MX Master 3S Mouse', 'Accessories', 25),
  ('USB-C Charger (96W)', 'Cables & Power', 45),
  ('Standing Desk (Smart)', 'Furniture', 4)
on conflict do nothing;

-- 8. Setup Row Level Security (RLS) policies / Bypass for simplicity
-- For rapid testing, we can enable full access. If you require advanced RLS, you can customize it!
alter table public.users enable row level security;
alter table public.items enable row level security;
alter table public.requests enable row level security;
alter table public.assigned_items enable row level security;
alter table public.complaints enable row level security;

-- Create Permissive Policies for easy prototyping
create policy "Allow public read on users" on public.users for select using (true);
create policy "Allow all actions on users" on public.users for all using (true) with check (true);

create policy "Allow public read on items" on public.items for select using (true);
create policy "Allow all actions on items" on public.items for all using (true) with check (true);

create policy "Allow public read on requests" on public.requests for select using (true);
create policy "Allow all actions on requests" on public.requests for all using (true) with check (true);

create policy "Allow public read on assigned_items" on public.assigned_items for select using (true);
create policy "Allow all actions on assigned_items" on public.assigned_items for all using (true) with check (true);

create policy "Allow public read on complaints" on public.complaints for select using (true);
create policy "Allow all actions on complaints" on public.complaints for all using (true) with check (true);
```

### Step 3: Enable Real-time synchronization
To enable instant updates across different tabs:
1. In the left navigation bar, go to **Database** -> **Replication**.
2. Click **supabase_realtime** active tables.
3. Toggle on replication for `items`, `requests`, `assigned_items`, and `complaints`.

---

## Part 2: Vercel Deployment Guide

To deploy this React + Vite + TypeScript application to **Vercel** with full Supabase synchronization, follow these simple steps:

### Option A: Direct Export to GitHub & Deploy via Vercel Dashboard (Recommended)

1. **Export Code**: Go to the top right of the Google AI Studio Build UI, click on the **Settings/Export** menu, and select **Export to GitHub** or **Download ZIP**.
2. **GitHub Repository**: Create a new repository on your GitHub account and push the code there.
3. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com) and sign in.
   - Click **Add New...** -> **Project**.
   - Import your newly created GitHub repository.
4. **Configure Environment Variables**:
   Under the **Environment Variables** section in the Vercel deployment wizard, add the following two variables:
   * **`VITE_SUPABASE_URL`**: `https://iqqbrfzejzauegrfyvaz.supabase.co`
   * **`VITE_SUPABASE_ANON_KEY`**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcWJyZnplanphdWVncmZ5dmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzgyNzQsImV4cCI6MjA5ODExNDI3NH0.dJ4zg6E-7knIdgaH4DRhEmR-E3x3thd1ksuwFQeb8w4`
5. **Deploy**:
   - Click **Deploy**. Vercel will auto-detect Vite, build the production-ready assets, and provide you with a fast, live URL!

---

## Part 3: Test Accounts Reference

Once the SQL script has been run in Supabase, you can test the three primary roles using the elegant **Sandbox Testing Accounts** pane on the login screen:

| Name | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Sarah Jenkins** | `admin` (Full Access) | `admin@company.com` | `password123` |
| **David Miller** | `store` (Store Manager) | `manager@company.com` | `password123` |
| **Alex Rivera** | `user` (Regular Employee) | `employee@company.com` | `password123` |

Happy building! 🚀
