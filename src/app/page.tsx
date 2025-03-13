'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

/**
 * Landing page component based on the Figma design
 * When the "Get Started" button is clicked, it will redirect to the auth page
 */
export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F0F1F2]">
      <div className="flex flex-col items-center space-y-8">
        <h1 className="font-sf-compact-rounded text-6xl font-semibold tracking-wider md:text-8xl">
          Naki AI
        </h1>
        
        <button
          onClick={handleGetStarted}
          className="w-full max-w-[388px] rounded-xl bg-[#162D3A] px-6 py-4 text-center font-sf-compact text-xl font-semibold tracking-wide text-white transition-all hover:bg-opacity-90"
        >
          Get started
        </button>
      </div>
    </main>
  );
}
