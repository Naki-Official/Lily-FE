'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

type TradingGoal = 'high-growth' | 'moderate-growth' | 'low-volatility';

export default function OnboardingPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = React.useState<TradingGoal | null>(null);

  // Redirect to auth page if not authenticated
  React.useEffect(() => {
    if (ready && !authenticated) {
      router.push('/auth');
    }
  }, [ready, authenticated, router]);

  const handleContinue = () => {
    if (selectedGoal) {
      // In a real app, you would save the user's preference to a database
      // For now, we'll just redirect to the portfolio page
      router.push('/onboarding/portfolio');
    }
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
            Welcome Aboard, Let's Personalize Your Experience
          </h1>
          <p className="font-sf-compact text-xl leading-relaxed text-[#313957]">
            To help our AI recommend the best strategies for you, please select your preferred trading goal
          </p>
        </div>

        <div className="space-y-4">
          <div 
            className={`cursor-pointer rounded-xl border-2 p-8 transition-all ${
              selectedGoal === 'high-growth' 
                ? 'border-black bg-[#F2F2F2]' 
                : 'border-[#D9D9D9] bg-white hover:border-gray-400'
            }`}
            onClick={() => setSelectedGoal('high-growth')}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-sf-compact text-3xl font-semibold">High-Growth Potential</h2>
              <div className={`h-6 w-6 rounded-full border-4 ${
                selectedGoal === 'high-growth' ? 'border-[#0B0B0B]' : 'border-[#D9D9D9]'
              }`}></div>
            </div>
            <p className="mt-4 font-sf-compact-rounded text-sm font-light">
              "I'm seeking maximum returns and can tolerate higher volatility."
            </p>
          </div>

          <div 
            className={`cursor-pointer rounded-xl border-2 p-8 transition-all ${
              selectedGoal === 'moderate-growth' 
                ? 'border-black bg-[#F2F2F2]' 
                : 'border-[#D9D9D9] bg-white hover:border-gray-400'
            }`}
            onClick={() => setSelectedGoal('moderate-growth')}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-sf-compact text-3xl font-semibold">Moderate Growth Potential</h2>
              <div className={`h-6 w-6 rounded-full border-4 ${
                selectedGoal === 'moderate-growth' ? 'border-[#0B0B0B]' : 'border-[#D9D9D9]'
              }`}></div>
            </div>
            <p className="mt-4 font-sf-compact-rounded text-sm font-light">
              "I prefer balanced growth and can handle moderate market swings."
            </p>
          </div>

          <div 
            className={`cursor-pointer rounded-xl border-2 p-8 transition-all ${
              selectedGoal === 'low-volatility' 
                ? 'border-black bg-[#F2F2F2]' 
                : 'border-[#D9D9D9] bg-white hover:border-gray-400'
            }`}
            onClick={() => setSelectedGoal('low-volatility')}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-sf-compact text-3xl font-semibold">Low Volatility Preference</h2>
              <div className={`h-6 w-6 rounded-full border-4 ${
                selectedGoal === 'low-volatility' ? 'border-[#0B0B0B]' : 'border-[#D9D9D9]'
              }`}></div>
            </div>
            <p className="mt-4 font-sf-compact-rounded text-sm font-light">
              "I want to focus on stability and protecting my principal."
            </p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedGoal}
          className={`w-full max-w-[400px] rounded-xl bg-[#162D3A] px-6 py-4 text-center font-sf-compact text-xl font-semibold tracking-wide text-white transition-all ${
            !selectedGoal ? 'cursor-not-allowed opacity-70' : 'hover:bg-opacity-90'
          }`}
        >
          Continue
        </button>
      </div>
    </main>
  );
} 