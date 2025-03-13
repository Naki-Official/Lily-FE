'use client';

import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

/**
 * AuthUI component that provides a login button and handles authentication flow
 */
export default function AuthUI() {
  const { authenticated, ready, user } = usePrivy();
  const router = useRouter();
  
  // Use the useLogin hook to handle login and success callback
  const { login } = useLogin({
    onComplete: ({ user, isNewUser }) => {
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

  return (
    <div className="flex flex-col space-y-4">
      <button
        onClick={login}
        className="w-full rounded-xl bg-[#162D3A] px-6 py-4 text-center font-sf-compact text-xl font-semibold tracking-wide text-white transition-all hover:bg-opacity-90"
      >
        Sign in with Privy
      </button>
      
      <p className="text-center text-sm text-gray-500">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
} 