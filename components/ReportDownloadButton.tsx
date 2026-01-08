"use client"

import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"

export function ReportDownloadButton({ visit, formData, images }: { visit: any, formData: any, images: string[] }) {

    const downloadAsWord = () => {
        const title = `VisitReport_${visit.station.stationNumber}_${new Date(visit.visitDate).toISOString().split('T')[0]}`

        // Theme colors
        const primaryColor = "#2563eb" // Blue-600
        const headerBg = "#eff6ff"     // Blue-50
        const borderColor = "#bfdbfe"  // Blue-200

        // Helper to create a table row
        const row = (label: string, val: any) => `
            <tr>
                <td style="border-bottom: 1px solid ${borderColor}; padding: 8px; width: 40%; color: #64748b; font-size: 11px;">${label}</td>
                <td style="border-bottom: 1px solid ${borderColor}; padding: 8px; font-weight: 600; color: #0f172a; font-size: 12px;">${val || '-'}</td>
            </tr>
        `

        // Destructure data
        const { meta, premises, stationStatus, sensors, lastCalDate, remarks } = formData

        // 1. General Info
        const generalRows = `
            ${row("Field Visit Date", meta?.visitDate ? new Date(meta.visitDate).toLocaleDateString() : '-')}
            ${row("Station Number", meta?.stationNum)}
            ${row("Agency Engineer Name", meta?.staffName)}
            ${row("Engineer Mobile No.", meta?.staffMob)}
        `

        // 2. Premises
        const premisesRows = Object.entries(premises || {}).map(([k, v]) =>
            row(k.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase()), v)
        ).join('')

        // 3. Station Status
        const statusRows = Object.entries(stationStatus || {}).map(([k, v]) =>
            row(k.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase()), v)
        ).join('')

        // 4. Sensors
        const sensorRows = `
            ${sensors?.rainBucket ? row("Rainfall Bucket", sensors.rainBucket) : ''}
            ${sensors?.rainFunnel ? row("Rainfall Funnel", sensors.rainFunnel) : ''}
            ${sensors?.rainLevel ? row("Levelling Bubble", sensors.rainLevel) : ''}
            ${sensors?.rainCalBefore ? row("Rain Calendar (Before)", sensors.rainCalBefore) : ''}
            ${sensors?.rainCalAfter ? row("Rain Calendar (After)", sensors.rainCalAfter) : ''}
            ${sensors?.tempFunc ? row("Air Temp Functioning", sensors.tempFunc) : ''}
            ${sensors?.tempVal ? row("Air Temp Value", sensors.tempVal) : ''}
            ${sensors?.windFunc ? row("Wind Sensor Functioning", sensors.windFunc) : ''}
            ${sensors?.windVal ? row("Wind Sensor Value", sensors.windVal) : ''}
            ${row("Last Calibration Date", lastCalDate)}
        `

        // Images grid (2 columns table for Word stability)
        // Group images into pairs for table rows
        let photoRows = ""
        for (let i = 0; i < images.length; i += 2) {
            photoRows += `
                <tr>
                    <td style="padding: 10px; width: 50%; vertical-align: top;">
                        <div style="border: 1px solid #e2e8f0; padding: 5px; background: #fff; height: 340px; text-align: center;">
                            <img src="${images[i]}" style="width: 100%; height: 100%; object-fit: contain; max-height: 310px;" />
                            <div style="text-align: center; font-size: 10px; color: #64748b; margin-top: 5px;">Photo ${i + 1}</div>
                        </div>
                    </td>
                    ${images[i + 1] ? `
                    <td style="padding: 10px; width: 50%; vertical-align: top;">
                        <div style="border: 1px solid #e2e8f0; padding: 5px; background: #fff; height: 340px; text-align: center;">
                            <img src="${images[i + 1]}" style="width: 100%; height: 100%; object-fit: contain; max-height: 310px;" />
                            <div style="text-align: center; font-size: 10px; color: #64748b; margin-top: 5px;">Photo ${i + 2}</div>
                        </div>
                    </td>
                    ` : '<td style="width: 50%;"></td>'}
                </tr>
            `
        }

        const sectionHeader = (title: string) => `
            <h3 style="background-color: ${headerBg}; color: ${primaryColor}; padding: 10px; border-left: 5px solid ${primaryColor}; font-size: 14px; margin-top: 25px; font-family: 'Segoe UI', Arial, sans-serif;">${title}</h3>
        `

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${title}</title></head>
            <body style="font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #334155;">
                
                <!-- Title Header -->
                <div style="text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: ${primaryColor}; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">Field Visit Inspection Report</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Ref No: ${visit.id}</p>
                </div>

                <!-- Info Grid Table -->
                <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 20px;">
                    <tr>
                        <td style="background: ${headerBg}; padding: 15px; border-radius: 8px; width: 48%; vertical-align: top;">
                            <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 5px;">Station Details</div>
                            <div style="font-size: 16px; font-weight: bold; color: ${primaryColor};">${visit.station.stationNumber}</div>
                            <div style="font-size: 12px; margin-top: 2px;">${visit.station.stationType} Station</div>
                            <div style="font-size: 12px; margin-top: 2px;">${visit.station.district}, ${visit.station.block}</div>
                        </td>
                        <td style="background: ${headerBg}; padding: 15px; border-radius: 8px; width: 48%; vertical-align: top;">
                            <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 5px;">Visit Details</div>
                            <div style="font-size: 14px; color: #0f172a;"><strong>Date:</strong> ${new Date(visit.visitDate).toLocaleDateString()}</div>
                            <div style="font-size: 14px; margin-top: 5px; color: #0f172a;"><strong>Inspected By:</strong> ${visit.trip.user.name}</div>
                        </td>
                    </tr>
                </table>

                ${sectionHeader("General Information")}
                <table style="width: 100%; border-collapse: collapse;">${generalRows}</table>

                ${sectionHeader("Premises & Infrastructure")}
                <table style="width: 100%; border-collapse: collapse;">${premisesRows}</table>

                ${sectionHeader("Station Status")}
                <table style="width: 100%; border-collapse: collapse;">${statusRows}</table>

                ${sectionHeader("Sensor Calibration & Status")}
                <table style="width: 100%; border-collapse: collapse;">${sensorRows}</table>

                ${remarks ? `
                ${sectionHeader("Remarks")}
                <div style="padding: 15px; border: 1px solid ${borderColor}; background: #fff; border-radius: 4px; font-style: italic; color: #475569;">
                    "${remarks}"
                </div>
                ` : ''}

                <br style="page-break-before: always" />

                ${sectionHeader("Site Photographs")}
                <table style="width: 100%; border-collapse: collapse;">
                    ${photoRows}
                </table>
                
            </body>
            </html>
        `

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="flex gap-2">
            <Button onClick={() => window.print()} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Download PDF
            </Button>
            <Button onClick={downloadAsWord} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Word
            </Button>
        </div>
    )
}
