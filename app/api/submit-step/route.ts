// app/api/submit-step/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateAadhaar, validatePAN, validateEntrepreneurName } from '@/utils/validation';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { step, data } = await request.json();

    if (step === 1) {
      // Validate Aadhaar step
      const { aadhaarNumber, entrepreneurName, aadhaarConsent } = data;

      if (!aadhaarNumber || !validateAadhaar(aadhaarNumber)) {
        return NextResponse.json({ 
          error: 'Please enter a valid 12-digit Aadhaar number' 
        }, { status: 400 });
      }

      if (!entrepreneurName || !validateEntrepreneurName(entrepreneurName)) {
        return NextResponse.json({ 
          error: 'Entrepreneur name is required and must be less than 100 characters' 
        }, { status: 400 });
      }

      if (!aadhaarConsent) {
        return NextResponse.json({ 
          error: 'You must consent to proceed' 
        }, { status: 400 });
      }

      // Store in Supabase database
      const registration = await prisma.udyamRegistration.create({
        data: {
          aadhaarNumber,
          entrepreneurName,
          aadhaarConsent,
          stepCompleted: 1
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Aadhaar validation successful',
        registrationId: registration.id
      });

    } else if (step === 2) {
      // Validate PAN step
      const { panNumber, organizationType, registrationId } = data;

      if (!panNumber || !validatePAN(panNumber)) {
        return NextResponse.json({ 
          error: 'Please enter a valid PAN number (Format: ABCDE1234F)' 
        }, { status: 400 });
      }

      if (!organizationType) {
        return NextResponse.json({ 
          error: 'Please select organization type' 
        }, { status: 400 });
      }

      // Update existing registration in database
      const registration = await prisma.udyamRegistration.update({
        where: { id: registrationId },
        data: {
          panNumber,
          organizationType,
          stepCompleted: 2
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'PAN validation successful',
        registration
      });
    }

    return NextResponse.json({ 
      error: 'Invalid step' 
    }, { status: 400 });

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}