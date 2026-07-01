-- Sparkco Braindates profile photo storage
-- Run this once in Supabase SQL Editor before using image upload.

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

-- MVP policies for public client.
-- These are permissive for testing. Tighten after adding login.

drop policy if exists "mvp_profile_photos_select" on storage.objects;
create policy "mvp_profile_photos_select"
on storage.objects for select
using (bucket_id = 'profile-photos');

drop policy if exists "mvp_profile_photos_insert" on storage.objects;
create policy "mvp_profile_photos_insert"
on storage.objects for insert
with check (bucket_id = 'profile-photos');

drop policy if exists "mvp_profile_photos_update" on storage.objects;
create policy "mvp_profile_photos_update"
on storage.objects for update
using (bucket_id = 'profile-photos')
with check (bucket_id = 'profile-photos');

drop policy if exists "mvp_profile_photos_delete" on storage.objects;
create policy "mvp_profile_photos_delete"
on storage.objects for delete
using (bucket_id = 'profile-photos');
