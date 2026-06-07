import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

const SITE = 'https://flipcheck-phi.vercel.app';
const TITLE = 'FlipCheck — Know what it’s worth before you buy it';
const DESC =
  'Your thrifting co-pilot. Point your camera at any thrift, garage-sale, or estate find and get an instant resale-value range + a Buy / Maybe / Skip verdict. Join the waitlist.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  applicationName: 'FlipCheck',
  icons: { icon: '/icon.png', apple: '/icon.png' },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: SITE,
    siteName: 'FlipCheck',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'FlipCheck' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/og.png'] },
};

export const viewport: Viewport = { themeColor: '#0a0b0e' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
