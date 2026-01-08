import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(5, "New Password must be at least 5 characters")
})

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const json = await req.json()
        const body = updateSchema.parse(json)

        // 1. Verify Current Password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) return new NextResponse("User not found", { status: 404 })

        // Note: Using direct comparison since hashing isn't implemented yet per previous context. 
        // If hashing were implemented, we'd use bcrypt.compare here.
        if (user.password !== body.currentPassword) {
            return new NextResponse("Incorrect current password", { status: 400 })
        }

        // 2. Update to New Password
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: body.newPassword }
        })

        return new NextResponse("Password updated", { status: 200 })
    } catch (e) {
        return new NextResponse(e instanceof z.ZodError ? e.message : "Internal Error", { status: 500 })
    }
}
