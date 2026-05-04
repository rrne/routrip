// Google Maps JS SDK 최소 타입 — 우리가 실제로 사용하는 부분만.
// 전체 SDK는 https://developers.google.com/maps/documentation/javascript

export type GoogleLatLng = {
  lat(): number;
  lng(): number;
};

export type GoogleLatLngLiteral = { lat: number; lng: number };

export type GoogleLatLngConstructor = new (lat: number, lng: number) => GoogleLatLng;

export type GoogleMapOptions = {
  center: GoogleLatLngLiteral | GoogleLatLng;
  zoom: number;
  disableDefaultUI?: boolean;
  mapId?: string;
};

export type GoogleLatLngBounds = {
  extend(latlng: GoogleLatLng | GoogleLatLngLiteral): void;
  isEmpty(): boolean;
};

export type GoogleLatLngBoundsConstructor = new () => GoogleLatLngBounds;

export type GoogleMap = {
  setCenter(latlng: GoogleLatLng | GoogleLatLngLiteral): void;
  setZoom(zoom: number): void;
  fitBounds(bounds: GoogleLatLngBounds, padding?: number): void;
};

export type GoogleMapConstructor = new (
  container: HTMLElement,
  options: GoogleMapOptions,
) => GoogleMap;

export type GoogleMarkerOptions = {
  position: GoogleLatLng | GoogleLatLngLiteral;
  map?: GoogleMap;
  title?: string;
};

export type GoogleMarker = {
  setMap(map: GoogleMap | null): void;
  setPosition(latlng: GoogleLatLng | GoogleLatLngLiteral): void;
};

export type GoogleMarkerConstructor = new (options: GoogleMarkerOptions) => GoogleMarker;

// Places API (New) — Place.searchByText
export type GooglePlaceSearchResult = {
  id: string;
  displayName: string | { text: string };
  formattedAddress: string;
  location: GoogleLatLng;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
};

export type GooglePlaceSearchByTextRequest = {
  textQuery: string;
  fields: string[];
  language?: string;
  region?: string;
  maxResultCount?: number;
};

export type GooglePlaceStatic = {
  searchByText: (
    request: GooglePlaceSearchByTextRequest,
  ) => Promise<{ places: GooglePlaceSearchResult[] }>;
};

export type GoogleMapsNamespace = {
  Map: GoogleMapConstructor;
  LatLng: GoogleLatLngConstructor;
  LatLngBounds: GoogleLatLngBoundsConstructor;
  Marker: GoogleMarkerConstructor;
  importLibrary: (name: 'places') => Promise<{ Place: GooglePlaceStatic }>;
};

export type GoogleNamespace = {
  maps: GoogleMapsNamespace;
};
