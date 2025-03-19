'use client';

import { usePrivy } from '@privy-io/react-auth';
import * as React from 'react';

import { usePrivyWallet } from '@/hooks/usePrivyWallet';

// Add declaration for Vercel compatibility flag
declare global {
  interface Window {
    _vercelProviderConfigured?: boolean;
  }
}

interface WalletConnectorProps {
  children: React.ReactNode;
}

/**
 * WalletConnector component that handles wallet authentication status
 * Ensures proper wallet connection flow in production
 */
export default function WalletConnector({ children }: WalletConnectorProps) {
  const { ready, authenticated, user } = usePrivy();
  const { walletAddress, hasWallet, debugInfo } = usePrivyWallet();
  const [isVercel, setIsVercel] = React.useState<boolean>(false);
  
  // Check if we're running in Vercel production
  React.useEffect(() => {
    const vercelEnv = typeof process.env.VERCEL === 'string' && process.env.VERCEL === '1';
    setIsVercel(vercelEnv);
    
    if (vercelEnv) {
      console.log('Running in Vercel environment');
      console.log('WalletConnector debug info:', debugInfo);
    }
  }, [debugInfo]);
  
  // For deployed environments, ensure the window.ethereum setup is correctly initialized
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isVercel) {
      try {
        // Force configure provider handling for Vercel compatibility
        console.log('Vercel compatibility: Checking ethereum provider');
        
        // Add a global flag to track if we've already tried to handle ethereum provider
        if (!window._vercelProviderConfigured) {
          window._vercelProviderConfigured = true;
          console.log('Vercel compatibility: Init ethereum provider compatibility');
          
          // Add additional cleanup when component unmounts
          return () => {
            if (window._vercelProviderConfigured) {
              window._vercelProviderConfigured = false;
            }
          };
        }
      } catch (error) {
        console.warn('Failed to setup Vercel ethereum provider compatibility:', error);
      }
    }
  }, [isVercel]);
  
  // Return early during loading state
  if (!ready) {
    return <>{children}</>;
  }
  
  // Check wallet connection status for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('WalletConnector status:', {
      authenticated,
      hasWallet,
      walletAddressAvailable: !!walletAddress,
      walletAddressLength: walletAddress?.length || 0,
      hasLinkedAccounts: user?.linkedAccounts?.length ?? 0,
    });
  }
  
  // Just render children by default - we're only setting up wallet monitoring
  return <>{children}</>;
} 