declare global {
  interface Window {
    fbq: any;
  }
}

const PIXEL_ID = '1576636480447640';

export const initMetaPixel = () => {
  if (typeof window === 'undefined') return;

  if (window.fbq) return;

  const fbq: any = function() {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments);
    } else {
      fbq.queue.push(arguments);
    }
  };

  if (!window.fbq) window.fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" />`;
  document.body.appendChild(noscript);

  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', eventName, params);
};

export const trackViewContent = (productName: string, price: number) => {
  trackEvent('ViewContent', {
    content_name: productName,
    content_type: 'product',
    value: price,
    currency: 'BRL',
  });
};

export const trackAddToCart = (productName: string, price: number, quantity: number = 1) => {
  trackEvent('AddToCart', {
    content_name: productName,
    content_type: 'product',
    value: price * quantity,
    currency: 'BRL',
  });
};

export const trackInitiateCheckout = (productName: string, price: number) => {
  trackEvent('InitiateCheckout', {
    content_name: productName,
    content_type: 'product',
    value: price,
    currency: 'BRL',
  });
};

export const trackPurchase = (value: number, orderId: string) => {
  trackEvent('Purchase', {
    value: value,
    currency: 'BRL',
    content_type: 'product',
    content_ids: [orderId],
  });
};

export const trackSearch = (searchQuery: string) => {
  trackEvent('Search', {
    search_string: searchQuery,
  });
};

export const trackLead = () => {
  trackEvent('Lead');
};
