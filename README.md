# Sparkco Braindates v4 Supabase

Connected to Supabase.

Works:
- Save profile to Supabase `profiles`
- Load profiles from Supabase
- Save connections to `saved_connections`
- Save private notes/status on saved connections
- Save invites to `invites`

Important: current Supabase RLS policies are permissive for MVP testing.
Before collecting real phone/email data, add login and stricter RLS.


## v4.1 fix
- Fixes localStorage QuotaExceededError from large profile images.
- Compresses uploaded images.
- Keeps localStorage minimal; shared data still saves to Supabase.


## v4.2 Storage

New:
- Profile photos upload to Supabase Storage bucket `profile-photos`
- Profile saves the public image URL in `profiles.photo_url`
- Added another save button at the bottom of the profile form

Before using image upload, run `supabase_storage_setup.sql` in Supabase SQL Editor.


## v4.2.1 copy fix
- Updated profile photo helper text now that photos save to Supabase Storage.
