import Image from "next/image";
import Link from "next/link";
import { Lattice } from "@/components/site/art";
import { NewsletterForm } from "@/components/site/newsletter";
import { Ornament, Particles } from "@/components/site/particles";
import { ProductGrid } from "@/components/site/product-card";
import { socialList } from "@/components/site/social";
import { DEMO_MODE } from "@/lib/brand";
import { getCategories, getProducts, getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 60;

function Heading({ title, href, linkText = "View all", light = false }: { title: string; href?: string; linkText?: string; light?: boolean }) {
  return (
    <div className="reveal mb-10 flex items-end justify-between gap-4">
      <h2 className="text-4xl md:text-5xl">{title}</h2>
      {href && <Link href={href} className={`shrink-0 underline underline-offset-4 ${light ? "hover:text-gold" : "hover:text-gold-text"}`}>{linkText}</Link>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="border border-dashed border-line p-8 text-center text-taupe">{text}</p>;
}

const DEMO_TESTIMONIALS = [
  { name: "Demo customer", quote: "Sample testimonial: the scent lasted all day and the packaging felt premium." },
  { name: "Demo customer", quote: "Sample testimonial: ordering on my phone was quick and simple." },
  { name: "Demo customer", quote: "Sample testimonial: I found the perfect gift in minutes." },
];

export default async function HomePage() {
  const [settings, categories, best, fresh, featured] = await Promise.all([
    getSettings(), getCategories(),
    getProducts({ flag: "is_best_seller", limit: 4 }),
    getProducts({ flag: "is_new_arrival", limit: 4 }),
    getProducts({ flag: "is_featured", limit: 4 }),
  ]);
  const wa = whatsappLink(settings.whatsapp_number, "Hello, I would like help choosing a fragrance.");
  const socials = socialList(settings);
  const real = settings.testimonials.length > 0;
  const testimonials = real ? settings.testimonials : DEMO_MODE ? DEMO_TESTIMONIALS : [];

  return (
    <>
      <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden bg-emerald text-ivory">
        <Image src={settings.hero_image_url ?? "/samples/hero-campaign.svg"} alt="Perfume bottles lit on an emerald stage" fill priority sizes="100vw" className="-z-20 object-cover object-[68%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#04201b]/95 via-[#063b32]/70 to-transparent max-md:bg-gradient-to-b max-md:from-[#04201b]/90 max-md:via-[#063b32]/55 max-md:to-[#04201b]/85" aria-hidden="true" />
        <Lattice opacity={0.07} />
        <Particles />
        <div className="container-x relative py-20">
          <div className="hero-rise max-w-2xl">
            <h1 className="text-shadow-soft text-[3.1rem] font-semibold uppercase leading-[0.98] tracking-[0.02em] sm:text-7xl lg:text-[5.6rem]">Scent is your <span className="italic text-gold">signature.</span></h1>
            <p className="mt-6 max-w-md text-lg text-ivory/85">Discover exceptional fragrances that leave a lasting impression.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn btn-gold">Explore collection</Link>
              <Link href="/shop?collection=best-sellers" className="btn btn-line glass text-ivory">Shop bestsellers</Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-2 text-sm">
              {[["For him", "/category/mens-fragrances"], ["For her", "/category/womens-fragrances"], ["Unisex", "/category/unisex-fragrances"]].map(([l, h]) => (
                <li key={h}><Link href={h} className="glass inline-flex min-h-11 items-center rounded-full px-5 hover:border-gold">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="bg-ivory pt-6"><Ornament /></div>

      <section className="section pt-10">
        <div className="container-x">
          <Heading title="Featured collection" href="/shop?collection=featured" />
          {featured.length ? <ProductGrid products={featured} /> : <Empty text="Featured products appear here once they are marked as featured in the admin dashboard." />}
        </div>
      </section>

      <section id="categories" className="section relative scroll-mt-20 overflow-hidden bg-[#06241f] text-ivory">
        <Lattice opacity={0.06} />
        <div className="container-x relative">
          <Heading title="Shop by fragrance category" light />
          {categories.length === 0 ? <Empty text="Categories appear here once they are added in the admin dashboard." /> : (
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
              {categories.map((c) => (
                <li key={c.id} className="reveal">
                  <Link href={`/category/${c.slug}`} className="glass group relative flex h-full min-h-40 flex-col justify-end overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold md:min-h-56 md:p-7">
                    {c.image_url && <Image src={c.image_url} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" className="-z-10 object-cover opacity-40 transition-transform duration-500 group-hover:scale-105" />}
                    <h3 className="text-2xl md:text-3xl">{c.name}</h3>
                    {c.description && <p className="mt-1 hidden text-sm text-ivory/70 md:block">{c.description}</p>}
                    <span className="mt-3 text-sm text-gold">Explore</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <Heading title="Bestselling fragrances" href="/shop?collection=best-sellers" />
          {best.length ? <ProductGrid products={best} /> : <Empty text="Bestsellers appear here once products are marked as best sellers in the admin dashboard." />}
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-emerald py-20 text-ivory md:py-28">
        <Image src="/samples/hero-campaign.svg" alt="" fill sizes="100vw" className="-z-20 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#04201b] via-[#04201b]/85 to-transparent" aria-hidden="true" />
        <div className="container-x grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="reveal">
            <h2 className="text-4xl md:text-6xl">A fragrance is a memory you wear.</h2>
            <p className="mt-6 max-w-lg text-lg text-ivory/80">
              {DEMO_MODE ? `[Placeholder brand story for ${settings.business_name}: who they are, how they choose their fragrances, and what customers can expect.]` : `${settings.business_name} brings Arabian and designer fragrances together in one place.`}
            </p>
            <Link href="/about" className="btn btn-gold mt-8">Our story</Link>
          </div>
        </div>
      </section>

      <section className="bg-gold py-14 text-ink md:py-16">
        <div className="container-x flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl">{settings.announcement_active && settings.announcement ? settings.announcement : "Not sure which scent is yours?"}</h2>
            <p className="mt-2">Message us on WhatsApp and we will help you choose.</p>
          </div>
          {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-dark">Chat on WhatsApp</a> : <Link href="/contact" className="btn btn-dark">Contact us</Link>}
        </div>
      </section>

      <section className="section bg-cream">
        <div className="container-x">
          <Heading title="New arrivals" href="/shop?collection=new-arrivals" />
          {fresh.length ? <ProductGrid products={fresh} /> : <Empty text="New arrivals appear here once products are marked as new in the admin dashboard." />}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="section">
          <div className="container-x">
            <h2 className="reveal text-4xl md:text-5xl">What customers say</h2>
            {!real && <p className="mt-2 text-sm text-taupe">Demo testimonials: sample text, not real customers.</p>}
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <figure key={i} className="reveal border-l-2 border-gold pl-5">
                  {!real && <p className="mb-2 inline-block bg-champagne px-2 py-0.5 text-xs">Demo testimonial</p>}
                  <blockquote className="font-display text-2xl leading-snug">{t.quote}</blockquote>
                  <figcaption className="mt-3 text-sm text-taupe">{t.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section relative overflow-hidden bg-emerald text-ivory">
        <Lattice opacity={0.08} />
        <div className="container-x relative grid gap-8 md:grid-cols-2 md:items-center">
          <div><h2 className="text-4xl md:text-5xl">Join the inner circle</h2><p className="mt-3 max-w-md text-ivory/80">New arrivals and offers, sent occasionally.</p></div>
          <NewsletterForm />
        </div>
      </section>

      {socials.length > 0 && (
        <section className="section bg-ink text-ivory">
          <div className="container-x flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <h2 className="text-4xl md:text-5xl">Follow the collection</h2>
            <ul className="flex flex-wrap gap-3">
              {socials.map((s) => <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer" className="btn btn-line text-ivory">{s.label}</a></li>)}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
