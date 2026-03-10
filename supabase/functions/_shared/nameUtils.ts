/**
 * Name formatting utilities.
 */

/**
 * Extracts the first name and normalizes capitalization.
 * - Splits by whitespace, takes first token
 * - If all uppercase (e.g. "DANIEL"), converts to title case ("Daniel")
 * - Returns fallback if name is empty/null
 */
export function formatLeadFirstName(
  fullName: string | null | undefined,
  fallback = "Cliente"
): string {
  if (!fullName?.trim()) return fallback;

  const firstName = fullName.trim().split(/\s+/)[0];

  // Normalize if all uppercase
  if (firstName === firstName.toUpperCase() && firstName.length > 1) {
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  }

  return firstName;
}
