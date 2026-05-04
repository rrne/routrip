'use client';

import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@routrip/shared';
import { loadGoogleMaps } from '@/lib/google/loader';
import type { GoogleMap, GoogleMarker } from '@/lib/google/types';
import { useCart } from '@/lib/store/cart';

type Props = {
  center?: LatLng;
  zoom?: number;
  className?: string;
};

// 해외 모드 기본 위치 — 도쿄. 첫 spot 추가 시 자동으로 옮겨감.
const TOKYO: LatLng = { lat: 35.6762, lng: 139.6503 };

export function GoogleMapView({ center = TOKYO, zoom = 13, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<Map<string, GoogleMarker>>(new Map());
  const prevCountRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useCart((s) => s.items);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          disableDefaultUI: false,
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
    // 최초 1회만 초기화. center/zoom 변경은 별도 effect에서 처리.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter({ lat: center.lat, lng: center.lng });
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(zoom);
  }, [zoom]);

  // cart 동기화
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const google = window.google;
    if (!map || !google) return;

    const markers = markersRef.current;
    const currentIds = new Set(items.map((i) => i.id));

    for (const [id, marker] of markers) {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markers.delete(id);
      }
    }

    for (const item of items) {
      if (!markers.has(item.id)) {
        const marker = new google.maps.Marker({
          position: { lat: item.location.lat, lng: item.location.lng },
          map,
          title: item.name,
        });
        markers.set(item.id, marker);
      }
    }

    if (items.length > prevCountRef.current && items.length >= 1) {
      const bounds = new google.maps.LatLngBounds();
      for (const item of items) {
        bounds.extend({ lat: item.location.lat, lng: item.location.lng });
      }
      map.fitBounds(bounds, 60);
    }
    prevCountRef.current = items.length;
  }, [items, mapReady]);

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
