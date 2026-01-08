import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // 1. Seed Stations (if CSV exists)
    // Use raw string for backslashes, OR relative path if possible. 
    // Ideally we should look for the CSV in the project root or typical location.
    // Keeping the absolute path as requested but making it optional.
    const csvPath = String.raw`C:\Users\SHUBHAM KUMAR\OneDrive\Desktop\field visit bmsk\BMSK_Master_Station_list - Copy.csv`

    if (fs.existsSync(csvPath)) {
        const fileContent = fs.readFileSync(csvPath, 'utf-8')
        const lines = fileContent.split('\n')

        console.log(`Found ${lines.length} lines in CSV`)

        let count = 0
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const cols = line.split(',')

            // 0: STATION_NUMBER
            // 4: DISTRICT_NAME
            // 6: BLOCK_NAME
            // 8: PANCHAYATH_NAME
            // 9: LOCATION
            // 10: LONGITUDE
            // 11: LATITUDE
            // 12: STATION_TYPE

            const stationNumber = cols[0]
            if (!stationNumber) continue

            const district = cols[4]
            const block = cols[6]
            const panchayat = cols[8]
            const location = cols[9]
            const longitude = parseFloat(cols[10])
            const latitude = parseFloat(cols[11])
            const type = cols[12]

            try {
                await prisma.station.upsert({
                    where: { stationNumber },
                    update: {
                        stationType: type || 'UNKNOWN',
                        latitude: isNaN(latitude) ? 0 : latitude,
                        longitude: isNaN(longitude) ? 0 : longitude,
                    },
                    create: {
                        stationNumber,
                        stationType: type || 'UNKNOWN',
                        district,
                        block,
                        panchayat,
                        location,
                        latitude: isNaN(latitude) ? 0 : latitude,
                        longitude: isNaN(longitude) ? 0 : longitude,
                    }
                })
                count++
            } catch (e) {
                console.error(`Error processing station ${stationNumber}:`, e)
            }
        }
        console.log(`Upserted ${count} stations`)
    } else {
        console.warn(`CSV file not found at ${csvPath}. Skipping station seeding.`)
    }

    // 2. Create/Verify Admin User (ALWAYS RUN)
    const adminEmail = 'admin@bmsk.com'
    const adminPassword = 'admin'
    const hashedPassword = await hash(adminPassword, 10)

    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            // Update password to ensure it's hashed if it wasn't
            password: hashedPassword,
            role: 'ADMIN'
        },
        create: {
            name: 'System Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN'
        }
    })

    console.log('Admin user verified/updated:', user.email)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
