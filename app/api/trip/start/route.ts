import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { planId, lat, long } = await req.json()

        if (!planId) return new NextResponse("Plan ID required", { status: 400 })

        // Check if already ongoing
        const existing = await prisma.trip.findFirst({
            where: { userId: session.user.id, status: 'ONGOING' }
        })

        if (existing) return new NextResponse("Trip already in progress", { status: 400 })

        const trip = await prisma.trip.create({
            data: {
                userId: session.user.id,
                planId,
                startDate: new Date(),
                startLat: lat || 0,
                startLong: long || 0,
                status: 'ONGOING'
            }
        })

        return NextResponse.json(trip)
    } catch (e) {
        console.error(e)
        return new NextResponse("Error", { status: 500 })
    }
}
