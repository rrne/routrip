// Kakao Maps SDK 최소 타입 정의 — 우리가 실제로 사용하는 부분만.
// 전체 SDK는 https://apis.map.kakao.com/web/documentation/ 참고.

export type KakaoLatLng = {
  getLat(): number;
  getLng(): number;
};

export type KakaoLatLngConstructor = new (lat: number, lng: number) => KakaoLatLng;

export type KakaoMapOptions = {
  center: KakaoLatLng;
  level: number;
};

export type KakaoLatLngBounds = {
  extend(latlng: KakaoLatLng): void;
  isEmpty(): boolean;
  getSouthWest(): KakaoLatLng;
  getNorthEast(): KakaoLatLng;
};

export type KakaoLatLngBoundsConstructor = new () => KakaoLatLngBounds;

export type KakaoMap = {
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number): void;
  getCenter(): KakaoLatLng;
  getLevel(): number;
  relayout(): void;
  setBounds(bounds: KakaoLatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
};

export type KakaoMapConstructor = new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;

export type KakaoMarkerOptions = {
  position: KakaoLatLng;
  map?: KakaoMap;
  title?: string;
};

export type KakaoMarker = {
  setMap(map: KakaoMap | null): void;
  setPosition(latlng: KakaoLatLng): void;
};

export type KakaoMarkerConstructor = new (options: KakaoMarkerOptions) => KakaoMarker;

// services 라이브러리 — keywordSearch (장소 검색)
export type KakaoPlacesDoc = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  x: string;
  y: string;
};

export type KakaoPlacesPagination = {
  current: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  last: number;
  totalCount: number;
};

export type KakaoServiceStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

export type KakaoPlaces = {
  keywordSearch(
    keyword: string,
    callback: (
      data: KakaoPlacesDoc[],
      status: KakaoServiceStatus,
      pagination: KakaoPlacesPagination,
    ) => void,
    options?: { size?: number; page?: number },
  ): void;
};

export type KakaoPlacesConstructor = new () => KakaoPlaces;

export type KakaoServicesNamespace = {
  Places: KakaoPlacesConstructor;
  Status: { OK: 'OK'; ZERO_RESULT: 'ZERO_RESULT'; ERROR: 'ERROR' };
};

export type KakaoMapsNamespace = {
  load(callback: () => void): void;
  Map: KakaoMapConstructor;
  LatLng: KakaoLatLngConstructor;
  LatLngBounds: KakaoLatLngBoundsConstructor;
  Marker: KakaoMarkerConstructor;
  services: KakaoServicesNamespace;
};

export type KakaoNamespace = {
  maps: KakaoMapsNamespace;
};
