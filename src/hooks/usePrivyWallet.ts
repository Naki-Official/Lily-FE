import { usePrivy } from '@privy-io/react-auth';
import * as React from 'react';

/**
 * Custom hook to access and manage Privy wallet functionality
 * Provides wallet address, private key, and other wallet-related utilities
 */
export function usePrivyWallet() {
  const { user, authenticated, ready, exportWallet } = usePrivy();
  const [privateKey, setPrivateKey] = React.useState<string | null>(null);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Extract wallet details from Privy on mount and when authentication state changes
  React.useEffect(() => {
    const extractWalletDetails = async () => {
      if (!ready || !authenticated || !user) {
        setPrivateKey(null);
        setWalletAddress(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if user has a Privy embedded wallet
        // Using an approach that avoids TypeScript errors
        let foundWalletAddress: string | null = null;
        
        if (user.linkedAccounts && user.linkedAccounts.length > 0) {
          // Look for wallet accounts
          for (const account of user.linkedAccounts) {
            // Safely check if this is a wallet account
            if (account.type === 'wallet') {
              // Try to extract the address
              const address = account.address as string | undefined;
              if (address) {
                foundWalletAddress = address;
                break;
              }
            }
          }
        }
        
        if (foundWalletAddress) {
          setWalletAddress(foundWalletAddress);
        } else {
          setError('No wallet address found');
          setIsLoading(false);
          return;
        }

        // We can't directly get the private key through the API
        // Instead, we use environment variables as fallback
        const envKey = process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY;
        if (envKey) {
          setPrivateKey(envKey);
        } else {
          // Note: Direct private key access requires user interaction via exportWallet
          // We can't programmatically extract it due to security reasons
          setError('No private key available in environment');
        }
      } catch (err) {
        console.error('Error extracting wallet details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    extractWalletDetails();
  }, [ready, authenticated, user]);

  // Function to request user to export their wallet (for UI interaction)
  const requestPrivateKeyExport = React.useCallback(async () => {
    if (!ready || !authenticated) {
      return;
    }
    
    try {
      await exportWallet();
      // This opens a modal for the user to get their key
      // We can't programmatically access it due to security constraints
    } catch (err) {
      console.error('Error during wallet export:', err);
    }
  }, [ready, authenticated, exportWallet]);

  return {
    privateKey,
    walletAddress,
    isLoading,
    error,
    hasWallet: !!walletAddress,
    hasPrivateKey: !!privateKey,
    requestPrivateKeyExport
  };
} 