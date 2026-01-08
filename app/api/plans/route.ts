import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const planSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    items: z.array(z.object({
        stationId: z.string(),
        planDate: z.string(), // Date for this specific visit
        order: z.number(),
        purpose: z.string().optional()
    })),
    cleanupBefore: z.string().optional()
})

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const json = await req.json()
        const body = planSchema.parse(json)

        const cleanupBefore = body.cleanupBefore
        if (cleanupBefore) {
            // Archive old active plans created before this session
            await prisma.tourPlan.updateMany({
                where: {
                    userId: session.user.id,
                    status: { notIn: ['COMPLETED', 'CANCELLED', 'ARCHIVED'] },
                    createdAt: { lt: cleanupBefore }
                },
                data: { status: 'ARCHIVED' }
            })
        }

        const plan = await prisma.tourPlan.create({
            data: {
                userId: session.user.id,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                status: 'APPROVED', // Default approved as per requirement
                items: {
                    create: body.items.map(i => ({
                        stationId: i.stationId,
                        planDate: new Date(i.planDate),
                        order: i.order,
                        purpose: i.purpose
                    }))
                }
            }
        })

        return NextResponse.json(plan)
    } catch (e) {
        console.error(e)
        return new NextResponse("Error", { status: 500 })
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    // Incharge sees all, FA sees own? 
    // For now, let's assume this endpoint is for listing (Incharge mainly)
    // We can filter by query param or role if needed.

    try {
        const where = session.user.role === 'INCHARGE'
            ? { user: { role: 'FIELD_ASSISTANT', inchargeId: session.user.id } }
            : { userId: session.user.id }

        const plans = await prisma.tourPlan.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                items: { include: { station: true } }
            },
            orderBy: { startDate: 'desc' }
        })

        return NextResponse.json(plans)
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}
