import { cookies } from 'next/headers';

import prisma from './prisma';

// Function to get the current user from Privy token
export async function getCurrentUser() {
  const cookieStore = cookies();
  const privyToken = cookieStore.get('privy-token')?.value;
  
  if (!privyToken) {
    return null;
  }
  
  // You'll need to replace this with actual verification logic using Privy's API
  // For now, use a placeholder approach
  
  try {
    // Find or create user in your database based on Privy ID
    let user = await prisma.user.findFirst({
      where: { privyId: privyToken },
    });
    
    if (!user) {
      // This is a new user - create them in your database
      user = await prisma.user.create({
        data: {
          privyId: privyToken,
          // You can add more fields if you get them from Privy
          // name: privyUserInfo.name,
          // email: privyUserInfo.email,
        },
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Define interface for user data
interface UserData {
  name?: string;
  email?: string;
  [key: string]: unknown; // Allow for additional fields
}

// Function to link Privy user to your database
export async function linkPrivyUser(privyUserId: string, userData: UserData) {
  try {
    const user = await prisma.user.upsert({
      where: { privyId: privyUserId },
      update: {
        name: userData.name,
        email: userData.email,
        // Update other fields as needed
      },
      create: {
        privyId: privyUserId,
        name: userData.name,
        email: userData.email,
        // Add other fields as needed
      },
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('Error linking Privy user:', error);
    return { success: false, error: (error as Error).message };
  }
} 