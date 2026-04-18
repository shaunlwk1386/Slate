import type { Metadata, Viewport } from 'next';
import { Inter, DM_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Nav from '@/components/nav/Nav';
import SlateProvider from '@/components/SlateProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Slate',
  description: 'Personal task manager',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Slate',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a202c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmMono.variable}`}>
      <body>
        {/* Google Identity Services — loaded after page is interactive */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <SlateProvider>
          <div className="page-content">{children}</div>
          <Nav />
        </SlateProvider>
      </body>
    </html>
  );
}
