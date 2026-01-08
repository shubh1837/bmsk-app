import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

// This is a temporary setup route. 
// You should DELETE this file or protect it after running it once.
export async function GET() {
    try {
        const adminEmail = 'admin@bmsk.com';
        const hashedPassword = await hash('admin', 10);

        const user = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                password: hashedPassword, // Ensure password is correct/updated
                role: 'ADMIN'
            },
            create: {
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        return NextResponse.json({
            message: 'Success: Admin user created/verified.',
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            credentials: {
                email: 'admin@bmsk.com',
                password: 'admin'
            }
        });
    } catch (error) {
        console.error('Setup error:', error);
        return NextResponse.json({ error: 'Failed to setup admin user' }, { status: 500 });
    }
}
