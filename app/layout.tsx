import './globals.css';
import React from 'react';
import Script from 'next/script';
import { LanguageProvider } from '../lib/LanguageContext';

export const metadata = {
  title: '안심 캠퍼스 맵 - 실시간 대학 유실물 매칭 & 안전 동선 안내 서비스',
  description: '대학 캠퍼스 내부에서 잃어버린 물건과 습득한 물건을 지도 상의 핀을 통해 실시간 소통하여 찾고, 안전한 도보 귀가 동선과 보관함 수령 경로를 안내받으세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || 'a49334282a03a622203fa6ac4ac607b2';

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Synchronous load of Kakao SDK to prevent any timing issues before hydration */}
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services,clusterer&autoload=false`}
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
