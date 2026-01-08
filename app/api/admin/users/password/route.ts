import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const resetSchema = z.object({
    userId: z.string(),
    password: z.string().min(5, "Password must be at least 5 characters")
})

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const json = await req.json()
        const body = resetSchema.parse(json)

        await prisma.user.update({
            where: { id: body.userId },
            data: { password: body.password } // Todo: Hash
        })

        return new NextResponse("Password updated", { status: 200 })
    } catch (e) {
        return new NextResponse(e instanceof z.ZodError ? e.message : "Internal Error", { status: 500 })
    }
}
