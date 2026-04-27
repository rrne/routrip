export type LatLng = {
  lat: number;
  lng: number;
};

export type Spot = {
  id: string;
  name: string;
  address: string;
  category?: string;
  location: LatLng;
  kakaoPlaceId?: string;
};

export type CartItem = {
  spot: Spot;
  addedAt: string;
};

export type RouteLeg = {
  from: Spot;
  to: Spot;
  distanceMeters: number;
};

export type OptimizedRoute = {
  spots: Spot[];
  legs: RouteLeg[];
  totalDistanceMeters: number;
};
