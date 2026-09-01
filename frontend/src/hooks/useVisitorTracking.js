import { useEffect } from 'react';
import { apiPost } from '../services/apiService';

const KEY = 'codemantra.visitor.id';

/** Stable per-browser id so repeat visits collapse into one visitor row. */
export function getVisitorId() {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id =
        (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
        `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `v-${Date.now()}`;
  }
}

/**
 * Records every visitor — anonymous ones included — so the admin log shows
 * who opened the site, from where, and on what device. Fires again whenever
 * the signed-in user changes so the visit gets attributed to the account.
 */
export function useVisitorTracking(user) {
  useEffect(() => {
    const payload = {
      visitor_id: getVisitorId(),
      user_id: user?.id || null,
      display_name: user?.full_name || user?.username || 'Anonymous Visitor',
      email: user?.email || null,
      path: window.location.pathname + window.location.hash,
      referrer: document.referrer || '',
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      screen: `${window.screen.width}x${window.screen.height}`,
      event_type: user ? 'AUTHENTICATED_VIEW' : 'PAGE_VIEW',
    };
    apiPost('track-visit/', payload);
  }, [user?.id]);
}

export default useVisitorTracking;
