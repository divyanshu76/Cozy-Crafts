/**
 * Email image reliability utility.
 * Email clients (especially Gmail and Outlook) have strict image constraints:
 * 1. They cannot load relative URLs (e.g., /products/..., /assets/...)
 * 2. Gmail completely blocks and rejects SVG images, resulting in broken image icons.
 * 3. They reject localhost, 127.0.0.1, blob:, and data: URLs.
 *
 * This helper ensures any image URL passed to an email template is a stable,
 * publicly accessible HTTPS image (PNG/JPG/WEBP), or returns null to trigger
 * a graceful fallback block.
 */

const PRODUCTION_ORIGIN = "https://www.cozycrafts.shop";

export function getPublicImageUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // 1. Gmail and most webmail clients DO NOT render SVGs.
  // Returning an SVG will produce a broken image icon.
  const lower = trimmed.toLowerCase();
  if (lower.endsWith(".svg") || lower.includes(".svg?") || lower.includes(".svg#")) {
    return null;
  }

  // 2. Reject internal/blob/data/localhost schemes
  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    lower.includes("localhost") ||
    lower.includes("127.0.0.1")
  ) {
    // If it's localhost path like http://localhost:3000/assets/... -> extract pathname
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname && !parsed.pathname.endsWith(".svg")) {
        return `${PRODUCTION_ORIGIN}${parsed.pathname}`;
      }
    } catch {
      return null;
    }
    return null;
  }

  // 3. Convert relative URLs (e.g. /assets/image.png) to absolute HTTPS URLs
  if (trimmed.startsWith("/")) {
    return `${PRODUCTION_ORIGIN}${trimmed}`;
  }

  // 4. If it's already an absolute URL
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    // Upgrade http to https
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  // 5. Bare storage path like "product-images/..." or "productId/..."
  if (trimmed.includes("/")) {
    // Assume relative to public origin
    return `${PRODUCTION_ORIGIN}/${trimmed.replace(/^\/+/, "")}`;
  }

  return null;
}
