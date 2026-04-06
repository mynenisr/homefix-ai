-- HomeFix AI — Solo MVP Schema
-- Run this in Supabase Dashboard > SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Users (mirrors Supabase auth.users) ─────────────────────────────────────
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  phone       text,
  role        text not null default 'HOMEOWNER' check (role in ('HOMEOWNER','PROPERTY_MANAGER','ADMIN')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Vendors ─────────────────────────────────────────────────────────────────
create table public.vendors (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  company              text,
  email                text not null,
  phone                text not null,
  categories           text[] not null default '{}',
  tier                 text not null default 'ACTIVE' check (tier in ('PROBATIONARY','ACTIVE','PREFERRED','ELITE')),
  rating               numeric(3,2) not null default 4.0 check (rating between 0 and 5),
  total_jobs           int not null default 0,
  service_radius_miles int not null default 25,
  license_number       text,
  insurance_url        text,
  hourly_rate_min      numeric(10,2),
  hourly_rate_max      numeric(10,2),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_vendors_categories on public.vendors using gin(categories);
create index idx_vendors_active on public.vendors(is_active);

-- ─── Cases ───────────────────────────────────────────────────────────────────
create table public.cases (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  vendor_id       uuid references public.vendors(id) on delete set null,
  category        text not null default 'GENERAL' check (category in ('PLUMBING','ELECTRICAL','HVAC','APPLIANCE','ROOFING','PEST_CONTROL','LOCKSMITH','GENERAL')),
  severity        text not null default 'NORMAL' check (severity in ('EMERGENCY','URGENT','NORMAL')),
  status          text not null default 'NEW' check (status in ('NEW','TRIAGED','SELF_SERVICE','MATCHING','SCHEDULED','IN_PROGRESS','INVOICED','COMPLETED','CLOSED','EMERGENCY')),
  description     text not null,
  address         text,
  photo_urls      text[] not null default '{}',
  diagnosis       text,
  playbook        text[],
  safety_flags    text[] not null default '{}',
  confidence      numeric(4,3),
  resolution_type text check (resolution_type in ('SELF_SERVICE','VENDOR','EMERGENCY','CANCELLED')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_cases_user_id on public.cases(user_id);
create index idx_cases_status on public.cases(status);
create index idx_cases_severity on public.cases(severity);
create index idx_cases_created_at on public.cases(created_at desc);

-- ─── Case Timeline ────────────────────────────────────────────────────────────
create table public.case_timeline (
  id          uuid primary key default uuid_generate_v4(),
  case_id     uuid not null references public.cases(id) on delete cascade,
  stage       text not null,
  actor       text not null check (actor in ('USER','VENDOR','AI','SYSTEM')),
  description text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index idx_timeline_case_id on public.case_timeline(case_id);

-- ─── Vendor Applications ──────────────────────────────────────────────────────
create table public.vendor_applications (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  company              text,
  email                text not null,
  phone                text not null,
  categories           text[] not null default '{}',
  service_radius_miles int not null default 25,
  license_number       text,
  insurance_url        text,
  hourly_rate_min      numeric(10,2),
  hourly_rate_max      numeric(10,2),
  status               text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at           timestamptz not null default now()
);

-- ─── Feedback ────────────────────────────────────────────────────────────────
create table public.feedback (
  id         uuid primary key default uuid_generate_v4(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  vendor_id  uuid references public.vendors(id) on delete set null,
  rating     int not null check (rating between 1 and 5),
  tags       text[] not null default '{}',
  comment    text,
  created_at timestamptz not null default now()
);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger touch_cases_updated_at before update on public.cases
  for each row execute procedure public.touch_updated_at();
create trigger touch_vendors_updated_at before update on public.vendors
  for each row execute procedure public.touch_updated_at();
create trigger touch_users_updated_at before update on public.users
  for each row execute procedure public.touch_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.cases enable row level security;
alter table public.vendors enable row level security;
alter table public.case_timeline enable row level security;
alter table public.feedback enable row level security;
alter table public.vendor_applications enable row level security;

-- Users: see own profile
create policy "users_own" on public.users for all using (auth.uid() = id);

-- Cases: users see own cases; admins see all
create policy "cases_own" on public.cases for all using (
  auth.uid() = user_id or
  exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN','PROPERTY_MANAGER'))
);

-- Timeline: follows case access
create policy "timeline_follow_case" on public.case_timeline for all using (
  exists (
    select 1 from public.cases c where c.id = case_id and (
      c.user_id = auth.uid() or
      exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN','PROPERTY_MANAGER'))
    )
  )
);

-- Vendors: readable by all authenticated users; writable by admin only
create policy "vendors_read" on public.vendors for select using (auth.role() = 'authenticated');
create policy "vendors_admin" on public.vendors for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- Feedback: own rows
create policy "feedback_own" on public.feedback for all using (auth.uid() = user_id);

-- Vendor applications: anyone can insert; admins manage
create policy "vendor_apps_insert" on public.vendor_applications for insert with check (true);
create policy "vendor_apps_admin" on public.vendor_applications for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- ─── Sample Vendor Data ───────────────────────────────────────────────────────
insert into public.vendors (name, company, email, phone, categories, tier, rating, total_jobs, service_radius_miles, hourly_rate_min, hourly_rate_max) values
  ('Mike Torres', 'Torres Plumbing', 'mike@torresplumbing.com', '+14155550001', ARRAY['PLUMBING'], 'PREFERRED', 4.8, 142, 30, 85, 150),
  ('Sarah Chen', 'BrightSpark Electric', 'sarah@brightspark.com', '+14155550002', ARRAY['ELECTRICAL'], 'ELITE', 4.9, 287, 25, 95, 175),
  ('Dave Kim', 'CoolAir HVAC', 'dave@coolair.com', '+14155550003', ARRAY['HVAC'], 'ACTIVE', 4.5, 63, 20, 90, 160),
  ('Ana Reyes', 'AllFix Handyman', 'ana@allfix.com', '+14155550004', ARRAY['GENERAL','APPLIANCE','LOCKSMITH'], 'PREFERRED', 4.7, 201, 35, 65, 120);
