// Scrolls the window back to the top on every route change. Mounted once
// near the router root (inside the RootLayout's <Outlet/> tree so it has
// access to router context). See docs/DESIGN.md section 8
// ("Pattern: Page scroll reset on navigation").

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}
