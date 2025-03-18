'use client';

import { useLogin, usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

/**
 * AuthUI component that provides a login button and handles authentication flow
 * Enhanced with accessibility features, loading state, and responsive design
 */
export default function AuthUI() {
  // Detect build/SSG environment
  const isServer = typeof window === 'undefined';
  const isBuildTime = isServer && process.env.NEXT_PHASE === 'phase-production-build';
  
  // If we're in a build environment, render a static version without hooks
  if (isBuildTime) {
    return (
      <div className="flex flex-col space-y-4">
        <button
          className="relative w-full rounded-xl bg-[#162D3A] px-6 py-4 text-center font-sf-compact text-xl font-semibold tracking-wide text-white"
          disabled
        >
          Sign in with Privy
        </button>
        
        <p className="text-center text-sm text-gray-500">
          By signing in, you agree to our <a href="#" className="text-blue-600">Terms of Service</a> and <a href="#" className="text-blue-600">Privacy Policy</a>.
        </p>
      </div>
    );
  }
  
  // Runtime version with full functionality
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Use the useLogin hook to handle login and success callback
  const { login } = useLogin({
    onComplete: () => {
      // Redirect to onboarding page after successful login
      router.push('/onboarding');
    },
  });

  // Redirect to onboarding if already authenticated
  React.useEffect(() => {
    if (ready && authenticated) {
      router.push('/onboarding');
    }
  }, [ready, authenticated, router]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await login();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        aria-busy={isLoading}
        className="relative w-full rounded-xl bg-[#162D3A] px-6 py-4 text-center font-sf-compact text-xl font-semibold tracking-wide text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            </span>
            <span className="opacity-0">Sign in with Privy</span>
          </>
        ) : (
          'Sign in with Privy'
        )}
      </button>
      
      <p className="text-center text-sm text-gray-500">
        By signing in, you agree to our <a href="#" className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">Privacy Policy</a>.
      </p>
    </div>
  );
} 