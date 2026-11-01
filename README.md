# Scent Ozone demo storefront

A premium fragrance e-commerce DEMO to present to Scent Ozone Fragrance & Cosmetics.
Next.js 16, TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, Storage).
Everything about Scent Ozone here (contact details, story, delivery policy, testimonials, products, prices, stock) is a placeholder or sample. Do not deploy publicly without approval.

## What the owner can do in /admin
Add products and upload photos from a phone gallery, edit names, prices, descriptions and categories, manage stock and availability, delete products, manage orders and statuses, and edit store settings.

## Setup (own Supabase project, separate from any other site)
1. `npm install`
2. Create a NEW Supabase project for this demo.
3. SQL Editor > New query > paste all of `supabase/setup.sql` > Run. This creates the tables, security rules, photo storage and the 12 sample perfumes. Safe to re-run; it never overwrites real data.
4. `cp .env.example .env.local` and fill in the project URL, anon key and service_role key (Project Settings > API). Keep the service key private.
5. Supabase > Authentication: turn OFF "Allow new users to sign up".
6. `npm run create-admin -- demo@example.com "a-strong-password"`
7. `npm run dev` then open http://localhost:3000 and http://localhost:3000/admin/login

## Demo content
- 12 sample products (Lattafa, Afnan, Armaf, Maison Alhambra), flagged "Sample" on the store. Remove them with `delete from public.products where is_sample = true;`.
- Product images are original illustrations in `public/samples` (not photographs; regenerate with `npm run generate-samples`). Replace them by editing a product in Admin and uploading a real photo.
- `NEXT_PUBLIC_BRAND_NAME` sets the brand. `NEXT_PUBLIC_DEMO_MODE=false` removes the demo strip, demo testimonials and placeholders for a real launch.

## Payments
Without Paystack/Flutterwave keys, online payment runs in clearly labelled test mode: the order is saved as Unpaid and no payment is faked. Bank transfer and WhatsApp ordering work without keys (add bank details and the WhatsApp number in Admin > Settings).

## Deploy later (Vercel)
Add every variable from `.env.example`, set `NEXT_PUBLIC_SITE_URL` to the real domain, and add the domain in Supabase Auth > URL Configuration.
