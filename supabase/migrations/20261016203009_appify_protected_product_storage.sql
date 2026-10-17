-- Private store for one published content archive per Appify product.
-- Buyers receive only short-lived signed URLs from the entitled Edge Function.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'appify-protected-products',
  'appify-protected-products',
  false,
  52428800,
  array['application/zip']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
