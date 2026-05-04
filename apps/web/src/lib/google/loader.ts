import type { GoogleNamespace } from './types';

declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

let loaderPromise: Promise<GoogleNamespace> | null = null;

export function loadGoogleMaps(): Promise<GoogleNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps는 브라우저에서만 로드 가능합니다.'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (loaderPromise) return loaderPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(
      new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 환경변수가 없습니다.'),
    );
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // libraries=places: Places API (New) 호출용. v=weekly: 안정 stable.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&language=ko`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps SDK 로드는 됐지만 namespace가 비어있습니다.'));
      }
    };
    script.onerror = () =>
      reject(
        new Error('Google Maps SDK 로드 실패. API key, billing, referrer 설정을 확인하세요.'),
      );
    document.head.appendChild(script);
  });

  return loaderPromise;
}
