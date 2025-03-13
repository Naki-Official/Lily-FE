'use client';

import { redirect } from 'next/navigation';

/**
 * Root page component that redirects to the home page
 */
export default function RootPage() {
  redirect('/home');
}
