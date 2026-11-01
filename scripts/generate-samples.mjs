// Generates original, locally stored bottle artwork for the demo (public/samples/*.svg).
// These are illustrations, not photographs of any real product. Run: npm run generate-samples
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/samples/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const CAPS = {
  gold: ["#f3dfa6", "#c6a15b", "#7d5f26"],
  black: ["#4a4f4c", "#161a18", "#050706"],
  silver: ["#ffffff", "#c9cfcc", "#7b8280"],
  rose: ["#f6d3c2", "#c98c6e", "#7d4a37"],
};

// Body outlines in a 400x500 canvas, centred on x=200, standing on y=400.
const SHAPES = {
  rect:  { body: "M148 214 Q148 196 166 196 H234 Q252 196 252 214 V384 Q252 400 236 400 H164 Q148 400 148 384 Z", neck: [184, 170, 32, 28], cap: [168, 96, 64, 76, "cube"], top: 196 },
  tall:  { body: "M160 168 Q160 154 174 154 H226 Q240 154 240 168 V386 Q240 400 226 400 H174 Q160 400 160 386 Z", neck: [186, 134, 28, 22], cap: [176, 70, 48, 66, "cyl"], top: 154 },
  round: { body: "M200 232 C262 232 288 276 288 328 C288 376 252 400 200 400 C148 400 112 376 112 328 C112 276 138 232 200 232 Z", neck: [184, 206, 32, 28], cap: [172, 138, 56, 70, "dome"], top: 232 },
  arch:  { body: "M142 400 V250 C142 206 170 186 200 186 C230 186 258 206 258 250 V400 Q258 400 242 400 H158 Q142 400 142 400 Z", neck: [186, 160, 28, 28], cap: [170, 96, 60, 66, "dome"], top: 186 },
  flask: { body: "M176 190 H224 L232 232 C262 262 276 300 276 346 Q276 400 224 400 H176 Q124 400 124 346 C124 300 138 262 168 232 Z", neck: [184, 166, 32, 26], cap: [170, 100, 60, 68, "cube"], top: 190 },
  slab:  { body: "M130 232 Q130 214 148 214 H252 Q270 214 270 232 V382 Q270 400 252 400 H148 Q130 400 130 382 Z", neck: [180, 190, 40, 26], cap: [166, 126, 68, 66, "cyl"], top: 214 },
};

function bottle(id, s) {
  const sh = SHAPES[s.shape];
  const [c1, c2, c3] = CAPS[s.cap];
  const [nx, ny, nw, nh] = sh.neck;
  const [cx, cy, cw, ch, ck] = sh.cap;
  const dark = s.bg[2] === "dark";
  const level = sh.top + (400 - sh.top) * (1 - s.fill);
  const capShape =
    ck === "dome" ? `<path d="M${cx} ${cy + ch} V${cy + 26} Q${cx + cw / 2} ${cy - 18} ${cx + cw} ${cy + 26} V${cy + ch} Z" fill="url(#cap)"/>`
    : ck === "cyl" ? `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="6" fill="url(#cap)"/>`
    : `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="3" fill="url(#cap)"/><path d="M${cx} ${cy} L${cx + 10} ${cy - 8} H${cx + cw - 10} L${cx + cw} ${cy}" fill="${c1}" opacity=".7"/>`;
  const group = `
    <g id="b">
      <rect x="${nx}" y="${ny}" width="${nw}" height="${nh + 4}" fill="url(#cap)" opacity=".85"/>
      ${capShape}
      <rect x="${cx + 6}" y="${cy + 6}" width="5" height="${ch - 12}" rx="2.5" fill="#fff" opacity=".35"/>
      <path d="${sh.body}" fill="url(#glass)"/>
      <g clip-path="url(#in)">
        <rect x="100" y="${level}" width="200" height="${400 - level + 4}" fill="url(#liq)"/>
        <ellipse cx="200" cy="${level}" rx="90" ry="5" fill="${s.liquid[0]}" opacity=".9"/>
        <rect x="100" y="${400 - 22}" width="200" height="30" fill="#ffffff" opacity=".16"/>
      </g>
      <path d="${sh.body}" fill="url(#sheen)" />
      <path d="${sh.body}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>
      <rect x="${200 - 34}" y="${(sh.top + 400) / 2 - 30}" width="68" height="60" fill="none" stroke="${c1}" stroke-width="1.4" opacity=".9"/>
      <g transform="translate(200 ${(sh.top + 400) / 2})" fill="none" stroke="${c1}" stroke-width="1.3" opacity=".95">
        <rect x="-11" y="-11" width="22" height="22"/><rect x="-11" y="-11" width="22" height="22" transform="rotate(45)"/>
      </g>
      <rect x="${sh.cap[0] > 0 ? 156 : 156}" y="${sh.top + 8}" width="6" height="${390 - sh.top}" rx="3" fill="#fff" opacity=".38"/>
      <rect x="236" y="${sh.top + 30}" width="3" height="${330 - sh.top}" rx="1.5" fill="#fff" opacity=".2"/>
    </g>`;
  const bokeh = Array.from({ length: 14 }, (_, i) => {
    const r = 2 + ((i * 7) % 9);
    return `<circle cx="${(i * 97 + 31) % 400}" cy="${(i * 61 + 23) % 340}" r="${r}" fill="#e8d8b7" opacity="${0.05 + (i % 4) * 0.05}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="${s.alt}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${s.bg[0]}"/><stop offset="1" stop-color="${s.bg[1]}"/></radialGradient>
    <linearGradient id="cap" x1="0" x2="1"><stop offset="0" stop-color="${c3}"/><stop offset=".35" stop-color="${c1}"/><stop offset=".6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
    <linearGradient id="glass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient>
    <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.liquid[0]}"/><stop offset="1" stop-color="${s.liquid[1]}"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="fm"><rect x="0" y="400" width="400" height="100" fill="url(#fade)"/></mask>
    <radialGradient id="pool" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${s.glow}" stop-opacity=".55"/><stop offset="1" stop-color="${s.glow}" stop-opacity="0"/></radialGradient>
    <clipPath id="in"><path d="${sh.body}"/></clipPath>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="400" height="500" fill="url(#bg)"/>
  ${bokeh}
  <ellipse cx="200" cy="268" rx="170" ry="190" fill="url(#pool)"/>
  <rect y="400" width="400" height="100" fill="${dark ? "#000" : "#fff"}" opacity="${dark ? 0.35 : 0.22}"/>
  <ellipse cx="200" cy="404" rx="100" ry="10" fill="#000" opacity=".5" filter="url(#soft)"/>
  <g mask="url(#fm)"><use href="#b" transform="translate(0 800) scale(1 -1)"/></g>
  ${group}
</svg>
`;
}

// [slug, shape, cap, liquid, background [centre, edge, "dark"|"light"], glow]
const P = [
  ["lattafa-asad", "rect", "black", ["#6b3b12", "#2a1305"], ["#0e5446", "#04241f", "dark"], "#c6a15b", "Illustrated amber and black bottle"],
  ["lattafa-khamrah", "tall", "gold", ["#d79a3a", "#7a3f10"], ["#124a3e", "#06241f", "dark"], "#e8d8b7", "Illustrated golden amber bottle"],
  ["lattafa-yara", "round", "rose", ["#f2a8c0", "#b5557a"], ["#f7efe0", "#e3d2b0", "light"], "#fff", "Illustrated pink round bottle"],
  ["lattafa-najdia", "arch", "gold", ["#e6c48a", "#a8742c"], ["#0b4a3d", "#041f1a", "dark"], "#c6a15b", "Illustrated arched golden bottle"],
  ["afnan-9pm", "slab", "black", ["#3a2b73", "#150d33"], ["#173a33", "#07110f", "dark"], "#8f7ad6", "Illustrated deep violet bottle"],
  ["armaf-club-de-nuit-intense-man", "tall", "silver", ["#e9e4d4", "#9ea39a"], ["#0d3f36", "#05201b", "dark"], "#e8d8b7", "Illustrated clear silver-capped bottle"],
  ["maison-alhambra-jean-lowe-immortel", "rect", "silver", ["#3f77b8", "#0f2a55"], ["#f2ead9", "#d9c79f", "light"], "#fff", "Illustrated blue bottle"],
  ["lattafa-fakhar-black", "slab", "gold", ["#1b1f1d", "#050706"], ["#e8d8b7", "#b99a5a", "light"], "#fff", "Illustrated black and gold bottle"],
  ["afnan-supremacy-not-only-intense", "flask", "black", ["#b24a1f", "#4a1608"], ["#0b4237", "#04201a", "dark"], "#d9843a", "Illustrated copper flask bottle"],
  ["armaf-club-de-nuit-woman", "round", "gold", ["#e9b8c4", "#a45a72"], ["#f6efe2", "#dfcfab", "light"], "#fff", "Illustrated blush round bottle"],
  ["lattafa-badee-al-oud-oud-for-glory", "arch", "gold", ["#9b5a1a", "#34170a"], ["#0f4f42", "#051f1a", "dark"], "#c6a15b", "Illustrated dark oud bottle"],
  ["maison-alhambra-delilah", "flask", "rose", ["#d8738f", "#6f2140"], ["#f4ecdd", "#d6c297", "light"], "#fff", "Illustrated rose flask bottle"],
];

for (const [slug, shape, cap, liquid, bg, glow, alt] of P) {
  writeFileSync(new URL(`${slug}.svg`, OUT), bottle(slug, { shape, cap, liquid, bg, glow, alt, fill: 0.78 }));
}

// Hero campaign: three bottles on a wide emerald stage.
// Wide hero: reuse one-bottle renders as nested SVGs on a cinematic backdrop.
const nested = (slug, x, y, w) => {
  const svg = readFileSync(new URL(`${slug}.svg`, OUT), "utf8").replace(/id="(\w+)"/g, `id="$1-${slug}"`).replace(/url\(#(\w+)\)/g, `url(#$1-${slug})`).replace(/href="#b"/g, `href="#b-${slug}"`).replace(/id="b-/g, 'id="b-');
  const body = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<rect width="400" height="500" fill="url\(#bg-[\w-]+\)"\/>/, "").replace(/<rect y="400" width="400" height="100"[^>]*\/>/, "");
  return `<svg x="${x}" y="${y}" width="${w}" height="${w * 1.25}" viewBox="0 0 400 500" overflow="visible">${body}</svg>`;
};
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 700" role="img" aria-label="Illustrated perfume bottles on an emerald stage">
  <defs>
    <radialGradient id="hbg" cx="62%" cy="42%" r="70%"><stop offset="0" stop-color="#0f6b58"/><stop offset=".55" stop-color="#063b32"/><stop offset="1" stop-color="#04201b"/></radialGradient>
    <radialGradient id="beam" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#e8d8b7" stop-opacity=".45"/><stop offset="1" stop-color="#e8d8b7" stop-opacity="0"/></radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6a15b" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>
  </defs>
  <rect width="900" height="700" fill="url(#hbg)"/>
  <polygon points="470,0 620,0 760,620 330,620" fill="url(#beam)" opacity=".5"/>
  <rect y="560" width="900" height="140" fill="url(#floor)"/>
  ${nested("lattafa-khamrah", 40, 170, 330)}
  ${nested("lattafa-najdia", 540, 190, 320)}
  ${nested("afnan-9pm", 250, 60, 420)}
</svg>
`;
writeFileSync(new URL("hero-campaign.svg", OUT), heroSvg);
console.log("Generated", P.length, "bottle images and hero-campaign.svg");
