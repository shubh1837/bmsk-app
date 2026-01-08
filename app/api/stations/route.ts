import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    // Public or protected? Protected.
    // Allow any auth user to get stations
    try {
        const stations = await prisma.station.findMany()
        return NextResponse.json(stations)
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}
