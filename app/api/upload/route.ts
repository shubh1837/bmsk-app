import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const formData = await req.formData()
        const urls: string[] = []

        // Save to public/uploads
        const uploadDir = path.join(process.cwd(), "public", "uploads")
        await mkdir(uploadDir, { recursive: true })

        const timestamp = Date.now()

        // Loop through keys
        for (const key of Array.from(formData.keys())) {
            if (key.startsWith("file_")) {
                const file = formData.get(key) as File
                if (!file) continue

                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)

                const filename = `${session.user.id}-${timestamp}-${file.name}`
                const filepath = path.join(uploadDir, filename)

                await writeFile(filepath, buffer)
                urls.push(`/uploads/${filename}`)
            }
        }

        return NextResponse.json({ urls })

    } catch (e) {
        console.error(e)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
