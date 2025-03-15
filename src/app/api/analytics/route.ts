import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json(); // Extract data from request body

    const newAnalytics = await prisma.analytics.create({
      data,
    });

    return NextResponse.json(newAnalytics, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const analytics = await prisma.analytics.findMany();
    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
