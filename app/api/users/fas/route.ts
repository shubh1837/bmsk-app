import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        let whereClause: any = { role: 'FIELD_ASSISTANT' }

        if (session.user.role === 'INCHARGE') {
            whereClause.inchargeId = session.user.id
        }
        // Admin gets all FAs by default (no extra filter)

        const fas = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(fas)
    } catch (e) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}
