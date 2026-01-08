import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    // Use raw string for backslashes
    const csvPath = String.raw`C:\Users\SHUBHAM KUMAR\OneDrive\Desktop\field visit bmsk\BMSK_Master_Station_list - Copy.csv`

    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at ${csvPath}`)
        return
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = fileContent.split('\n')

    console.log(`Found ${lines.length} lines in CSV`)

    let count = 0
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Simple CSV split (assuming no commas in values based on file view)
        const cols = line.split(',')

        // 0: STATION_NUMBER
        // 4: DISTRICT_NAME
        // 6: BLOCK_NAME
        // 8: PANCHAYATH_NAME
        // 9: LOCATION
        // 10: LONGITUDE
        // 11: LATITUDE
        // 12: STATION_TYPE

        if (cols.length < 13) {
            // console.warn(`Skipping line ${i}: insufficient columns`)
            // continue
            // Actually the file view showed empty columns so length might be correct.
        }

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
                    // Update fields if needed
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

    // Create Admin
    const adminEmail = 'admin@bmsk.com'
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: 'System Admin',
            email: adminEmail,
            password: 'admin', // TODO: Hash
            role: 'ADMIN'
        }
    })
    console.log('Admin user created/verified.')
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
