// @ts-nocheck - kakao maps types
'use client';

import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@routrip/shared';
import { loadKakaoMaps } from '@/lib/kakao/loader';
import type { KakaoMap, KakaoMarker } from '@/lib/kakao/types';
import { createMarkerSvg, svgToDataUrl } from '@/lib/marker-utils';
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
  const infoWindowRef = useRef<any>(null);
  const tempMarkerRef = useRef<KakaoMarker | null>(null);
  const prevCountRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);

  useEffect(() => {
    let cancelled = false;

    loadKakaoMaps()
      .then((kakao: any) => {
        if (cancelled || !containerRef.current) return;
        //@ts-ignore - kakao maps types
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });

        // 지도 클릭 이벤트 - 임시 마커 생성
        kakao.maps.event.addListener(mapRef.current, 'click', async (mouseEvent: any) => {
          console.log('🗺️ Kakao map clicked!', mouseEvent);
          const latlng = mouseEvent.latLng;
          const location = { lat: latlng.getLat(), lng: latlng.getLng() };
          console.log('📍 Location:', location);

          // 기존 임시 마커 제거
          if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null);
          }

          // 새 임시 마커 생성
          const markerImage = new kakao.maps.MarkerImage(
            svgToDataUrl(createMarkerSvg('selected')),
            new kakao.maps.Size(36, 44),
            { offset: new kakao.maps.Point(18, 44) },
          );

          const marker = new kakao.maps.Marker({
            position: latlng,
            map: mapRef.current,
            image: markerImage,
          });

          tempMarkerRef.current = marker;

          // REST API로 주소 가져오기
          console.log('🚀 fetch 호출 시작, 좌표:', location);
          fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lng: location.lng, lat: location.lat }),
          })
            .then((res) => {
              console.log('📨 fetch 응답:', res.status);
              return res.json();
            })
            .then((data) => {
              console.log('📦 API 응답 data:', data);
              let address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

              if (data.documents && data.documents.length > 0) {
                const doc = data.documents[0];
                if (doc.address?.address_name) {
                  address = doc.address.address_name;
                } else {
                  const region1 = doc.address?.region_1depth_name || '';
                  const region2 = doc.address?.region_2depth_name || '';
                  address = region1 + (region2 ? ' ' + region2 : '');
                }
              }

              // 기존 인포윈도우 제거
              if (infoWindowRef.current) {
                infoWindowRef.current.setMap(null);
              }

              // HTML 문자열로 콘텐츠 생성
              const escapedAddr = address.replace(/"/g, '&quot;');
              const content = `<div style="transform:translate(-50%, -89px);width:160px;margin-left:50%;">
                <div style="background:white;border-radius:6px;padding:10px 12px;box-shadow:0 2px 6px rgba(0,0,0,0.12);">
                  <div style="font-weight:500;color:#1a1a1a;margin-bottom:8px;font-size:14px;word-wrap:break-word;line-height:1.4;white-space:normal;">${escapedAddr}</div>
                  <button onclick="window.__addSpot && window.__addSpot()" style="width:100%;padding:5px 6px;background:#1a1a1a;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">담기</button>
                </div>
              </div>`;

              const infoWindow = new kakao.maps.CustomOverlay({
                position: latlng,
                content,
                zIndex: 3,
              });

              infoWindow.setMap(mapRef.current);
              infoWindowRef.current = infoWindow;

              // 버튼 클릭 핸들러 설정
              window.__addSpot = () => {
                add({
                  id: `spot-${Date.now()}`,
                  name: address,
                  address,
                  location,
                  category: 'user-added',
                });
                if (tempMarkerRef.current) {
                  tempMarkerRef.current.setMap(null);
                  tempMarkerRef.current = null;
                }
                infoWindow.setMap(null);
                delete window.__addSpot;
              };
            })
            .catch((err) => {
              console.error('지오코딩 실패:', err);
              // 에러 시에도 좌표로 팝업 표시
              const address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
              const escapedAddr = address.replace(/"/g, '&quot;');
              const content = `<div style="transform:translate(-50%, -89px);width:160px;margin-left:50%;">
                <div style="background:white;border-radius:6px;padding:10px 12px;box-shadow:0 2px 6px rgba(0,0,0,0.12);">
                  <div style="font-weight:500;color:#1a1a1a;margin-bottom:8px;font-size:14px;word-wrap:break-word;line-height:1.4;white-space:normal;">${escapedAddr}</div>
                  <button onclick="window.__addSpot && window.__addSpot()" style="width:100%;padding:5px 6px;background:#1a1a1a;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">담기</button>
                </div>
              </div>`;

              if (infoWindowRef.current) {
                infoWindowRef.current.setMap(null);
              }

              const infoWindow = new kakao.maps.CustomOverlay({
                position: latlng,
                content,
                zIndex: 3,
              });

              infoWindow.setMap(mapRef.current);
              infoWindowRef.current = infoWindow;

              window.__addSpot = () => {
                add({
                  id: `spot-${Date.now()}`,
                  name: address,
                  address,
                  location,
                  category: 'user-added',
                });
                if (tempMarkerRef.current) {
                  tempMarkerRef.current.setMap(null);
                  tempMarkerRef.current = null;
                }
                infoWindow.setMap(null);
                delete window.__addSpot;
              };
            });
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

    // 2) 새로 담긴 spot에 마커 추가 (검정 마커)
    for (const item of items) {
      if (!markers.has(item.id)) {
        //@ts-ignore - kakao maps types
        const markerImage = new kakao.maps.MarkerImage(
          svgToDataUrl(createMarkerSvg('selected')),
          new kakao.maps.Size(36, 44),
          { offset: new kakao.maps.Point(18, 44) },
        );

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(item.location.lat, item.location.lng),
          map,
          title: item.name,
          image: markerImage,
        });
        markers.set(item.id, marker);
      }
    }

    // 3) 항목이 늘어났을 때만 자동으로 bounds 맞춤
    if (items.length > prevCountRef.current && items.length >= 1) {
      const bounds = new kakao.maps.LatLngBounds();
      for (const item of items) {
        bounds.extend(new kakao.maps.LatLng(item.location.lat, item.location.lng));
      }
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
