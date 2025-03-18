'use client';

import Link from 'next/link';
import * as React from 'react';

/**
 * StaticFallback component
 * A simple UI displayed for authenticated routes during static export
 */
export default function StaticFallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-center text-3xl font-bold tracking-tight text-gray-900">
          Welcome to Lily
        </h1>
        
        <p className="mb-8 text-center text-gray-700">
          This page requires authentication. Please sign in to continue.
        </p>
        
        <div className="flex justify-center">
          <Link 
            href="/" 
            className="rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 