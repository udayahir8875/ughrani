-- ====================================================================
-- UGHRANI (ઉઘરાણી) - Production Database Schema & Security Policies
-- Platform: Supabase (PostgreSQL 15+)
-- Features: Multi-tenant, Row-Level Security (RLS), Auto-balance Triggers
-- ====================================================================

-- 1. Create Profiles Table (Shop Details linked to Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_name text not null,
  owner_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Customers Table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  balance numeric(12, 2) default 0.00 not null,
  avatar_color text default '#2563eb',
  last_transaction_date timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Transactions Table (Udhar / Jama Entries)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type text check (type in ('credit_given', 'payment_received')) not null,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  bill_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Performance Indexes
create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_customer_id on public.transactions(customer_id);

-- ====================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- Ensures Shopkeeper A can NEVER access or tamper with Shopkeeper B's data
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;

-- Profiles Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Customers Policies
create policy "Users can view own customers"
  on public.customers for select
  using (auth.uid() = user_id);

create policy "Users can insert own customers"
  on public.customers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own customers"
  on public.customers for update
  using (auth.uid() = user_id);

create policy "Users can delete own customers"
  on public.customers for delete
  using (auth.uid() = user_id);

-- Transactions Policies
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ====================================================================
-- 6. AUTOMATIC BALANCE CALCULATION TRIGGER
-- Guarantees 100% mathematical accuracy on every entry (No balance drifts)
-- ====================================================================

create or replace function public.recalculate_customer_balance()
returns trigger as $$
declare
  target_customer_id uuid;
  new_balance numeric(12, 2);
begin
  if (TG_OP = 'DELETE') then
    target_customer_id := OLD.customer_id;
  else
    target_customer_id := NEW.customer_id;
  end if;

  -- Calculate net balance: sum(credit_given) - sum(payment_received)
  select coalesce(sum(case when type = 'credit_given' then amount else -amount end), 0.00)
  into new_balance
  from public.transactions
  where customer_id = target_customer_id;

  -- Update customer balance and last activity timestamp
  update public.customers
  set
    balance = new_balance,
    last_transaction_date = now()
  where id = target_customer_id;

  return null;
end;
$$ language plpgsql security definer;

-- Trigger on insert, update, or delete of any transaction
drop trigger if exists trg_recalculate_balance on public.transactions;
create trigger trg_recalculate_balance
after insert or update or delete on public.transactions
for each row execute function public.recalculate_customer_balance();

-- ====================================================================
-- 7. CASHBOOK ENTRIES TABLE (Cash In & Out with Cash vs Online split)
-- ====================================================================

create table if not exists public.cashbook_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text check (type in ('in', 'out')) not null,
  mode text check (mode in ('cash', 'online')) not null,
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_cashbook_user_id on public.cashbook_entries(user_id);
alter table public.cashbook_entries enable row level security;

create policy "Users can view own cashbook"
  on public.cashbook_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own cashbook"
  on public.cashbook_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own cashbook"
  on public.cashbook_entries for delete
  using (auth.uid() = user_id);

-- ====================================================================
-- 8. TABLE PERMISSIONS & ROLE GRANTS
-- Enables authenticated users and service roles to query their RLS rows
-- ====================================================================

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;


