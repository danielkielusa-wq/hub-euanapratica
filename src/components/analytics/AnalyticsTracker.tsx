import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsTracker() {
  const location = useLocation();
  const { logEvent } = useAnalytics();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPathRef.current === path) {
      return;
    }

    lastPathRef.current = path;
    logEvent({
      event_type: 'page_view',
      metadata: {
        path,
        referrer: document.referrer || null,
        title: document.title || null
      }
    });
  }, [location.pathname, location.search, logEvent]);

  return null;
}
