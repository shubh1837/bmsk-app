
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const csvPath = path.join(__dirname, '..', '..', 'BMSK_Master_Station_list.csv');
    console.log(`Reading CSV from ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found!");
        process.exit(1);
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // Map headers to indices
    const idxStationNum = headers.indexOf('STATION_NUMBER');
    const idxVendorName = headers.indexOf('Vendor_Engineer_Name');
    const idxLastDate = headers.indexOf('Last_Visited_Date');

    console.log(`Indices: Station=${idxStationNum}, Vendor=${idxVendorName}, Date=${idxLastDate}`);

    if (idxStationNum === -1) {
        console.error("STATION_NUMBER column not found");
        process.exit(1);
    }

    let updatedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing handling commas in quotes if any (not expected in this simple CSV but good practice?)
        // For now simple split by comma is likely enough based on sample
        const cols = line.split(',');

        const stationNum = cols[idxStationNum]?.trim();
        const vendorName = idxVendorName !== -1 ? cols[idxVendorName]?.trim() : null;
        const lastDateStr = idxLastDate !== -1 ? cols[idxLastDate]?.trim() : null;

        if (!stationNum) continue;

        const updateData = {};
        if (vendorName) updateData.vendorEngineerName = vendorName;

        if (lastDateStr) {
            // DD-MM-YYYY to Date
            const parts = lastDateStr.split('-');
            if (parts.length === 3) {
                // new Date(yyyy, mm-1, dd)
                const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (!isNaN(d.getTime())) {
                    updateData.lastVisitedDate = d;
                }
            }
        }

        if (Object.keys(updateData).length > 0) {
            try {
                // Find station first
                const station = await prisma.station.findUnique({
                    where: { stationNumber: stationNum }
                });

                if (station) {
                    await prisma.station.update({
                        where: { id: station.id },
                        data: updateData
                    });
                    updatedCount++;
                    // process.stdout.write('.');
                }
            } catch (e) {
                console.error(`Failed to update station ${stationNum}: ${e.message}`);
            }
        }
    }

    console.log(`\nUpdated ${updatedCount} stations.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
