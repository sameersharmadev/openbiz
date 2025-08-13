import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registration = await prisma.udyamRegistration.findUnique({
      where: { id: params.id }
    });

    if (!registration) {
      return NextResponse.json({ 
        error: 'Registration not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}