// @ts-nocheck - google maps types
'use client';

declare global {
  interface Window {
    __addSpot?: () => void;
    __closeSpotInfo?: () => void;
  }
}

import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@routrip/shared';
import { loadGoogleMaps } from '@/lib/google/loader';
import type { GoogleMap, GoogleMarker } from '@/lib/google/types';
import { createMarkerSvg, svgToDataUrl } from '@/lib/marker-utils';
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
  const infoWindowRef = useRef<any>(null);
  const tempMarkerRef = useRef<GoogleMarker | null>(null);
  const prevCountRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((google: any) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          disableDefaultUI: false,
        });

        // 지도 클릭 이벤트 - 임시 마커 생성
        (mapRef.current as any).addListener('click', async (e: any) => {
          const location = { lat: e.latLng.lat(), lng: e.latLng.lng() };

          // 기존 임시 마커 제거
          if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null);
          }

          const marker = new google.maps.Marker({
            position: location,
            map: mapRef.current,
            icon: svgToDataUrl(createMarkerSvg('selected')),
            title: '새로운 위치',
          });

          tempMarkerRef.current = marker;

          // 주소 가져오기
          const geocoder = new google.maps.Geocoder();
          try {
            const response = await geocoder.geocode({ location });
            if (response.results && response.results.length > 0) {
              const result = response.results[0];
              const comps = result.address_components || [];
              const findComp = (...types: string[]) =>
                comps.find((c: any) => types.some((t) => c.types.includes(t)))?.long_name;

              const placeName =
                findComp('point_of_interest', 'establishment', 'premise') ||
                findComp('sublocality_level_2', 'sublocality_level_1', 'sublocality') ||
                findComp('locality') ||
                findComp('administrative_area_level_1') ||
                '선택한 위치';
              const address = result.formatted_address;

              // 기존 인포윈도우 제거
              if (infoWindowRef.current) {
                infoWindowRef.current.close();
              }

              // HTML 문자열로 콘텐츠 생성 (absolute 닫기 버튼)
              const escapedPlace = placeName.replace(/"/g, '&quot;');
              const escapedAddr = address.replace(/"/g, '&quot;');
              const content = `<div style="position:relative;padding:4px 4px 4px 4px;min-width:160px;max-width:240px;">
                <button onclick="window.__closeSpotInfo && window.__closeSpotInfo()" aria-label="닫기" style="position:absolute;top:2px;right:2px;width:20px;height:20px;background:transparent;color:#999;border:none;outline:none;border-radius:4px;cursor:pointer;font-size:16px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;font-weight:300;transition:background 0.15s;-webkit-tap-highlight-color:transparent;" onmouseover="this.style.background='#f3f4f6';this.style.color='#1a1a1a'" onmouseout="this.style.background='transparent';this.style.color='#999'" onfocus="this.style.outline='none';this.style.boxShadow='none'">×</button>
                <div style="font-weight:600;color:#1a1a1a;margin-bottom:4px;font-size:14px;line-height:1.3;padding-right:22px;">${escapedPlace}</div>
                <div style="color:#666;font-size:11px;margin-bottom:10px;line-height:1.4;word-break:keep-all;">${escapedAddr}</div>
                <button onclick="window.__addSpot && window.__addSpot()" style="width:100%;padding:6px 8px;background:#1a1a1a;color:white;border:none;outline:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;-webkit-tap-highlight-color:transparent;" onfocus="this.style.outline='none';this.style.boxShadow='none'">담기</button>
              </div>`;

              // 새 인포윈도우 (헤더 비활성화로 빈 여백 제거)
              const infoWindow = new google.maps.InfoWindow({
                content,
                headerDisabled: true,
                pixelOffset: new google.maps.Size(0, -4),
              });
              infoWindow.open({ map: mapRef.current, anchor: marker });
              infoWindowRef.current = infoWindow;

              // 닫기 핸들러 설정 (마커도 함께 제거)
              window.__closeSpotInfo = () => {
                if (tempMarkerRef.current) {
                  tempMarkerRef.current.setMap(null);
                  tempMarkerRef.current = null;
                }
                infoWindow.close();
                delete window.__addSpot;
                delete window.__closeSpotInfo;
              };

              // 버튼 클릭 핸들러 설정
              window.__addSpot = () => {
                add({
                  id: `spot-${Date.now()}`,
                  name: placeName,
                  address,
                  location,
                  category: 'user-added',
                });
                if (tempMarkerRef.current) {
                  tempMarkerRef.current.setMap(null);
                  tempMarkerRef.current = null;
                }
                infoWindow.close();
                delete window.__addSpot;
                delete window.__closeSpotInfo;
              };
            }
          } catch (error) {
            console.error('Geocoding 실패:', error);
          }
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
          icon: svgToDataUrl(createMarkerSvg('selected')),
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
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null);
      }
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
