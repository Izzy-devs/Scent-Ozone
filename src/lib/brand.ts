/** Brand shown across the storefront. Change NEXT_PUBLIC_BRAND_NAME to re-brand the whole site. */
export const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Scent Ozone";
/** Demo mode shows a "demo" strip, labelled sample testimonials and contact placeholders. Set to "false" for a real launch. */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
