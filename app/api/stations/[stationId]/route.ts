import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ stationId: string }> }
) {
    try {
        const { stationId } = await params
        const station = await prisma.station.findUnique({
            where: { id: stationId }
        })

        if (!station) {
            return new NextResponse("Station not found", { status: 404 })
        }

        return NextResponse.json(station)
    } catch (e) {
        console.error(e)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
