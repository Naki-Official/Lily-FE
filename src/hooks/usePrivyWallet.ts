import { usePrivy } from '@privy-io/react-auth';
import * as React from 'react';

// Define interfaces for Privy linked accounts
interface WalletAccount {
  type: 'wallet';
  address: string;
  walletClientType?: string;
  [key: string]: unknown;
}

interface GenericAccount {
  type: string;
  address?: string;
  walletClientType?: string;
  [key: string]: unknown;
}

type LinkedAccount = WalletAccount | GenericAccount;

// Define a more specific type for debug info
interface DebugInfo {
  isVercel?: boolean;
  vercelEnv?: string;
  hasEnvKey?: boolean;
  userLinkedAccountsCount?: number;
  walletAddressFound?: boolean;
  walletAddressLength?: number;
  privateKeySource?: string;
  privateKeyLength?: number;
  privateKeyAvailable?: boolean;
  foundWalletType?: string;
  solanaWalletFound?: boolean;
  ethereumWalletFound?: boolean;
  allAddresses?: string[];
  error?: string;
  [key: string]: unknown;
}

/**
 * Custom hook to access and manage Privy wallet functionality
 * Provides wallet address, private key, and other wallet-related utilities
 * Only returns Solana wallet addresses, ignores Ethereum addresses
 */
export function usePrivyWallet() {
  const { user, authenticated, ready, exportWallet } = usePrivy();
  const [privateKey, setPrivateKey] = React.useState<string | null>(null);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [debugInfo, setDebugInfo] = React.useState<DebugInfo>({});

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

      const info: DebugInfo = {
        isVercel: typeof process.env.VERCEL === 'string' && process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
        hasEnvKey: !!process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY,
        userLinkedAccountsCount: user.linkedAccounts?.length || 0,
        allAddresses: [],
        solanaWalletFound: false,
        ethereumWalletFound: false
      };

      try {
        // Check if user has a Privy embedded wallet
        let foundWalletAddress: string | null = null;
        const allAddresses: string[] = [];
        
        if (user.linkedAccounts && user.linkedAccounts.length > 0) {
          // First explicitly search for Phantom wallet with Solana address
          let phantomWallet: LinkedAccount | null = null;
          let solanaWallet: LinkedAccount | null = null;
          
          // Safely cast linkedAccounts
          const linkedAccounts = user.linkedAccounts as unknown as LinkedAccount[];
          
          // Log all addresses for debugging
          linkedAccounts.forEach(account => {
            if (account.address) {
              // Only add non-Ethereum addresses to our debug list for clarity
              if (!account.address.startsWith('0x')) {
                allAddresses.push(`${account.address} (${account.walletClientType || 'unknown'})`);
              }
            }
          });
          
          info.allAddresses = allAddresses;
          
          // First pass: look specifically for Phantom wallet
          for (const account of linkedAccounts) {
            const address = account.address;
            
            if (address && !address.startsWith('0x') && account.walletClientType === 'phantom') {
              phantomWallet = account;
              info.solanaWalletFound = true;
              break;
            }
          }
          
          // Second pass: if no Phantom, look for any Solana address (not starting with 0x)
          if (!phantomWallet) {
            for (const account of linkedAccounts) {
              const address = account.address;
              
              if (address && !address.startsWith('0x')) {
                solanaWallet = account;
                info.solanaWalletFound = true;
                break;
              }
            }
          }
          
          // Use wallets in priority order: Phantom > Any Solana
          const selectedWallet = phantomWallet || solanaWallet;
          
          if (selectedWallet && selectedWallet.address) {
            foundWalletAddress = selectedWallet.address;
            info.foundWalletType = selectedWallet.walletClientType || 'unknown';
            
            // For debugging - note what type of wallet we found
            if (phantomWallet) {
              info.foundWalletType = 'phantom (solana)';
            } else if (solanaWallet) {
              info.foundWalletType = 'solana (non-phantom)';
            }
          }
        }
        
        if (foundWalletAddress) {
          setWalletAddress(foundWalletAddress);
          info.walletAddressFound = true;
          info.walletAddressLength = foundWalletAddress.length;
        } else {
          setError('No Solana wallet address found');
          info.walletAddressFound = false;
          setIsLoading(false);
          return;
        }

        // We can't directly get the private key through the API
        // Instead, we use environment variables as fallback
        const envKey = process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY;
        if (envKey) {
          setPrivateKey(envKey);
          info.privateKeySource = 'environment';
          info.privateKeyLength = envKey.length;
        } else {
          // For production debugging
          info.privateKeySource = 'none';
          info.privateKeyAvailable = false;
          
          // Note: Direct private key access requires user interaction via exportWallet
          // We can't programmatically extract it due to security constraints
          setError('No private key available in environment');
        }
        
        setDebugInfo(info);
      } catch (err) {
        console.error('Error extracting wallet details:', err);
        info.error = err instanceof Error ? err.message : 'Unknown error';
        setDebugInfo(info);
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
    requestPrivateKeyExport,
    debugInfo
  };
} 