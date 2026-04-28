import type { Spot } from '@routrip/shared';

// 카카오 API 풀리기 전까지 사용할 더미 장소 데이터.
// 카카오 Local API 응답 형태(이름/주소/카테고리/위경도)에 맞춰 매핑되어 있어, 추후 swap 시 코드 변경 최소.
export const MOCK_SPOTS: Spot[] = [
  {
    id: 'mock-gyeongbokgung',
    name: '경복궁',
    address: '서울 종로구 사직로 161',
    category: '관광명소 > 고궁',
    location: { lat: 37.579617, lng: 126.977041 },
  },
  {
    id: 'mock-bukchon',
    name: '북촌한옥마을',
    address: '서울 종로구 계동길 37',
    category: '관광명소 > 마을',
    location: { lat: 37.582665, lng: 126.985292 },
  },
  {
    id: 'mock-insadong',
    name: '인사동',
    address: '서울 종로구 인사동길',
    category: '관광명소 > 거리',
    location: { lat: 37.572946, lng: 126.985395 },
  },
  {
    id: 'mock-gwanghwamun',
    name: '광화문광장',
    address: '서울 종로구 세종로 1',
    category: '관광명소 > 광장',
    location: { lat: 37.572025, lng: 126.97648 },
  },
  {
    id: 'mock-namsan',
    name: 'N서울타워',
    address: '서울 용산구 남산공원길 105',
    category: '관광명소 > 전망대',
    location: { lat: 37.551169, lng: 126.988227 },
  },
  {
    id: 'mock-myeongdong',
    name: '명동거리',
    address: '서울 중구 명동길',
    category: '관광명소 > 쇼핑거리',
    location: { lat: 37.563592, lng: 126.983132 },
  },
  {
    id: 'mock-dongdaemun',
    name: 'DDP 동대문디자인플라자',
    address: '서울 중구 을지로 281',
    category: '관광명소 > 건축',
    location: { lat: 37.567037, lng: 127.009385 },
  },
  {
    id: 'mock-hongdae',
    name: '홍대거리',
    address: '서울 마포구 양화로23길',
    category: '관광명소 > 거리',
    location: { lat: 37.556751, lng: 126.923644 },
  },
  {
    id: 'mock-itaewon',
    name: '이태원거리',
    address: '서울 용산구 이태원로',
    category: '관광명소 > 거리',
    location: { lat: 37.534468, lng: 126.994434 },
  },
  {
    id: 'mock-gangnam',
    name: '강남역',
    address: '서울 강남구 강남대로 396',
    category: '교통 > 지하철역',
    location: { lat: 37.497942, lng: 127.027621 },
  },
  {
    id: 'mock-lotteworld',
    name: '롯데월드타워 서울스카이',
    address: '서울 송파구 올림픽로 300',
    category: '관광명소 > 전망대',
    location: { lat: 37.512533, lng: 127.10254 },
  },
  {
    id: 'mock-cheonggyecheon',
    name: '청계천',
    address: '서울 종로구 청계천로',
    category: '관광명소 > 하천',
    location: { lat: 37.569526, lng: 126.978954 },
  },
];
