import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // Await the params promise in Next.js 15
    const { id } = await context.params;
    
    const registration = await prisma.udyamRegistration.findUnique({
      where: { id }
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

// Add other HTTP methods if needed
export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;
    const data = await request.json();
    
    const updatedRegistration = await prisma.udyamRegistration.update({
      where: { id },
      data
    });

    return NextResponse.json({ registration: updatedRegistration });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;
    
    await prisma.udyamRegistration.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}