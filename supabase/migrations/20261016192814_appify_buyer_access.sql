-- Private buyer-access registry for Appify products.
-- This migration mirrors the initial schema already provisioned in Appify - v2.
begin;

create schema if not exists appify_private;
revoke all on schema appify_private from public, anon, authenticated;
grant usage on schema appify_private to service_role;

create table if not exists appify_private.products (
  product_id uuid primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text not null check (length(btrim(display_name)) between 1 and 160),
  access_state text not null default 'draft'
    check (access_state in ('draft', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appify_private.entitlements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references appify_private.products(product_id) on delete restrict,
  buyer_email_normalized text not null check (
    length(buyer_email_normalized) between 3 and 254
    and buyer_email_normalized = lower(btrim(buyer_email_normalized))
    and position('@' in buyer_email_normalized) > 1
  ),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'refunded', 'chargeback', 'revoked')),
  purchase_provider text check (
    purchase_provider is null
    or length(btrim(purchase_provider)) between 1 and 80
  ),
  purchase_id text check (
    purchase_id is null
    or length(btrim(purchase_id)) between 1 and 255
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (purchase_id is null or purchase_provider is not null)
);

create index if not exists entitlements_access_lookup_idx
  on appify_private.entitlements (product_id, buyer_email_normalized, status);

create unique index if not exists entitlements_purchase_unique_idx
  on appify_private.entitlements (product_id, purchase_provider, purchase_id)
  where purchase_provider is not null and purchase_id is not null;

alter table appify_private.products enable row level security;
alter table appify_private.entitlements enable row level security;

revoke all on all tables in schema appify_private from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema appify_private to service_role;

alter default privileges for role postgres in schema appify_private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema appify_private
  grant select, insert, update, delete on tables to service_role;

-- Called only by the authenticated Edge Function through the service role.
-- SECURITY INVOKER keeps the function within the caller's existing privileges.
create or replace function public.appify_has_active_entitlement(
  p_product_id uuid,
  p_email_normalized text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from appify_private.products p
    join appify_private.entitlements e on e.product_id = p.product_id
    where p.product_id = p_product_id
      and p.access_state = 'active'
      and e.status = 'active'
      and e.buyer_email_normalized = lower(btrim(p_email_normalized))
  );
$$;

revoke all on function public.appify_has_active_entitlement(uuid, text)
  from public, anon, authenticated;
grant execute on function public.appify_has_active_entitlement(uuid, text)
  to service_role;

insert into appify_private.products (product_id, slug, display_name, access_state)
values (
  '2ae26932-ade3-4a2d-9f36-f55d00c057fc',
  'the-last-restart',
  'The Last Restart',
  'draft'
)
on conflict (product_id) do nothing;

commit;
