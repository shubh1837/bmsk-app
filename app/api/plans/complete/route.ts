import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getDistance } from "geolib"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { lat, long } = await req.json()

        const trip = await prisma.trip.findFirst({
            where: {
                userId: session.user.id,
                status: 'ONGOING'
            }
        })

        if (!trip) {
            return new NextResponse("No active trip found", { status: 404 })
        }

        // Calculate final leg distance
        const endLat = lat || 0
        const endLong = long || 0

        if (endLat !== 0 && endLong !== 0) {
            // Get last visit
            const lastVisit = await prisma.visit.findFirst({
                where: { tripId: trip.id },
                orderBy: { createdAt: 'desc' }
            })

            let prevLat = trip.startLat
            let prevLong = trip.startLong

            if (lastVisit && lastVisit.latitude && lastVisit.longitude) {
                prevLat = lastVisit.latitude
                prevLong = lastVisit.longitude
            }

            if (prevLat !== 0) {
                const meters = getDistance(
                    { latitude: prevLat, longitude: prevLong },
                    { latitude: endLat, longitude: endLong }
                )
                const dist = meters / 1000

                await prisma.trip.update({
                    where: { id: trip.id },
                    data: { totalDist: { increment: dist } }
                })
            }
        }

        // Update Trip Status
        await prisma.trip.update({
            where: { id: trip.id },
            data: {
                status: 'COMPLETED',
                endDate: new Date(),
                endLat: endLat,
                endLong: endLong
            }
        })

        // REMOVED: Do not auto-close the plan when ending a daily trip.
        // The plan should remain active for multi-day trips.
        // if (trip.planId) {
        //     await prisma.tourPlan.update({
        //         where: { id: trip.planId },
        //         data: { status: 'COMPLETED' }
        //     })
        // }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error(e)
        return new NextResponse("Error completing trip", { status: 500 })
    }
}
