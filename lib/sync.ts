import { db, LocalStation, LocalTourPlan } from "./db";
import { toast } from "sonner";

export async function syncMetaData() {
    try {
        // Fetch Stations
        const sRes = await fetch('/api/stations');
        if (sRes.ok) {
            const stations: LocalStation[] = await sRes.json();
            await db.stations.clear(); // Simple replace strategy for master data
            await db.stations.bulkPut(stations);
            console.log(`Synced ${stations.length} stations`);
        }

        // Fetch My Plans
        const pRes = await fetch('/api/plans/my'); // User specific
        if (pRes.ok) {
            const plans = await pRes.json();
            // Merge strategy: Update existing by ID, add new. Dont delete local creations yet?
            // For simplicity: Replace server-sourced plans.
            // In a real app, we need careful merging if PLANS are editable offline.
            // Assumption: Plans are created ONLINE mostly, or we treat offline creation separately.

            // For now, let's just create a Plan offline and sync it up.
            // But here we are downloading assigned plans.
            await db.plans.bulkPut(plans);
        }

        return true;
    } catch (e) {
        console.error("Sync Meta Error", e);
        return false;
    }
}

export async function syncReports() {
    const pending = await db.reports.where('syncStatus').equals('PENDING').toArray();
    if (pending.length === 0) return 0;

    let successCount = 0;

    for (const report of pending) {
        try {
            // Upload images first? Or send as multipart?
            // Lets simplify and send JSON with Base64 for now, or use a separate upload endpoint
            // For Robustness: Upload images 1-by-1, get URLs, then submit report.

            const imageUrls: string[] = [];

            if (report.images && report.images.length > 0) {
                const formData = new FormData();
                report.images.forEach((img, idx) => {
                    formData.append(`file_${idx}`, img.blob);
                    formData.append(`meta_${idx}`, JSON.stringify({ lat: img.lat, lng: img.lng, time: img.timestamp }));
                });

                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error("Image Upload Failed");
                const uploadData = await uploadRes.json();
                imageUrls.push(...uploadData.urls);
            }

            const payload = {
                stationId: report.stationId,
                visitDate: report.visitDate,
                formData: report.formData,
                images: imageUrls,
                tripId: report.tripId,
                latitude: report.images && report.images[0] ? report.images[0].lat : 0,
                longitude: report.images && report.images[0] ? report.images[0].lng : 0
            };

            const rRes = await fetch('/api/visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (rRes.ok) {
                await db.reports.update(report.id!, { syncStatus: 'SYNCED' });
                successCount++;
            }
        } catch (e) {
            console.error("Report Sync Error", e);
        }
    }

    return successCount;
}
