const APP_HOSTNAMES = ['hub.euanapratica.com'];

/**
 * Extracts an internal path from a URL if it belongs to this app.
 * Handles relative paths ("/servicos/..."), same-origin URLs, and known production domain URLs.
 * Returns the pathname or null if the URL is external.
 */
export function getInternalPath(url: string): string | null {
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    if (
      parsed.origin === window.location.origin ||
      APP_HOSTNAMES.includes(parsed.hostname)
    ) {
      return parsed.pathname;
    }
  } catch {}
  return null;
}
