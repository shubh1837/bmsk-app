import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(5),
    role: z.enum(["INCHARGE", "FIELD_ASSISTANT", "ADMIN"]),
    inchargeId: z.string().optional(),
})

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const json = await req.json()
        const body = createUserSchema.parse(json)

        // Check existing
        const existing = await prisma.user.findUnique({
            where: { email: body.email }
        })

        if (existing) {
            return new NextResponse("User already exists", { status: 400 })
        }

        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                password: body.password, // TODO: Hash in production
                role: body.role,
                inchargeId: body.inchargeId || null
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        return new NextResponse(error instanceof z.ZodError ? error.message : "Internal Error", { status: 500 })
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')

    const usersRaw = await prisma.user.findMany({
        where: role ? { role } : {},
        include: {
            incharge: {
                select: { name: true }
            },
            fas: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    // Filter out System Admin
    const users = usersRaw.filter(u => u.name.toLowerCase() !== 'system admin')

    return NextResponse.json(users)
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return new NextResponse("ID required", { status: 400 })

    await prisma.user.delete({
        where: { id }
    })

    return new NextResponse("Deleted", { status: 200 })
}
