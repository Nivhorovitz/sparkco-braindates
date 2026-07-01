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
