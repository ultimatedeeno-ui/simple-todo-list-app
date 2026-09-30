# Ember shop

A responsive React storefront with a bag, checkout, Supabase-backed order persistence, Google sign-in, and Mailgun order confirmations.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The catalog can be browsed without credentials. To place an order or sign in, complete the setup below.

## What I need from you

1. **Supabase project access/configuration:** Create a Supabase project (or invite a developer) and provide the Project URL and publishable/anon key for `.env.local`. Run the migration in `supabase/migrations/202609300001_shop.sql` using the Supabase SQL Editor or CLI.
2. **Google OAuth client:** In Google Cloud Console, create a **Web application** OAuth 2.0 client. In Supabase Dashboard → Authentication → Providers → Google, paste its client ID and client secret. Add `http://localhost:5173` and the production URL to Supabase Authentication → URL Configuration; add Supabase’s displayed callback URL to the Google client’s authorized redirect URIs.
3. **Mailgun credentials:** Verify a sending domain in Mailgun and set `MAILGUN_DOMAIN` and `MAILGUN_API_KEY` as Supabase Edge Function secrets. Mailgun sandbox domains can only mail authorized recipients.
4. **Payments:** This build records confirmed orders but does **not** charge cards. Provide a Stripe account/API keys if you want live card payments; the order function should then create and verify a Stripe Checkout session/webhook before setting an order to `confirmed`.
5. **Deployment details:** Provide your production site URL so it can be added to both Supabase and Google allowed redirect URLs.

## Deploy backend

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set MAILGUN_DOMAIN=mg.example.com MAILGUN_API_KEY=key-your-mailgun-key
supabase functions deploy create-order
```

## Security notes

- Product prices are re-read from the database in the Edge Function; browser-provided prices are never trusted.
- The function uses the service-role key only on the server, to insert orders and order items. Do not expose it in frontend environment variables.
- The included policies permit signed-in customers to view only their own orders. Guest orders remain available to staff through Supabase’s service role/dashboard.
