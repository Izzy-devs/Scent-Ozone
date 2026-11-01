import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND, DEMO_MODE } from "@/lib/brand";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "About us", description: `About ${BRAND}: Arabian perfumes, designer fragrances and more.` };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div className="container-x grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2">
      <div className="relative aspect-[4/5] overflow-hidden bg-emerald">
        <Image src="/samples/hero-campaign.svg" alt="Illustrated perfume bottles" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
      </div>
      <div>
        <h1 className="text-5xl md:text-6xl">About {s.business_name}</h1>
        <div className="mt-8 space-y-5 text-lg text-taupe">
          {DEMO_MODE ? (
            <>
              <p>This is a demonstration storefront prepared for {s.business_name}. The story, history and values of the business will be written here with the owner.</p>
              <p>[Placeholder: business story, founding details and delivery policy to be supplied by {s.business_name}.]</p>
            </>
          ) : (
            <p>{s.business_name} offers Arabian perfumes, designer fragrances, body sprays and related products. Browse the collection, check what is in stock, and order in naira.</p>
          )}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/shop" className="btn btn-dark">Shop the collection</Link>
          <Link href="/contact" className="btn btn-line">Contact us</Link>
        </div>
      </div>
    </div>
  );
}
