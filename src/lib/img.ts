/** Resize Unsplash-hosted images to the rendered size; other URLs pass through untouched. */
export function sized(url: string | undefined, w: number, q = 80) {
  if (!url || !url.includes("images.unsplash.com")) return url || "";
  const u = url.replace(/([?&])w=\d+/, `$1w=${w}`).replace(/([?&])q=\d+/, `$1q=${q}`);
  return /[?&]w=/.test(u) ? u : `${u}${u.includes("?") ? "&" : "?"}w=${w}&q=${q}`;
}
