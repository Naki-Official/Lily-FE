'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import AuthUI from '@/components/auth/AuthUI';

export default function AuthPage() {
  const _router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F0F1F2] p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-center font-sf-compact-rounded text-3xl font-semibold tracking-wide">
          Welcome to Naki AI
        </h1>
        
        <AuthUI />
      </div>
    </main>
  );
} 