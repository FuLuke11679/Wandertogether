# Supabase (WanderSync)

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Copy **Project URL** and **anon public** key into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## 2. Apply the schema

- **SQL Editor**: paste the contents of `migrations/20250324120000_initial_schema.sql` and run.
- Or use the [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase db push`.

If you already have an `on_auth_user_created` trigger on `auth.users`, drop it first or merge the `handle_new_user` body manually.

## 3. Authentication

1. **Authentication → Providers**: enable **Email** (and optionally disable “Confirm email” for local dev).
2. Enable **Google**: add OAuth client ID/secret from Google Cloud Console.
3. **Authentication → URL configuration**: set **Site URL** to `http://localhost:5173` (and your production URL later). Add the same URLs under **Redirect URLs**.

## 4. App behavior

With env vars set, the **Home** screen shows a sign-in card. After **email/password** or **Google** sign-in, trips load from the `trips` table; creating or deleting trips uses Supabase. **Import / add activities** (Zustand `addActivities`) also syncs the full activity list to `public.activities` when the trip id is a Supabase UUID and you are signed in (trip owner per RLS).

Other trip fields still use the Zustand store until migrated—opening a trip from Home calls `upsertTrip` so the current trip exists locally.
