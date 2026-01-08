import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateSchema = z.object({
    status: z.enum(['PLANNED', 'APPROVED', 'REJECTED', 'CANCELLED'])
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params

    try {
        const json = await req.json()
        const body = updateSchema.parse(json)

        const plan = await prisma.tourPlan.findUnique({
            where: { id },
            include: { user: true }
        })

        if (!plan) return new NextResponse("Plan not found", { status: 404 })

        // Check permissions:
        // 1. Incharge can update plans of their FAs
        // 2. Admin can update anything
        // 3. User can cancel their own plan? (Maybe separately)

        const isMyFA = plan.user.inchargeId === session.user.id
        const isAdmin = session.user.role === 'ADMIN'

        if (!isMyFA && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const updated = await prisma.tourPlan.update({
            where: { id },
            data: { status: body.status }
        })

        return NextResponse.json(updated)

    } catch (e) {
        console.error(e)
        return new NextResponse("Error updating plan", { status: 500 })
    }
}
