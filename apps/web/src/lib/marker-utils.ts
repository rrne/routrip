// 세련된 마커 SVG 생성
export function createMarkerSvg(color: 'default' | 'selected' = 'default'): string {
  if (color === 'selected') {
    // 선택된 마커 - 검정 배경, 중앙 흰 원
    return `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 2C10.3 2 4 8.3 4 16c0 9 14 26 14 26s14-17 14-26c0-7.7-6.3-14-14-14z"
            fill="#1a1a1a" filter="url(#shadow)"/>
      <circle cx="18" cy="16" r="6" fill="#fff"/>
    </svg>`;
  }

  // 기본 마커 - 흰 배경, 검정 테두리
  return `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.2"/>
      </filter>
    </defs>
    <path d="M18 2C10.3 2 4 8.3 4 16c0 9 14 26 14 26s14-17 14-26c0-7.7-6.3-14-14-14z"
          fill="#fff" stroke="#333" stroke-width="1.5" filter="url(#shadow)"/>
    <circle cx="18" cy="16" r="6" fill="#333"/>
  </svg>`;
}

export function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;utf8,${encoded}`;
}
