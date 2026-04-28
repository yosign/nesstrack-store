-- Adds support for user-designed custom tracks attached to an order.
-- Apply via Supabase SQL editor or `supabase db push`.

alter table public.orders
  add column if not exists custom_track_design jsonb,
  add column if not exists custom_track_preview_url text;

comment on column public.orders.custom_track_design is
  'User-submitted track design (anchors, bbox, stroke, closed). Mutually exclusive with track_ids.';
comment on column public.orders.custom_track_preview_url is
  'Public URL of the rasterised PNG preview for the custom design (Storage bucket: track-previews).';

-- Storage bucket (idempotent). Public read so anyone with the order URL can render the preview.
insert into storage.buckets (id, name, public)
values ('track-previews', 'track-previews', true)
on conflict (id) do update set public = excluded.public;

-- Allow anonymous (anon role) clients to upload preview PNGs.
-- We only allow inserts; existing files cannot be overwritten anonymously.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'track-previews-anon-insert'
  ) then
    create policy "track-previews-anon-insert" on storage.objects
      for insert
      to anon, authenticated
      with check (bucket_id = 'track-previews');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'track-previews-public-read'
  ) then
    create policy "track-previews-public-read" on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'track-previews');
  end if;
end $$;
