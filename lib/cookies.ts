/**
 * Cookie helper utilities for managing authentication tokens
 */

interface CookieOptions {
  expires?: number; // days
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof window === 'undefined') return;

  const {
    expires = 7, // default 7 days
    path = '/',
    domain,
    secure = true,
    sameSite = 'Lax',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  // Add expiration
  if (expires) {
    const date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // Add path
  cookieString += `; path=${path}`;

  // Add domain if specified
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  // Add secure flag (HTTPS only)
  if (secure) {
    cookieString += '; secure';
  }

  // Add SameSite
  cookieString += `; SameSite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * Get a cookie value
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  if (typeof window === 'undefined') return;

  const { path = '/', domain } = options;

  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}
