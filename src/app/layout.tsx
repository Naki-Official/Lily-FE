import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import * as React from 'react';

import '@/styles/globals.css';
// !STARTERCONF This is for demo purposes, remove @/styles/colors.css import immediately
import '@/styles/colors.css';

import PrivyProvider from '@/components/auth/PrivyProvider';

import { siteConfig } from '@/constant/config';

// Load SF Pro fonts
const sfProRounded = localFont({
  src: [
    {
      path: '../../public/fonts/SF-Pro-Rounded-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SF-Pro-Rounded-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SF-Pro-Rounded-Regular.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-sf-pro-rounded',
});

const sfPro = localFont({
  src: [
    {
      path: '../../public/fonts/SF-Pro-Text-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SF-Pro-Text-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SF-Pro-Text-Regular.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-sf-pro',
});

// Keep the existing SF Compact fonts for backward compatibility
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
    default: 'Lily AI',
    template: `%s | Lily AI`,
  },
  description: 'Lily AI - Your AI Assistant',
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
    title: 'Lily AI',
    description: 'Lily AI - Your AI Assistant',
    siteName: 'Lily AI',
    images: [`${siteConfig.url}/images/og.jpg`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lily AI',
    description: 'Lily AI - Your AI Assistant',
    images: [`${siteConfig.url}/images/og.jpg`],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout component for the entire application
 * Responsible for layout structure, fonts, and authentication context
 */
export default function RootLayout({ children }: RootLayoutProps) {
  // Log environment variables to help with debugging (excluding sensitive ones)
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
      HAS_PRIVY_APP_ID: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    });
  }

  const fontClasses = `${inter.variable} ${sfProRounded.variable} ${sfPro.variable} ${sfCompactRounded.variable} ${sfCompactDisplay.variable}`;

  return (
    <html lang="en" className={fontClasses}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined' && window.ethereum) {
                  const originalEthereum = window.ethereum;
                  window._originalEthereum = originalEthereum;
                }
              } catch (e) {
                console.warn('Ethereum conflict handler error:', e);
              }
            `,
          }}
        />
      </head>
      <body className="bg-white font-sans">
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
