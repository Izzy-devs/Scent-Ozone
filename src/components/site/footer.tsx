import Link from "next/link";
import { BRAND, DEMO_MODE } from "@/lib/brand";
import type { Settings } from "@/lib/types";
import { Lattice } from "./art";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter";
import { SocialLinks } from "./social";

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="relative overflow-hidden bg-[#06241f] text-ivory">
      <Lattice opacity={0.06} />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo name={settings.business_name} logoUrl={settings.logo_url} tone="light" />
          <p className="mt-4 max-w-xs text-sm text-ivory/70">Arabian perfumes and designer fragrances for every signature.</p>
          <SocialLinks settings={settings} className="mt-6" />
        </div>
        <nav aria-label="Footer">
          <h2 className="font-display text-xl">Shop</h2>
          <ul className="mt-4 space-y-2 text-sm text-ivory/80">
            <li><Link href="/shop" className="hover:text-gold">All fragrances</Link></li>
            <li><Link href="/category/mens-fragrances" className="hover:text-gold">Men</Link></li>
            <li><Link href="/category/womens-fragrances" className="hover:text-gold">Women</Link></li>
            <li><Link href="/category/unisex-fragrances" className="hover:text-gold">Unisex</Link></li>
            <li><Link href="/cart" className="hover:text-gold">Cart</Link></li>
            <li><Link href="/about" className="hover:text-gold">About us</Link></li>
            <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="font-display text-xl">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm text-ivory/80">
            {settings.phone && <li><a href={`tel:${settings.phone}`} className="hover:text-gold">{settings.phone}</a></li>}
            {settings.email && <li><a href={`mailto:${settings.email}`} className="break-all hover:text-gold">{settings.email}</a></li>}
            {settings.address && <li>{settings.address}</li>}
            {DEMO_MODE && !settings.phone && <li className="text-ivory/60">[Placeholder phone number]</li>}
            {DEMO_MODE && !settings.email && <li className="text-ivory/60">[Placeholder email address]</li>}
            {DEMO_MODE && !settings.address && <li className="text-ivory/60">[Placeholder business address]</li>}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-xl">Stay in the loop</h2>
          <p className="mt-4 text-sm text-ivory/70">New arrivals and offers, sent occasionally.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="relative border-t border-white/10 py-5 text-center text-xs text-ivory/60">
        © {new Date().getFullYear()} {settings.business_name}.{DEMO_MODE ? ` Demo website built as a sample. Not the official ${BRAND} store.` : " All rights reserved."}
      </div>
    </footer>
  );
}
