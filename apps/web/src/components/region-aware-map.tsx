'use client';

import { useEffect, useState } from 'react';
import { GoogleMapView } from '@/components/google-map';
import { KakaoMapView } from '@/components/kakao-map';
import { useCart } from '@/lib/store/cart';

type Props = {
  className?: string;
};

// home 페이지용 — cart의 region에 따라 카카오/구글 지도 swap.
export function RegionAwareMap({ className }: Props) {
  const region = useCart((s) => s.region);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const display = hydrated ? region : 'domestic';

  if (display === 'overseas') {
    return <GoogleMapView className={className} />;
  }
  return <KakaoMapView className={className} />;
}
