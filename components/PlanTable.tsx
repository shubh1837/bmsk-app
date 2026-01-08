
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

interface PlanTableProps {
    items: any[]
}

export function PlanTable({ items }: PlanTableProps) {
    return (
        <div className="rounded-md border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                        <tr>
                            <th className="p-2 font-medium w-12 text-center">S.No</th>
                            <th className="p-2 font-medium whitespace-nowrap">Date</th>
                            <th className="p-2 font-medium">Station Id</th>
                            <th className="p-2 font-medium">District</th>
                            <th className="p-2 font-medium">Block</th>
                            <th className="p-2 font-medium">Panchayat</th>
                            <th className="p-2 font-medium">Type</th>
                            <th className="p-2 font-medium text-center">Dist.</th>
                            <th className="p-2 font-medium">Purpose</th>
                            <th className="p-2 font-medium">Status</th>
                            <th className="p-2 font-medium text-center">Visited</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {items.map((item: any, idx: number) => {
                            const visitDate = new Date(item.planDate)
                            const functionalStatus = item.purpose === "Inspection and Calibration"
                                ? "Functional"
                                : item.purpose === "Faulty Correction"
                                    ? "Non-Func"
                                    : "-"

                            return (
                                <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <td className="p-2 text-center">{idx + 1}</td>
                                    <td className="p-2 whitespace-nowrap">{format(visitDate, "dd-MM-yyyy")}</td>
                                    <td className="p-2 font-medium">{item.station?.stationNumber}</td>
                                    <td className="p-2">{item.station?.district}</td>
                                    <td className="p-2">{item.station?.block}</td>
                                    <td className="p-2">{item.station?.panchayat || "-"}</td>
                                    <td className="p-2">{item.station?.stationType || "-"}</td>
                                    <td className="p-2 text-center">-</td>
                                    <td className="p-2 truncate max-w-[150px]" title={item.purpose}>{item.purpose || "-"}</td>
                                    <td className="p-2">
                                        <Badge variant={functionalStatus === "Functional" ? "default" : functionalStatus === "Non-Func" ? "destructive" : "outline"} className="text-[10px] px-1 py-0 h-5">
                                            {functionalStatus}
                                        </Badge>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            {item.visited ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                            )}
                                            {item.visitId && (
                                                <Link href={`/dashboard/reports/${item.visitId}`}>
                                                    <Button size="icon" variant="ghost" className="h-5 w-5">
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
