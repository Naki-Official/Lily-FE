'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function DashboardPage() {
  const { ready, authenticated, user, logout } = usePrivy();
  const router = useRouter();

  // Redirect to auth page if not authenticated
  React.useEffect(() => {
    if (ready && !authenticated) {
      router.push('/auth');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#F0F1F2] p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-sf-compact-rounded text-3xl font-semibold tracking-wide">
          Naki AI Dashboard
        </h1>
        
        <button
          onClick={logout}
          className="rounded-lg bg-[#162D3A] px-4 py-2 font-sf-compact text-sm font-semibold text-white transition-all hover:bg-opacity-90"
        >
          Sign Out
        </button>
      </div>
      
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 font-sf-compact text-xl font-semibold">
          Welcome, {user?.email?.address || 'User'}!
        </h2>
        <p className="text-gray-600">
          You have successfully authenticated with Privy.
        </p>
      </div>
    </main>
  );
} 