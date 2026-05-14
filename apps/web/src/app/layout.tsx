import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/sw-register';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'routrip',
  description: '친구들과 함께하는 여행 경로 플래너 — 가고 싶은 곳을 담아서 최단 루트를 계산합니다.',
  manifest: '/manifest.webmanifest',
  applicationName: 'routrip',
  appleWebApp: {
    capable: true,
    title: 'routrip',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/icon-192.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#134e5e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-100 dark:bg-zinc-950">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm dark:bg-black">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
