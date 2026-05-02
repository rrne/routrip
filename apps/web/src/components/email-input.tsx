'use client';

import type { InputHTMLAttributes } from 'react';

// type=email 검증 실패 시 alert + focus.
// 브라우저 네이티브 tooltip 대신 명시적인 alert로 사용자 주의 끌기.
export function EmailInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="email"
      onInvalid={(e) => {
        e.preventDefault();
        const target = e.currentTarget;
        const message = target.validity.valueMissing
          ? '이메일을 입력해주세요.'
          : '올바른 이메일 형식이 아닙니다. (예: name@example.com)';
        alert(message);
        target.focus();
      }}
    />
  );
}
