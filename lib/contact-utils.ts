/**
 * Canonical contact normalization utilities for CozyCraft.
 * Ensures consistent handling of phone numbers and email addresses
 * across checkout, order tracking, admin details, invoices, and emails.
 */

/**
 * Normalizes an Indian phone number to canonical 10-digit format.
 * Handles:
 * - "+91 7376907289" -> "7376907289"
 * - "+91-73769-07289" -> "7376907289"
 * - "07376907289" -> "7376907289"
 * - "917376907289" -> "7376907289"
 * - " 73769 07289 " -> "7376907289"
 * 
 * Returns canonical 10-digit string if valid Indian mobile (starts with 6, 7, 8, or 9),
 * or null if invalid.
 */
export function normalizeIndianPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");

  // 12 digits starting with 91 (e.g. +91 7376907289)
  if (digits.length === 12 && digits.startsWith("91")) {
    const candidate = digits.slice(2);
    return isValidIndianMobile(candidate) ? candidate : null;
  }

  // 11 digits starting with 0 (e.g. 07376907289)
  if (digits.length === 11 && digits.startsWith("0")) {
    const candidate = digits.slice(1);
    return isValidIndianMobile(candidate) ? candidate : null;
  }

  // 10 digits
  if (digits.length === 10) {
    return isValidIndianMobile(digits) ? digits : null;
  }

  return null;
}

/**
 * Checks if a 10-digit number is a valid Indian mobile number.
 * Indian mobile numbers start with 6, 7, 8, or 9.
 */
export function isValidIndianMobile(tenDigits: string): boolean {
  return /^[6-9]\d{9}$/.test(tenDigits);
}

/**
 * Normalizes an email address.
 * Trims whitespace and converts to lowercase.
 */
export function normalizeEmail(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  // Basic sanity check: contains @ and at least one dot after @
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Normalizes any contact string (which may be either email or phone number)
 * used for lookups like order tracking.
 */
export function normalizeContactLookup(raw?: string | null): {
  type: "email" | "phone" | "unknown";
  value: string;
} {
  if (!raw) return { type: "unknown", value: "" };
  const trimmed = raw.trim();

  if (trimmed.includes("@")) {
    const email = normalizeEmail(trimmed);
    return {
      type: email ? "email" : "unknown",
      value: email ?? trimmed.toLowerCase(),
    };
  }

  const phone = normalizeIndianPhone(trimmed);
  if (phone) {
    return { type: "phone", value: phone };
  }

  // Fallback to stripped digits if 10+ digits
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10) {
    return { type: "phone", value: digits.slice(-10) };
  }

  return { type: "unknown", value: trimmed };
}
