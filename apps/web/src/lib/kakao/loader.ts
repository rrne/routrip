type KakaoNamespace = {
  maps: {
    load: (callback: () => void) => void;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}

let loaderPromise: Promise<KakaoNamespace> | null = null;

export function loadKakaoMaps(): Promise<KakaoNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kakao Maps는 브라우저에서만 로드 가능합니다.'));
  }

  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }

  if (loaderPromise) return loaderPromise;

  const appKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  if (!appKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 환경변수가 없습니다.'));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao!.maps.load(() => resolve(window.kakao!));
    };
    script.onerror = () => reject(new Error('Kakao Maps SDK 로드 실패'));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export {};
