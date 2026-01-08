
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Fetching Tour Plans...")
    const plans = await prisma.tourPlan.findMany({
        include: { items: true }
    })

    console.log("Current Server Time:", new Date().toISOString())

    plans.forEach(p => {
        console.log("Plan ID:", p.id)
        console.log("Status:", p.status)
        console.log("Start Date:", p.startDate)
        console.log("End Date:", p.endDate)
        console.log("Items:", p.items.map(i => `${i.stationNumber} (${i.planDate})`).join(', '))
        console.log("-------------------")
    })
}

main()
