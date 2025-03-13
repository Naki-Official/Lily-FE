import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import * as React from 'react';

import '@/styles/globals.css';
// !STARTERCONF This is for demo purposes, remove @/styles/colors.css import immediately
import '@/styles/colors.css';

import PrivyProvider from '@/components/auth/PrivyProvider';

import { siteConfig } from '@/constant/config';

// Load SF Compact fonts
const sfCompactRounded = localFont({
  src: [
    {
      path: '../../public/fonts/SF-Compact-Rounded-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-sf-compact-rounded',
});

const sfCompactDisplay = localFont({
  src: [
    {
      path: '../../public/fonts/SF-Compact-Display-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-sf-compact',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// !STARTERCONF Change these default meta
// !STARTERCONF Look at @/constant/config to change them
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'Naki AI',
    template: `%s | Naki AI`,
  },
  description: 'Naki AI - Your AI Assistant',
  robots: { index: true, follow: true },
  // !STARTERCONF this is the default favicon, you can generate your own from https://realfavicongenerator.net/
  // ! copy to /favicon folder
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon-16x16.png',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: `/favicon/site.webmanifest`,
  openGraph: {
    url: siteConfig.url,
    title: 'Naki AI',
    description: 'Naki AI - Your AI Assistant',
    siteName: 'Naki AI',
    images: [`${siteConfig.url}/images/og.jpg`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Naki AI',
    description: 'Naki AI - Your AI Assistant',
    images: [`${siteConfig.url}/images/og.jpg`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sfCompactRounded.variable} ${sfCompactDisplay.variable}`}>
      <body className="bg-white font-sans">
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
