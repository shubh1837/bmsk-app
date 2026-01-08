import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { ReportDownloadButton } from "@/components/ReportDownloadButton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

// Helper for displaying key-value pairs cleanly
function InfoRow({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) {
    if (value === undefined || value === null || value === "") return null
    return (
        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className={`font-medium text-sm text-right ${highlight ? "text-primary" : ""}`}>{String(value)}</span>
        </div>
    )
}

function SectionHeader({ title }: { title: string }) {
    return <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary">{title}</h3>
}

export default async function ReportDetailPage({ params }: { params: Promise<{ visitId: string }> }) {
    const { visitId } = await params
    const session = await getServerSession(authOptions)
    if (!session) return <div>Unauthorized</div>

    const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        include: { station: true, trip: { include: { user: true } } }
    })

    if (!visit) return <div>Report not found</div>

    const formData = JSON.parse(visit.formData)
    const images = JSON.parse(visit.images) as string[]

    const { meta, premises, stationStatus, sensors, lastCalDate, remarks } = formData

    return (
        <div className="space-y-6 max-w-5xl mx-auto print:p-0 print:max-w-none pb-20">
            {/* Header Actions */}
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-2xl font-bold">Visit Report</h2>
                    <p className="text-sm text-muted-foreground">ID: {visit.id}</p>
                </div>
                <div className="flex gap-2">
                    <ReportDownloadButton visit={visit} formData={formData} images={images} />
                </div>
            </div>

            {/* Main Report Card */}
            <Card className="print:border-0 print:shadow-none bg-white dark:bg-black overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b print:border-b-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl text-primary">Field Visit Inspection Report</CardTitle>
                            <div className="mt-2 text-sm space-y-1">
                                <p><span className="font-semibold">Station:</span> {visit.station.stationNumber} ({visit.station.stationType})</p>
                                <p><span className="font-semibold">Location:</span> {visit.station.district}, {visit.station.block}</p>
                            </div>
                        </div>
                        <div className="text-right text-sm space-y-1">
                            <div><Badge variant="outline" className="text-base">{format(new Date(visit.visitDate), "dd MMM yyyy")}</Badge></div>
                            <div><span className="text-muted-foreground">Inspected By:</span> <span className="font-medium">{visit.trip.user.name}</span></div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* 0. General Information */}
                        <div>
                            <SectionHeader title="General Information" />
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-1">
                                <InfoRow label="Field Visit Date" value={meta?.visitDate ? format(new Date(meta.visitDate), "dd-MM-yyyy") : null} />
                                <InfoRow label="Station Number" value={meta?.stationNum} />
                                <InfoRow label="Agency Engineer Name" value={meta?.staffName} />
                                <InfoRow label="Engineer Mobile No." value={meta?.staffMob} />
                            </div>
                        </div>

                        {/* 1. General & Premises */}
                        <div>
                            <SectionHeader title="Premises & Infrastructure" />
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-1">
                                <InfoRow label="Premises Type" value={premises?.premisesOn} />
                                <InfoRow label="Condition" value={premises?.premisesCond} />
                                <InfoRow label="Installation" value={premises?.installedPos} />
                                <InfoRow label="Fencing" value={premises?.fencing} />
                                <InfoRow label="Fencing Cond." value={premises?.fencingCond} />
                                <InfoRow label="Gate Locked" value={premises?.gateLock} />
                                <InfoRow label="Painting" value={premises?.painting} />
                                <InfoRow label="Sign Board" value={premises?.signBoard} />
                                <InfoRow label="Surface Cond." value={premises?.surfaceCond} />
                                <InfoRow label="Exposure" value={premises?.exposureCond} />
                            </div>
                        </div>

                        {/* 3. Station Status */}
                        <div>
                            <SectionHeader title="Station Status" />
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-1">
                                <InfoRow label="Civil Work" value={stationStatus?.civilWork} />
                                <InfoRow label="Solar Panel" value={stationStatus?.solarPanel} highlight={stationStatus?.solarPanel !== 'Good'} />
                                <InfoRow label="Data Logger Presence" value={stationStatus?.dlPresence} />
                                <InfoRow label="Data Logger Box" value={stationStatus?.dlBoxAppear} />
                                <InfoRow label="Box Condition" value={stationStatus?.dlBoxCond} />
                                <InfoRow label="Battery" value={stationStatus?.battPresence} />
                                <InfoRow label="SIM Provider" value={stationStatus?.simProvider} />
                                <InfoRow label="Signal Strength" value={stationStatus?.signalStrength} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* 4. Sensors */}
                        <div>
                            <SectionHeader title="Sensor Calibration & Status" />
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">

                                {/* Rainfall */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Rainfall Sensor</h4>
                                    <div className="space-y-1">
                                        <InfoRow label="Bucket" value={sensors?.rainBucket} />
                                        <InfoRow label="Funnel" value={sensors?.rainFunnel} />
                                        <InfoRow label="Level" value={sensors?.rainLevel} />
                                        <InfoRow label="Calibration (Before)" value={sensors?.rainCalBefore ? `${sensors.rainCalBefore} ml` : null} />
                                        <InfoRow label="Calibration (After)" value={sensors?.rainCalAfter ? `${sensors.rainCalAfter} ml` : null} highlight />
                                    </div>
                                </div>

                                {/* Air Temp (AWS Only) */}
                                {sensors?.tempFunc && (
                                    <div>
                                        <Separator className="my-2" />
                                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Air Temperature</h4>
                                        <div className="space-y-1">
                                            <InfoRow label="Functioning" value={sensors?.tempFunc} />
                                            <InfoRow label="Screen" value={sensors?.tempScreen} />
                                            {sensors?.tempVal && <InfoRow label="Value" value={sensors?.tempVal} />}
                                            {sensors?.tempFault && <InfoRow label="Fault" value={sensors?.tempFault} highlight />}
                                        </div>
                                    </div>
                                )}

                                {/* Wind (AWS Only) */}
                                {sensors?.windFunc && (
                                    <div>
                                        <Separator className="my-2" />
                                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Wind Sensor</h4>
                                        <div className="space-y-1">
                                            <InfoRow label="Functioning" value={sensors?.windFunc} />
                                            {sensors?.windVal && <InfoRow label="Value" value={sensors?.windVal} />}
                                            {sensors?.windFault && <InfoRow label="Fault" value={sensors?.windFault} highlight />}
                                        </div>
                                    </div>
                                )}

                                {/* Last Calibration */}
                                <div className="pt-2">
                                    <InfoRow label="Last Calibration Date" value={lastCalDate ? format(new Date(lastCalDate), "dd-MM-yyyy") : "N/A"} />
                                </div>

                            </div>
                        </div>

                        {/* Remarks */}
                        {remarks && (
                            <div>
                                <SectionHeader title="Remarks" />
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded p-4 text-sm italic">
                                    "{remarks}"
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>

                {/* Footer / Photos */}
                <div className="p-6 border-t bg-slate-50/50 dark:bg-slate-900/50 page-break-avoid">
                    <SectionHeader title="Site Photographs" />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {images.map((url, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-800 shadow-sm group">
                                <div className="aspect-[3/4] relative flex items-center justify-center">
                                    <img
                                        src={url}
                                        alt={`Site photo ${idx + 1}`}
                                        className="object-contain w-full h-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Signature Section (Print Only) */}
                <div className="hidden print:flex justify-between mt-12 p-12 pt-0">
                    <div className="text-center">
                        <div className="w-48 h-px bg-black mb-2"></div>
                        <p className="text-sm font-semibold">Signature of Field Assistant</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 h-px bg-black mb-2"></div>
                        <p className="text-sm font-semibold">Signature of Incharge</p>
                    </div>
                </div>

            </Card>
        </div>
    )
}
