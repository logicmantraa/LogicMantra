import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import styles from './GoogleAd.module.css';

// Normalize publisher ID - Google AdSense requires ca-pub- prefix
const normalizePublisherId = (id) => {
  if (!id) return '';
  // If it starts with pub- but not ca-pub-, add ca- prefix
  if (id.startsWith('pub-') && !id.startsWith('ca-pub-')) {
    return 'ca-' + id;
  }
  // If it already has ca-pub- or is empty, return as is
  return id;
};

const GOOGLE_ADSENSE_PUBLISHER_ID_RAW = import.meta.env.VITE_GOOGLE_ADSENSE_PUBLISHER_ID || '';
const GOOGLE_ADSENSE_PUBLISHER_ID = normalizePublisherId(GOOGLE_ADSENSE_PUBLISHER_ID_RAW);

export default function GoogleAd({ 
  slot = 'default',
  format = 'auto',
  style = 'display:block',
  layout = '',
  layoutKey = '',
  responsive = true,
  className = ''
}) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const adInitialized = useRef(false);
  const adElementRef = useRef(null);

  useEffect(() => {
    const checkSubscription = async () => {
      // If no publisher ID, don't show ads
      if (!GOOGLE_ADSENSE_PUBLISHER_ID) {
        console.warn('Google AdSense: No Publisher ID configured. Add VITE_GOOGLE_ADSENSE_PUBLISHER_ID to client/.env');
        setLoading(false);
        setShouldShowAd(false);
        return;
      }

      console.log('Google AdSense: Publisher ID found:', GOOGLE_ADSENSE_PUBLISHER_ID);

      // If user is not logged in, show ads
      if (!user) {
        console.log('Google AdSense: User not logged in, showing ads');
        setLoading(false);
        setShouldShowAd(true);
        return;
      }

      // Check if user is subscribed
      try {
        const data = await userAPI.checkSubscription();
        setIsSubscribed(data.isSubscribed);
        setShouldShowAd(!data.isSubscribed);
        console.log('Google AdSense: Subscription check - isSubscribed:', data.isSubscribed, 'willShowAd:', !data.isSubscribed);
      } catch (err) {
        console.error('Google AdSense: Failed to check subscription:', err);
        // On error, show ads (safer default)
        setShouldShowAd(true);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Load Google AdSense script
  useEffect(() => {
    if (!GOOGLE_ADSENSE_PUBLISHER_ID) {
      console.warn('Google AdSense: Cannot load script - no Publisher ID');
      return;
    }

    // Load Google AdSense script if not already loaded
    const existingScript = document.querySelector('script[src*="adsbygoogle"]');
    if (!existingScript) {
      console.log('Google AdSense: Loading script with Publisher ID:', GOOGLE_ADSENSE_PUBLISHER_ID);
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + GOOGLE_ADSENSE_PUBLISHER_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('Google AdSense: Script loaded successfully');
        // Initialize adsbygoogle array after script loads
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }
      };
      script.onerror = () => {
        console.error('Google AdSense: Failed to load script');
      };
      document.head.appendChild(script);
    } else {
      console.log('Google AdSense: Script already loaded');
      // Script already exists, ensure adsbygoogle array exists
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
    }
  }, [GOOGLE_ADSENSE_PUBLISHER_ID]);

  // Initialize ad when component mounts and ad should be shown
  useEffect(() => {
    if (!shouldShowAd || !GOOGLE_ADSENSE_PUBLISHER_ID || loading || adInitialized.current) return;

    let retryCount = 0;
    const maxRetries = 50; // 10 seconds max (50 * 200ms)

    const initAd = () => {
      try {
        // Check if ad element exists in DOM
        if (adElementRef.current) {
          const adElement = adElementRef.current.querySelector('.adsbygoogle');
          if (adElement && window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
            // Check if already initialized
            if (adElement.dataset.adsbygoogleStatus === 'done') {
              adInitialized.current = true;
              return true;
            }
            
            console.log('Google AdSense: Initializing ad with format:', format, 'slot:', slot);
            
            // Push empty object to trigger ad initialization for this specific element
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            adInitialized.current = true;
            console.log('Google AdSense: Ad initialization triggered');
            return true;
          }
        }
      } catch (err) {
        console.error('Google AdSense: Error initializing ad:', err);
      }
      return false;
    };

    // Wait for script to load and DOM to be ready
    const checkAndInit = () => {
      retryCount++;
      
      if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function' && adElementRef.current) {
        // Try to initialize
        setTimeout(() => {
          if (initAd()) {
            // Successfully initialized
            return;
          } else if (retryCount < maxRetries) {
            // Retry if initialization failed
            setTimeout(checkAndInit, 200);
          }
        }, 300);
      } else if (retryCount < maxRetries) {
        // Script not ready yet, retry
        setTimeout(checkAndInit, 200);
      } else {
        console.warn('Google AdSense: Failed to initialize ad after max retries');
      }
    };

    // Start checking after a short delay to allow layout to settle
    const timer = setTimeout(checkAndInit, 1000);

    return () => clearTimeout(timer);
  }, [shouldShowAd, loading, GOOGLE_ADSENSE_PUBLISHER_ID, format, slot]);

  // Don't render if loading, subscribed, or no publisher ID
  if (loading || !shouldShowAd || !GOOGLE_ADSENSE_PUBLISHER_ID) {
    return null;
  }

  const adStyle = style || 'display:block';
  const styleObj = {};
  if (adStyle.includes(':')) {
    const [key, value] = adStyle.split(':').map(s => s.trim());
    styleObj[key] = value;
  } else {
    styleObj.display = 'block';
  }

  // For auto ads (when no ad units created), use responsive format
  // For manual ad units, use the provided slot
  const adProps = {
    className: 'adsbygoogle',
    style: {
      ...styleObj,
      display: 'block',
      minWidth: '200px',
      minHeight: '100px'
    },
    'data-ad-client': GOOGLE_ADSENSE_PUBLISHER_ID,
    'data-ad-format': format === 'auto' ? 'auto' : format,
    'data-full-width-responsive': responsive ? 'true' : 'false',
  };

  // Only add slot if provided and not 'default' (for manual ad units)
  // If no ad units were created (slot is 'default'), use auto ads (no slot attribute)
  if (slot && slot !== 'default') {
    adProps['data-ad-slot'] = slot;
    console.log('Google AdSense: Using manual ad unit with slot:', slot);
  } else {
    // For auto ads, don't include data-ad-slot attribute
    // Remove data-ad-format if it was set to something other than auto
    adProps['data-ad-format'] = 'auto';
    console.log('Google AdSense: Using auto ads (no slot specified)');
  }

  if (layout) {
    adProps['data-ad-layout'] = layout;
  }

  if (layoutKey) {
    adProps['data-ad-layout-key'] = layoutKey;
  }

  return (
    <div ref={adElementRef} className={`${styles.adContainer} ${className}`}>
      <ins {...adProps} />
    </div>
  );
}

