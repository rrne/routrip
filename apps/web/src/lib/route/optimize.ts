import type { LatLng, OptimizedRoute, Spot } from '@routrip/shared';

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function totalDistance(spots: Spot[]): number {
  let total = 0;
  for (let i = 0; i < spots.length - 1; i++) {
    total += haversineMeters(spots[i].location, spots[i + 1].location);
  }
  return total;
}

function nearestNeighbor(spots: Spot[], startIndex: number): Spot[] {
  const remaining = [...spots];
  const ordered: Spot[] = [];
  const start = remaining.splice(startIndex, 1)[0];
  ordered.push(start);

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineMeters(last.location, remaining[i].location);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }

  return ordered;
}

function twoOpt(spots: Spot[]): Spot[] {
  if (spots.length < 4) return spots;
  let best = spots;
  let bestDist = totalDistance(best);
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let j = i + 1; j < best.length - 1; j++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        const candDist = totalDistance(candidate);
        if (candDist < bestDist) {
          best = candidate;
          bestDist = candDist;
          improved = true;
        }
      }
    }
  }

  return best;
}

// 주어진 순서 그대로 받아서 구간/총거리만 계산. 순서는 절대 바꾸지 않음.
export function buildRoute(spots: Spot[]): OptimizedRoute {
  if (spots.length === 0) {
    return { spots: [], legs: [], totalDistanceMeters: 0 };
  }
  const legs = spots.slice(0, -1).map((from, i) => ({
    from,
    to: spots[i + 1],
    distanceMeters: haversineMeters(from.location, spots[i + 1].location),
  }));
  return {
    spots,
    legs,
    totalDistanceMeters: legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
  };
}

// NN + 2-opt로 자동 최적화. 사용자가 "자동 정렬" 누를 때 사용.
export function optimizeRoute(spots: Spot[], startSpotId?: string): OptimizedRoute {
  if (spots.length === 0) {
    return { spots: [], legs: [], totalDistanceMeters: 0 };
  }
  const startIndex = startSpotId ? Math.max(0, spots.findIndex((s) => s.id === startSpotId)) : 0;
  const ordered = twoOpt(nearestNeighbor(spots, startIndex));
  return buildRoute(ordered);
}
