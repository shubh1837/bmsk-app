import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getDistance } from "geolib"

const visitSchema = z.object({
    stationId: z.string(),
    visitDate: z.string().or(z.date()), // JSON sends string
    formData: z.any(),
    images: z.array(z.string()),
    tripId: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
})

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const json = await req.json()
        const body = visitSchema.parse(json)

        let finalTripId = body.tripId;

        if (!finalTripId) {
            // Find ONGOING active trip for this user
            const activeTrip = await prisma.trip.findFirst({
                where: {
                    userId: session.user.id,
                    status: 'ONGOING'
                }
            })

            if (!activeTrip) {
                return new NextResponse("No active trip found. Please Start Activity on dashboard first.", { status: 400 })
            }
            finalTripId = activeTrip.id
        }

        // Calculate Distance
        let dist = 0
        const currentLat = body.latitude || 0
        const currentLng = body.longitude || 0

        if (currentLat !== 0 && currentLng !== 0) {
            // Get last visit to calculate segment
            const lastVisit = await prisma.visit.findFirst({
                where: { tripId: finalTripId },
                orderBy: { createdAt: 'desc' }
            })

            let prevLat = 0
            let prevLng = 0

            if (lastVisit && lastVisit.latitude && lastVisit.longitude) {
                prevLat = lastVisit.latitude
                prevLng = lastVisit.longitude
            } else {
                // If no last visit, check trip start
                const t = await prisma.trip.findUnique({ where: { id: finalTripId } })
                if (t) {
                    prevLat = t.startLat
                    prevLng = t.startLong
                }
            }

            if (prevLat !== 0 && prevLng !== 0) {
                const meters = getDistance(
                    { latitude: prevLat, longitude: prevLng },
                    { latitude: currentLat, longitude: currentLng }
                )
                dist = meters / 1000 // Convert to km
            }
        }

        // Parse formData to extract staffName (Agency Engineer Name)
        let staffName: string | undefined;
        let parsedFormData: any = body.formData;

        try {
            if (typeof body.formData === 'string') {
                parsedFormData = JSON.parse(body.formData);
            }
            if (parsedFormData?.meta?.staffName) {
                staffName = parsedFormData.meta.staffName;
            }
        } catch (e) {
            console.error("Error parsing formData for staffName extraction", e);
        }

        const visit = await prisma.visit.create({
            data: {
                tripId: finalTripId!,
                stationId: body.stationId,
                visitDate: new Date(body.visitDate),
                formData: typeof body.formData === 'string' ? body.formData : JSON.stringify(body.formData),
                images: JSON.stringify(body.images),
                latitude: currentLat,
                longitude: currentLng,
                distanceFromPrev: dist
            }
        })

        // Update Trip Total Distance
        if (dist > 0) {
            await prisma.trip.update({
                where: { id: finalTripId },
                data: { totalDist: { increment: dist } }
            })
        }

        // Mark plan item as visited if applicable
        const trip = await prisma.trip.findUnique({ where: { id: finalTripId }, include: { plan: true } })

        if (trip && trip.planId) {
            const planItem = await prisma.tourPlanItem.findFirst({
                where: {
                    planId: trip.planId,
                    stationId: body.stationId
                }
            })

            if (planItem) {
                await prisma.tourPlanItem.update({
                    where: { id: planItem.id },
                    data: { visited: true }
                })
            }
        }

        // Update Station Last Visited Date and Agency Engineer Name
        await prisma.station.update({
            where: { id: body.stationId },
            data: {
                lastVisitedDate: new Date(body.visitDate),
                vendorEngineerName: staffName
            }
        })

        return NextResponse.json(visit)

    } catch (e) {
        console.error(e)
        return new NextResponse("Error", { status: 500 })
    }
}
