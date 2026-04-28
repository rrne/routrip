'use client';

import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@routrip/shared';
import { loadKakaoMaps } from '@/lib/kakao/loader';
import type { KakaoMap } from '@/lib/kakao/types';

type Props = {
  center?: LatLng;
  level?: number;
  className?: string;
};

const SEOUL: LatLng = { lat: 37.5665, lng: 126.978 };

export function KakaoMapView({ center = SEOUL, level = 4, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '지도 로드 중 오류가 발생했습니다.');
      });

    return () => {
      cancelled = true;
    };
    // 최초 1회만 초기화. center/level 변경은 별도 effect에서 처리.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao) return;
    map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(level);
  }, [level]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 px-6 py-8 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 ${className ?? ''}`}
      >
        <div className="space-y-2">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">지도를 불러올 수 없습니다</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
