const fs = require('fs')
const csv = require('csv-parser')
const { PrismaClient } = require('@prisma/client')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
    console.log("Starting Station Import...")

    // 1. Clear existing stations AND dependencies
    console.log("Clearing Tour Plans and Items to allow Station deletion...")
    await prisma.tourPlanItem.deleteMany({})
    await prisma.tourPlan.deleteMany({})

    const deleted = await prisma.station.deleteMany({})
    console.log(`Deleted ${deleted.count} existing stations.`)

    const results = []
    const csvPath = path.join('..', 'BMSK_Master_Station_list.csv') // Assuming script is in bmsk-app, file is in parent folder?
    // Wait, user said file is at C:\Users\SHUBHAM KUMAR\OneDrive\Desktop\field visit bmsk\BMSK_Master_Station_list.csv
    // and project is at C:\Users\SHUBHAM KUMAR\OneDrive\Desktop\field visit bmsk\bmsk-app
    // So yes, ..\BMSK_Master_Station_list.csv

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsed ${results.length} records. Normalizing Data...`)

            // 1. Build Normalization Maps (ID -> Name)
            const districtMap = new Map()
            const blockMap = new Map()

            for (const row of results) {
                const dCode = row.DISTRICT_CODE?.trim()
                const dName = row.DISTRICT_NAME?.trim()
                const bCode = row.BLOCK_CODE?.trim()
                const bName = row.BLOCK_NAME?.trim()

                // Pick the first name we find for a given code and stick with it
                if (dCode && dName && !districtMap.has(dCode)) {
                    districtMap.set(dCode, dName)
                }
                if (bCode && bName && !blockMap.has(bCode)) {
                    blockMap.set(bCode, bName)
                }
            }

            console.log(`Identified ${districtMap.size} unique Districts and ${blockMap.size} unique Blocks. Inserting...`)

            let count = 0
            for (const row of results) {
                try {
                    // Normalize names
                    const dCode = row.DISTRICT_CODE?.trim()
                    const bCode = row.BLOCK_CODE?.trim()

                    const finalDistrict = districtMap.get(dCode) || row.DISTRICT_NAME?.trim() || 'Unknown'
                    const finalBlock = blockMap.get(bCode) || row.BLOCK_NAME?.trim() || 'Unknown'

                    await prisma.station.create({
                        data: {
                            stationNumber: row.STATION_NUMBER,
                            stationType: row.STATION_TYPE || 'Unknown',
                            district: finalDistrict,
                            block: finalBlock,
                            panchayat: row.PANCHAYATH_NAME,
                            location: row.LOCATION,
                            latitude: parseFloat(row.LATITUDE) || 0,
                            longitude: parseFloat(row.LONGITUDE) || 0,
                            metadata: JSON.stringify({
                                zone: row.ZONE_NAME,
                                agency: row.AGENCY
                            })
                        }
                    })
                    count++
                    if (count % 50 === 0) process.stdout.write('.')
                } catch (e) {
                    // console.error(`\nFailed to insert ${row.STATION_NUMBER}: ${e.message}`)
                }
            }
            console.log(`\nSuccessfully imported ${count} stations.`)
            await prisma.$disconnect()
        })
}

main().catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})
