-- DEMO DATA for the Scent Ozone presentation. Run after schema.sql (Supabase SQL Editor).
-- Safe by design: it only INSERTS rows that do not already exist (matched by slug) and never
-- updates or deletes your real products, orders or photos. Every product is flagged is_sample = true,
-- so the storefront labels it "Sample". Names, prices, stock and descriptions are NOT verified
-- inventory of any business. Product images are illustrations stored in public/samples.
-- To remove all demo products later:  delete from public.products where is_sample = true;

insert into public.categories (name, slug, description, sort_order) values
  ('Arabian Perfumes', 'arabian-perfumes', 'Oud, amber and musk from the Arabian tradition.', 1),
  ('Designer Fragrances', 'designer-fragrances', 'Designer houses and designer-inspired scents.', 2),
  ('Women''s Fragrances', 'womens-fragrances', 'Floral, fruity and gourmand scents for her.', 3),
  ('Men''s Fragrances', 'mens-fragrances', 'Woody, spicy and fresh scents for him.', 4),
  ('Unisex Fragrances', 'unisex-fragrances', 'Scents made to be worn by anyone.', 5),
  ('Body Sprays', 'body-sprays', 'Light everyday mists and body sprays.', 6)
on conflict (slug) do nothing;

with demo(slug, name, brand, descr, price, cat, stock, feat, best, fresh, ord) as (values
  ('lattafa-asad', 'Asad', 'Lattafa', 'Sample description: bold, warm and spicy with a smooth amber finish. For him. Replace with real details.', 38000, 'mens-fragrances', 14, false, true, false, 1),
  ('lattafa-khamrah', 'Khamrah', 'Lattafa', 'Sample description: rich gourmand warmth with cinnamon, dates and vanilla. Unisex. Replace with real details.', 45000, 'unisex-fragrances', 9, true, true, false, 2),
  ('lattafa-yara', 'Yara', 'Lattafa', 'Sample description: soft, creamy and sweet with a powdery pink glow. For her. Replace with real details.', 36000, 'womens-fragrances', 11, true, true, false, 3),
  ('lattafa-najdia', 'Najdia', 'Lattafa', 'Sample description: golden, smooth and elegant with a lasting dry down. Unisex. Replace with real details.', 42000, 'unisex-fragrances', 0, false, false, true, 4),
  ('afnan-9pm', '9PM', 'Afnan', 'Sample description: an after-dark scent that is sweet, spicy and confident. For him. Replace with real details.', 40000, 'mens-fragrances', 7, false, false, true, 5),
  ('armaf-club-de-nuit-intense-man', 'Club de Nuit Intense Man', 'Armaf', 'Sample description: crisp citrus opening over smoky woods. Designer-inspired. For him. Replace with real details.', 55000, 'designer-fragrances', 6, false, true, false, 6),
  ('maison-alhambra-jean-lowe-immortel', 'Jean Lowe Immortel', 'Maison Alhambra', 'Sample description: fresh, clean and modern with a polished finish. Designer-inspired. For him. Replace with real details.', 48000, 'designer-fragrances', 5, true, false, false, 7),
  ('lattafa-fakhar-black', 'Fakhar Black', 'Lattafa', 'Sample description: dark, fresh and refined with an aromatic edge. For him. Replace with real details.', 39000, 'mens-fragrances', 10, false, false, true, 8),
  ('afnan-supremacy-not-only-intense', 'Supremacy Not Only Intense', 'Afnan', 'Sample description: deep, fruity and woody with strong presence. For him. Replace with real details.', 52000, 'mens-fragrances', 4, false, false, false, 9),
  ('armaf-club-de-nuit-woman', 'Club de Nuit Woman', 'Armaf', 'Sample description: warm florals and soft spice with an elegant evening feel. For her. Replace with real details.', 50000, 'womens-fragrances', 8, false, false, false, 10),
  ('lattafa-badee-al-oud-oud-for-glory', 'Bade''e Al Oud Oud for Glory', 'Lattafa', 'Sample description: a dark, resinous oud with saffron warmth. Arabian. Unisex. Replace with real details.', 41000, 'arabian-perfumes', 12, true, false, false, 11),
  ('maison-alhambra-delilah', 'Delilah', 'Maison Alhambra', 'Sample description: juicy, floral and playful with a sweet finish. For her. Replace with real details.', 47000, 'womens-fragrances', 3, false, false, true, 12)
),
ins as (
  insert into public.products (slug, name, brand, description, price, category_id, stock_quantity, is_available,
                               is_featured, is_best_seller, is_new_arrival, is_sample, created_at)
  select d.slug, d.name, d.brand, d.descr, d.price, c.id, d.stock, true, d.feat, d.best, d.fresh, true,
         now() - (d.ord || ' hours')::interval
  from demo d join public.categories c on c.slug = d.cat
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_images (product_id, url, sort_order, is_primary)
select ins.id, '/samples/' || ins.slug || '.svg', 0, true from ins;
