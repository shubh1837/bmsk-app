import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(req.url)
    const userIdArg = searchParams.get('userId')

    let whereClause: any = {}

    // Authorization Logic
    if (session.user.role === 'FIELD_ASSISTANT') {
        // FA can only see their own
        whereClause = { trip: { userId: session.user.id } }
    } else if (session.user.role === 'INCHARGE') {
        // Incharge can see their assigned FAs
        if (userIdArg) {
            // Check if this FA belongs to Incharge
            const targetUser = await prisma.user.findUnique({
                where: { id: userIdArg },
                select: { inchargeId: true }
            })
            if (targetUser?.inchargeId !== session.user.id) {
                return new NextResponse("Forbidden", { status: 403 })
            }
            whereClause = { trip: { userId: userIdArg } }
        } else {
            // Show all assigned FAs
            whereClause = { trip: { user: { inchargeId: session.user.id } } }
        }
    } else if (session.user.role === 'ADMIN') {
        if (userIdArg) {
            whereClause = { trip: { userId: userIdArg } }
        }
    }

    try {
        const visits = await prisma.visit.findMany({
            where: whereClause,
            include: {
                station: true,
                trip: {
                    include: { user: true }
                }
            },
            orderBy: { visitDate: 'desc' }
        })

        // Transform for Report Table
        const reportData = visits.map((visit, index) => {
            const formData = JSON.parse(visit.formData)

            // Logic for Functional Status
            // Check essential sensors
            let status = "Functional"
            const issues: string[] = []

            if (visit.station.stationType === 'AWS') {
                if (formData.tempFunc === 'Not Proper') issues.push("Temp")
                if (formData.windFunc === 'Not Proper') issues.push("Wind")
                if (formData.pressFunc === 'Not Proper') issues.push("Press")
            }

            if (formData.rainBucket === 'Dirty' || formData.rainFunnel === 'Dirty') {
                issues.push("Rain(Dirty)")
            }

            if (issues.length > 0) {
                status = `Partially Functional (${issues.join(', ')})`
            }
            // Logic could be more complex based on specific rules

            return {
                id: visit.id,
                date: visit.visitDate,
                district: visit.station.district || "N/A",
                stationId: visit.station.stationNumber,
                stationType: visit.station.stationType,
                block: visit.station.block || "N/A",
                panchayat: visit.station.panchayat || "N/A",
                distance: visit.trip.totalDist || 0, // Using trip total distance
                purpose: "Inspection & Maintenance", // Default
                status: status,
                faName: visit.trip.user.name
            }
        })

        return NextResponse.json(reportData)
    } catch (e) {
        console.error(e)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
