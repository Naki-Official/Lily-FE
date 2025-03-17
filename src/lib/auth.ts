import { cookies } from 'next/headers';

import prisma from './prisma';

export async function getPrivyUser() {
  const cookieStore = cookies();
  const privyToken = cookieStore.get('privy-token')?.value;
  
  if (!privyToken) {
    return null;
  }
  
  // Verify token with Privy (implementation depends on Privy's API)
  // For now, just check if user exists in your database
  const user = await prisma.user.findFirst({
    where: { privyId: privyToken },
  });
  
  return user;
}

export async function requireAuth() {
  const user = await getPrivyUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
} 