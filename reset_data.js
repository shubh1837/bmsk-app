const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Starting cleanup...")

    // 1. Delete all Visits
    const deletedVisits = await prisma.visit.deleteMany({})
    console.log(`Deleted ${deletedVisits.count} Visits`)

    // 2. Reset plan items
    const updatedItems = await prisma.tourPlanItem.updateMany({
        data: { visited: false }
    })
    console.log(`Reset ${updatedItems.count} Plan Items to 'not visited'`)

    // 3. Delete all Trips
    const deletedTrips = await prisma.trip.deleteMany({})
    console.log(`Deleted ${deletedTrips.count} Trips`)

    // 4. Reset Plans to APPROVED if they were COMPLETED
    const updatedPlans = await prisma.tourPlan.updateMany({
        where: { status: 'COMPLETED' },
        data: { status: 'APPROVED' }
    })
    console.log(`Reset ${updatedPlans.count} Plans to 'APPROVED'`)

    console.log("Cleanup complete!")
}

main()
    .catch(e => {
        console.error("Error during cleanup:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
