import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    // If FA, return their plans. If Incharge, maybe return plans of their assignees (different endpoint usually)

    const plans = await prisma.tourPlan.findMany({
        where: { userId: session.user.id },
        include: {
            items: { include: { station: true } },
            trips: { where: { status: 'ONGOING' } } // Fetch active trips
        },
        orderBy: { startDate: 'desc' }
    })

    // Transform to match LocalTourPlan structure if needed, or keeping it consistent
    // Local: items has { ... , stationNumber }

    // Get visits for these items to link them
    // This is N+1 but acceptable for small plans. Better: helper query.
    const stationIds = plans.flatMap(p => p.items.map(i => i.stationId))
    const visits = await prisma.visit.findMany({
        where: {
            stationId: { in: stationIds },
            trip: { userId: session.user.id } // Ensure it's this user's visit
        },
        select: { id: true, stationId: true }
    })

    const data = plans.map(p => ({
        id: p.id,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        items: p.items.map(i => {
            const visit = visits.find(v => v.stationId === i.stationId)
            return {
                id: i.id,
                stationId: i.stationId,
                planDate: i.planDate, // Include this
                order: i.order,
                visited: i.visited,
                purpose: i.purpose,
                visitId: visit ? visit.id : null,
                station: i.station
            }
        }),
        activeTrip: p.trips[0] || null
    }))

    return NextResponse.json(data)
}
