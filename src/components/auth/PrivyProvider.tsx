'use client';

import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';
import * as React from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

// Add TypeScript declarations for window properties
declare global {
  interface Window {
    _originalEthereum?: unknown;
    _privyEthereumSetup?: boolean;
  }
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
  
  // Get the app ID from environment variables
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cm86sdg5a00vxeixbkeg3z2e7';
  
  // Handle potential window.ethereum conflicts before Privy initialization
  React.useEffect(() => {
    try {
      // This helps with Metamask/other wallet conflicts
      if (typeof window !== 'undefined' && window.ethereum) {
        // Store the original ethereum provider
        const originalEthereum = window.ethereum;
        
        // Store it in a separate property instead of trying to override
        Object.defineProperty(window, '_originalEthereum', {
          value: originalEthereum,
          writable: false,
          configurable: true
        });
        
        // Add a safer version that doesn't modify window.ethereum directly
        // but still makes the original available
        if (!window._privyEthereumSetup) {
          console.log('Setting up ethereum compatibility wrapper');
          window._privyEthereumSetup = true;
        }
      }
    } catch (error) {
      console.warn('Failed to handle ethereum provider:', error);
    }
  }, []);
  
  // If we're in a build environment or missing app ID, just render children without Privy
  if (isBuildTime || !appId) {
    console.log('Build environment or missing Privy app ID detected, skipping Privy initialization');
    return <>{children}</>;
  }
  
  // In runtime environment, use the normal Privy provider
  return (
    <PrivyAuthProvider
      appId={appId}
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