import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if gtag is available (GA script loaded)
    if (typeof window.gtag !== 'undefined') {
      // Track page view on route change
      window.gtag('config', 'G-WZF967CSDX', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null; // This component doesn't render anything
};

export default GoogleAnalytics;
