"use client"

import { format } from "date-fns"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Printer } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface ReportRow {
    id: string
    date: string
    district: string
    stationId: string
    stationType: string
    block: string
    panchayat: string
    distance: number
    purpose: string
    status: string
    faName: string
}

interface User {
    id: string
    name: string
}

export default function FinalReportPage() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    // Optional initial userId from URL
    const initialUserId = searchParams.get('userId')

    const [data, setData] = useState<ReportRow[]>([])
    const [loading, setLoading] = useState(true)

    // FA Filter
    const [fas, setFas] = useState<User[]>([])
    const [selectedFa, setSelectedFa] = useState<string>(initialUserId || "All")

    // Fetch FAs (only for Incharge/Admin)
    useEffect(() => {
        if (session?.user.role === 'INCHARGE' || session?.user.role === 'ADMIN') {
            fetch('/api/users/fas')
                .then(res => res.json())
                .then(setFas)
                .catch(console.error)
        }
    }, [session])

    // FA Protection: Check if task is complete
    useEffect(() => {
        if (session?.user.role !== 'FIELD_ASSISTANT') return

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/plans/my')
                const plans = await res.json()
                const activePlans = plans.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')

                // If there are active plans AND they are NOT all visited, deny access
                const incomplete = activePlans.some((p: any) => p.items?.some((i: any) => !i.visited))

                if (incomplete) {
                    toast.error("You must complete your active tour plan first.")
                    // Use window.location for hard redirect or router.push
                    window.location.href = "/dashboard"
                }
            } catch (e) { console.error(e) }
        }
        checkStatus()
    }, [session])

    useEffect(() => {
        async function fetchReport() {
            setLoading(true)
            try {
                let query = ''
                if (selectedFa && selectedFa !== "All") {
                    query = `?userId=${selectedFa}`
                }

                const res = await fetch(`/api/reports/final${query}`)
                if (!res.ok) throw new Error("Failed to load")
                const json = await res.json()
                setData(json)
            } catch (e) {
                toast.error("Failed to load report data")
            } finally {
                setLoading(false)
            }
        }
        fetchReport()
    }, [selectedFa])

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto print:max-w-none print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Final Tour Report</h2>
                    {/* FA Filter Dropdown */}
                    {(session?.user.role === 'INCHARGE' || session?.user.role === 'ADMIN') && (
                        <Select value={selectedFa} onValueChange={setSelectedFa}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by FA" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-950">
                                <SelectItem value="All">All Field Assistants</SelectItem>
                                {fas.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print / PDF
                </Button>
            </div>

            <Card className="print:border-0 print:shadow-none">
                <CardHeader className="print:hidden">
                    <CardTitle>Visit Summary Table</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 print:p-0">
                    <div className="rounded-md border print:border-2 border-black">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900 print:bg-gray-100">
                                    <TableHead className="w-[50px] font-bold text-black border-r border-b">S.No</TableHead>
                                    <TableHead className="font-bold text-black border-r border-b">Date</TableHead>
                                    <TableHead className="font-bold text-black border-r border-b">Station ID</TableHead>
                                    <TableHead className="font-bold text-black border-r border-b">District</TableHead>
                                    <TableHead className="font-bold text-black border-r border-b">Block</TableHead>
                                    <TableHead className="font-bold text-black border-r border-b">Panchayat</TableHead>
                                    <TableHead className="font-bold text-black border-r border-b">Station Type</TableHead>
                                    <TableHead className="font-bold text-black border-r border-b">Dist. (Km)</TableHead>
                                    <TableHead className="font-bold text-black border-r border-b">Purpose</TableHead>
                                    <TableHead className="font-bold text-black border-b">Func. Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-10">No records found</TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((row, idx) => (
                                        <TableRow key={row.id} className="border-b border-black/10">
                                            <TableCell className="border-r border-black/10">{idx + 1}</TableCell>
                                            <TableCell className="border-r border-black/10">{format(new Date(row.date), "dd-MM-yyyy")}</TableCell>
                                            <TableCell className="border-r border-black/10 font-medium">{row.stationId}</TableCell>
                                            <TableCell className="border-r border-black/10">{row.district}</TableCell>
                                            <TableCell className="border-r border-black/10">{row.block}</TableCell>
                                            <TableCell className="border-r border-black/10">{row.panchayat}</TableCell>
                                            <TableCell className="border-r border-black/10">{row.stationType}</TableCell>
                                            <TableCell className="border-r border-black/10">{row.distance ? row.distance.toFixed(1) : '-'}</TableCell>
                                            <TableCell className="border-r border-black/10">{row.purpose}</TableCell>
                                            <TableCell>
                                                <span className={row.status.startsWith('Partially') ? 'text-red-600 font-medium' : 'text-green-600'}>
                                                    {row.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-8 hidden print:block pt-10">
                        <div className="flex justify-between px-10">
                            <div className="text-center">
                                <div className="h-16"></div>
                                <div className="border-t border-black w-48 mx-auto"></div>
                                <p className="font-bold mt-1">Signature of FA</p>
                            </div>
                            <div className="text-center">
                                <div className="h-16"></div>
                                <div className="border-t border-black w-48 mx-auto"></div>
                                <p className="font-bold mt-1">Signature of Incharge</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
