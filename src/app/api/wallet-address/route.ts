import { NextResponse } from 'next/server';


// Handler for retrieving wallet address
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress } = body;
    
    // If wallet address was provided, we'll just return it with some additional info
    if (walletAddress) {
      console.log(`Received wallet address: ${walletAddress}`);
      
      // Reject Ethereum-style addresses
      if (walletAddress.startsWith('0x')) {
        return NextResponse.json({
          walletAddress: null,
          walletType: null,
          status: "Ethereum-style addresses not supported",
          success: false
        });
      }
      
      // Validate Solana address format (basic check)
      const isSolanaAddress = walletAddress.length >= 32 && walletAddress.length <= 44;
      
      if (!isSolanaAddress) {
        return NextResponse.json({
          walletAddress: null,
          walletType: null,
          status: "Invalid Solana address format",
          success: false
        });
      }
      
      return NextResponse.json({
        walletAddress: walletAddress,
        walletType: "Solana Native Wallet",
        status: "Connected from client", 
        success: true
      });
    }
    
    // If we got here, we don't have wallet info so return a dummy response
    return NextResponse.json({
      walletAddress: null,
      walletType: null,
      status: "No wallet address provided",
      success: false
    });
  } catch (error) {
    console.error("Error getting wallet address:", error);
    return NextResponse.json(
      { error: "Failed to get wallet address", details: error }, 
      { status: 500 }
    );
  }
} 