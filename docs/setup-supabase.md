# Supabase Setup

Follow these steps to connect the app to Supabase and Google Sign-In.

## 1. Create the Supabase project

- Create a new project in Supabase.
- Copy the project URL.
- Copy the anon public key.

## 2. Configure local environment

Create `.env.local` from `.env.example` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OWNER_EMAIL=your-google-email
```

## 3. Run the database schema

Open the Supabase SQL editor and run:

- [`supabase/migrations/20260319173000_initial_schema.sql`](/Users/gadots/Documents/Codex/portfolio-manager/supabase/migrations/20260319173000_initial_schema.sql)

## 4. Enable Google authentication

In Supabase:

- Go to `Authentication > Providers`
- Enable `Google`
- Paste your Google OAuth client ID
- Paste your Google OAuth client secret

## 5. Configure Google OAuth

In Google Cloud Console:

- Create an OAuth client
- Add your Supabase callback URL
- Add your local callback URL if needed for local testing

Use the callback URLs shown by Supabase in the Google provider screen.

## 6. Restrict access to the owner account

The app is designed for a single user. Use the same Google account as `OWNER_EMAIL`.

## 7. Next implementation step

After these values are present, the mock portfolio dashboard can be switched to live Supabase persistence and Google session handling.
