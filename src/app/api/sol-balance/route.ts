import { NextResponse } from 'next/server';



// Simple API endpoint to get the SOL balance
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { privateKey, walletAddress } = body;
    
    // If we don't have either of these values, return a default response
    if (!privateKey && !walletAddress) {
      return NextResponse.json({
        balance: null,
        error: "No wallet information provided",
        walletAddress: null
      });
    }
    
    // For now, return a simulated SOL balance
    // In a real implementation, you would query the Solana network here
    const simulatedBalance = parseFloat((Math.random() * 2.5).toFixed(3));
    
    return NextResponse.json({
      balance: simulatedBalance.toString(),
      walletAddress: walletAddress || "Unknown address",
      success: true
    });
  } catch (error) {
    console.error("Error getting SOL balance:", error);
    return NextResponse.json(
      { error: "Failed to get SOL balance", details: error },
      { status: 500 }
    );
  }
} 