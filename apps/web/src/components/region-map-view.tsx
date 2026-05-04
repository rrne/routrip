'use client';

import type { LatLng, Region } from '@routrip/shared';
import { GoogleMapView } from '@/components/google-map';
import { KakaoMapView } from '@/components/kakao-map';

type Props = {
  region: Region;
  center?: LatLng;
  className?: string;
};

// region에 따라 카카오/구글 지도 swap. 두 컴포넌트 모두 cart store를 통해 마커 동기화.
export function RegionMapView({ region, center, className }: Props) {
  if (region === 'overseas') {
    return <GoogleMapView center={center} className={className} />;
  }
  return <KakaoMapView center={center} className={className} />;
}
