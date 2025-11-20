import { Platform } from 'react-native';

const PIXEL_ID = '1576636480447640';

interface PixelEventParams {
  [key: string]: string | number | boolean;
}

class MetaPixel {
  private initialized = false;

  init() {
    if (this.initialized || Platform.OS !== 'web') {
      return;
    }

    const script = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${PIXEL_ID}');
      fbq('track', 'PageView');
    `;

    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = script;
    document.head.appendChild(scriptElement);

    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    this.initialized = true;
  }

  track(eventName: string, params?: PixelEventParams) {
    if (Platform.OS !== 'web') {
      return;
    }

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, params || {});
    }
  }

  trackCustom(eventName: string, params?: PixelEventParams) {
    if (Platform.OS !== 'web') {
      return;
    }

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', eventName, params || {});
    }
  }

  trackViewContent(params?: { content_name?: string; content_ids?: string[]; value?: number; currency?: string }) {
    this.track('ViewContent', params);
  }

  trackAddToCart(params?: { content_name?: string; content_ids?: string[]; value?: number; currency?: string }) {
    this.track('AddToCart', params);
  }

  trackInitiateCheckout(params?: { value?: number; currency?: string; num_items?: number }) {
    this.track('InitiateCheckout', params);
  }

  trackPurchase(params: { value: number; currency: string; content_ids?: string[] }) {
    this.track('Purchase', params);
  }

  trackAddPaymentInfo(params?: { value?: number; currency?: string }) {
    this.track('AddPaymentInfo', params);
  }

  trackSearch(params?: { search_string?: string }) {
    this.track('Search', params);
  }
}

export const metaPixel = new MetaPixel();
