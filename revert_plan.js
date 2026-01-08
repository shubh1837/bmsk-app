const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Searching for recently completed plans...')

    // Find the most recently updated plan that is COMPLETED
    const plan = await prisma.tourPlan.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { updatedAt: 'desc' },
        include: { user: true }
    })

    if (!plan) {
        console.log('No completed plans found.')
        return
    }

    console.log(`Found Plan ID: ${plan.id}`)
    console.log(`User: ${plan.user.name} (${plan.user.email})`)
    console.log(`Dates: ${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}`)
    console.log(`Updated At: ${plan.updatedAt.toISOString()}`)

    // Revert status to APPROVED
    const updated = await prisma.tourPlan.update({
        where: { id: plan.id },
        data: { status: 'APPROVED' }
    })

    console.log(`\nSUCCESS: Plan status reverted to ${updated.status}.`)
    console.log('The plan should now be visible in the active dashboard.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
