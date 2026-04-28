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

export type KakaoMap = {
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number): void;
  getCenter(): KakaoLatLng;
  getLevel(): number;
  relayout(): void;
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

export type KakaoMapsNamespace = {
  load(callback: () => void): void;
  Map: KakaoMapConstructor;
  LatLng: KakaoLatLngConstructor;
  Marker: KakaoMarkerConstructor;
};

export type KakaoNamespace = {
  maps: KakaoMapsNamespace;
};
