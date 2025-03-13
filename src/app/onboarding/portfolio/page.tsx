'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { TokenIcon } from '@/components/ui/TokenIcon';

export default function PortfolioPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  // Redirect to auth page if not authenticated
  React.useEffect(() => {
    if (ready && !authenticated) {
      router.push('/auth');
    }
  }, [ready, authenticated, router]);

  const handleContinue = () => {
    // In a real app, you would save the portfolio allocation to a database
    // For now, we'll just redirect to the dashboard
    router.push('/dashboard');
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F0F1F2] p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-6">
          <h1 className="font-sf-compact text-4xl font-semibold tracking-wide text-[#0C1421]">
            Recommended Portfolio
          </h1>
          <p className="font-sf-compact text-xl leading-relaxed text-[#313957]">
            Based on your chosen risk level, here's a suggested allocation. You can adjust this later.
          </p>
        </div>

        <div className="space-y-4">
          {/* Bitcoin Card */}
          <div className="rounded-xl border-2 border-[#D9D9D9] bg-white p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <TokenIcon symbol="BTC" size={48} />
                <div>
                  <h2 className="font-sf-compact text-3xl font-semibold">Bitcoin</h2>
                  <p className="mt-2 font-sf-compact-rounded text-sm font-light">
                    The investment tracks the performance of Bitcoin.
                  </p>
                </div>
              </div>
              <div className="font-sf-compact-rounded text-4xl font-semibold">60%</div>
            </div>
          </div>

          {/* ETF Listed Tokens Card */}
          <div className="rounded-xl border-2 border-[#D9D9D9] bg-white p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  <TokenIcon symbol="BTC" size={40} />
                  <TokenIcon symbol="ETH" size={40} className="relative" />
                </div>
                <div>
                  <h2 className="font-sf-compact text-3xl font-semibold">ETF Listed Tokens</h2>
                  <p className="mt-2 font-sf-compact-rounded text-sm font-light">
                    Tracks the performance of Bitcoin & Ethereum via ETF listings
                  </p>
                </div>
              </div>
              <div className="font-sf-compact-rounded text-4xl font-semibold">20%</div>
            </div>
          </div>

          {/* Large Cap Memecoins Card */}
          <div className="rounded-xl border-2 border-[#D9D9D9] bg-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sf-compact text-3xl font-semibold">Large Cap Memecoins</h2>
                <p className="mt-2 font-sf-compact-rounded text-sm font-light">
                  Tracks the performance of top memecoins by market capitalization.
                </p>
              </div>
              <div className="font-sf-compact-rounded text-4xl font-semibold">20%</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full max-w-[400px] rounded-xl bg-[#162D3A] px-6 py-4 text-center font-sf-compact text-xl font-semibold tracking-wide text-white transition-all hover:bg-opacity-90"
        >
          Continue
        </button>
      </div>
    </main>
  );
} 