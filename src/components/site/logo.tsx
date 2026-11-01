import Image from "next/image";
import Link from "next/link";

export function Logo({ name, logoUrl, tone = "dark" }: { name: string; logoUrl: string | null; tone?: "dark" | "light" }) {
  const color = tone === "light" ? "text-ivory" : "text-ink";
  const [first, ...rest] = name.split(" ");
  return (
    <Link href="/" className={`flex items-center gap-3 ${color}`} aria-label={`${name} home`}>
      {logoUrl ? (
        <Image src={logoUrl} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
      ) : (
        <svg width="34" height="34" viewBox="0 0 40 40" fill="none" stroke="#c6a15b" strokeWidth="1.5" aria-hidden="true">
          <rect x="9" y="9" width="22" height="22" /><rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" /><circle cx="20" cy="20" r="3" fill="#c6a15b" stroke="none" />
        </svg>
      )}
      <span className="font-display text-[1.7rem] font-semibold leading-none tracking-[0.04em]">
        {first}{rest.length > 0 && <span className="ml-1.5 font-normal italic text-gold">{rest.join(" ")}</span>}
      </span>
    </Link>
  );
}
