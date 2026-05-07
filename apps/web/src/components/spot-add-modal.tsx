'use client';

import { useEffect, useState } from 'react';
import type { LatLng } from '@routrip/shared';
import { useCart } from '@/lib/store/cart';

type Props = {
  location: LatLng | null;
  onClose: () => void;
};

export function SpotAddModal({ location, onClose }: Props) {
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const add = useCart((s) => s.add);
  const region = useCart((s) => s.region);

  useEffect(() => {
    if (location) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [location]);

  useEffect(() => {
    if (!location) return;

    setLoading(true);
    const geocode = async () => {
      try {
        if (region === 'domestic') {
          // 카카오 역지오코딩
          await loadKakaoAndGeocode();
        } else {
          // 구글 역지오코딩
          await loadGoogleAndGeocode();
        }
      } catch (error) {
        console.error('역지오코딩 실패:', error);
        setPlaceName('새로운 위치');
        setAddress(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      } finally {
        setLoading(false);
      }
    };

    geocode();
  }, [location, region]);

  const loadKakaoAndGeocode = async () => {
    const kakao = await import('@/lib/kakao/loader').then((m) =>
      m.loadKakaoMaps(),
    );
    if (!kakao || !location) return;

    return new Promise<void>((resolve) => {
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(location.lng, location.lat, (result: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          const addr = result[0];
          setAddress(addr.address.address_name);
          setPlaceName(addr.address.region_1depth_name);
        }
        resolve();
      });
    });
  };

  const loadGoogleAndGeocode = async () => {
    if (!location || !window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location });
      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        setAddress(result.formatted_address);
        setPlaceName(result.address_components[0]?.long_name || '새로운 위치');
      }
    } catch (error) {
      console.error('Google Geocoding 실패:', error);
      setPlaceName('새로운 위치');
      setAddress(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
    }
  };

  const handleAdd = () => {
    if (!location) return;

    add({
      id: `spot-${Date.now()}`,
      name: placeName || '새로운 위치',
      address: address || '',
      location,
      category: 'user-added',
    });

    onClose();
  };

  if (!location) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 p-0 sm:items-center">
      <div className="w-full rounded-t-2xl bg-white p-6 shadow-lg dark:bg-zinc-900 max-h-[90vh] overflow-y-auto rounded-b-none sm:max-w-md sm:rounded-xl sm:rounded-b-none">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          이 장소를 담으시겠어요?
        </h2>

        <div className="mb-6 space-y-3">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">장소명</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {placeName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">주소</p>
                <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{address}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">좌표</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="flex-1 cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            담기
          </button>
        </div>
      </div>
    </div>
  );
}
