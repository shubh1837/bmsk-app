
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const count = await prisma.station.count()
        console.log(`Station Count: ${count}`)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}
main()
