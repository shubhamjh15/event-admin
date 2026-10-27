/** Serialise structured data for a <script type="application/ld+json"> without allowing "</script>" breakouts. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
