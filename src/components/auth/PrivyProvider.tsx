'use client';

import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';
import * as React from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

/**
 * PrivyProvider component that wraps the application with Privy authentication
 * Note: The onSuccess callback should be handled via the useLogin hook in components
 * that need to respond to successful authentication
 */
export default function PrivyProvider({ children }: PrivyProviderProps) {
  // Detect build/SSG environment to prevent Privy initialization during build
  const isServer = typeof window === 'undefined';
  const isBuildTime = isServer && process.env.NEXT_PHASE === 'phase-production-build';
  
  // If we're in a build environment, just render children without Privy
  if (isBuildTime) {
    console.log('Build environment detected, skipping Privy initialization');
    return <>{children}</>;
  }
  
  // In runtime environment, use the normal Privy provider
  return (
    <PrivyAuthProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        // Configure available login methods
        loginMethods: ['email', 'wallet', 'google', 'apple'],
        appearance: {
          theme: 'light',
          accentColor: '#162D3A',
          // Update with actual logo URL from public directory
          logo: '/images/lily.jpg',
        },
        // Create embedded wallets for users who don't have one
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyAuthProvider>
  );
} 