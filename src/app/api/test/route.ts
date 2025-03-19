import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'API test route is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'API test POST route is working',
      received: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const parseError = error as Error;
    return NextResponse.json({
      status: 'error',
      message: 'Failed to parse request body',
      error: parseError.message,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
} 