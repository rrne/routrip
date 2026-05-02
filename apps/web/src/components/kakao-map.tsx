'use client';

import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@routrip/shared';
import { loadKakaoMaps } from '@/lib/kakao/loader';
import type { KakaoMap, KakaoMarker } from '@/lib/kakao/types';
import { useCart } from '@/lib/store/cart';

type Props = {
  center?: LatLng;
  level?: number;
  className?: string;
};

const SEOUL: LatLng = { lat: 37.5665, lng: 126.978 };

export function KakaoMapView({ center = SEOUL, level = 4, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<Map<string, KakaoMarker>>(new Map());
  const prevCountRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useCart((s) => s.items);

  useEffect(() => {
    let cancelled = false;

    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });
        setMapReady(true);
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

  // cart 동기화 — 추가/제거된 spot에 따라 마커 add/remove + 추가 시에만 bounds 자동 맞춤
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const kakao = window.kakao;
    if (!map || !kakao) return;

    const markers = markersRef.current;
    const currentIds = new Set(items.map((i) => i.id));

    // 1) cart에서 빠진 마커 제거
    for (const [id, marker] of markers) {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markers.delete(id);
      }
    }

    // 2) 새로 담긴 spot에 마커 추가
    for (const item of items) {
      if (!markers.has(item.id)) {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(item.location.lat, item.location.lng),
          map,
          title: item.name,
        });
        markers.set(item.id, marker);
      }
    }

    // 3) 항목이 늘어났을 때만 자동으로 bounds 맞춤 (제거/유저 panning은 건드리지 않음)
    if (items.length > prevCountRef.current && items.length >= 1) {
      const bounds = new kakao.maps.LatLngBounds();
      for (const item of items) {
        bounds.extend(new kakao.maps.LatLng(item.location.lat, item.location.lng));
      }
      // padding으로 마커가 가장자리에 붙지 않도록
      map.setBounds(bounds, 60, 40, 80, 40);
    }
    prevCountRef.current = items.length;
  }, [items, mapReady]);

  // 언마운트 시 마커 정리
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      for (const marker of markers.values()) marker.setMap(null);
      markers.clear();
    };
  }, []);

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
