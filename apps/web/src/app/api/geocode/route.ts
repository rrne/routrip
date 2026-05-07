import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📍 API 요청 body:', body);

    const { lng, lat } = body;
    console.log('📍 lng:', lng, 'lat:', lat);

    if (lng === undefined || lat === undefined || lng === null || lat === null) {
      console.log('❌ 좌표 정보 없음');
      return NextResponse.json(
        { error: '좌표 정보가 필요합니다', received: body },
        { status: 400 }
      );
    }

    const restApiKey = process.env.KAKAO_REST_API_KEY;
    console.log('🔑 API 키 있음?', !!restApiKey);

    if (!restApiKey) {
      console.log('❌ API 키 없음');
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다' },
        { status: 500 }
      );
    }

    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}&input_coord=WGS84`;
    console.log('🌐 카카오 API 호출:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `KakaoAK ${restApiKey}`,
      },
    });

    console.log('📡 카카오 API 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 카카오 API 에러:', errorText);
      return NextResponse.json(
        { error: '카카오 API 호출 실패', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ 카카오 API 응답:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: '지오코딩 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
