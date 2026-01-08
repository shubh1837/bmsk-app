import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { FileText, Eye } from "lucide-react"
import Link from "next/link"

export default async function ReportsPage() {
    const session = await getServerSession(authOptions)
    if (!session) return <div>Unauthorized</div>

    // Admin/Incharge sees many, FA sees own.
    // Logic: 
    // FA -> own visits
    // Incharge -> visits of FAs assigned to them
    // Admin -> all

    // Current Prisma schema: User has inchargeId.
    // Visit -> Trip -> User

    let whereClause = {}
    if (session.user.role === 'FIELD_ASSISTANT') {
        whereClause = { trip: { userId: session.user.id } }
    } else if (session.user.role === 'INCHARGE') {
        // Find distinct users assigned to this incharge
        // Easier query: visits where trip.user.inchargeId = me
        whereClause = { trip: { user: { inchargeId: session.user.id } } }
    }
    // Admin defaults to empty (all)

    const visits = await prisma.visit.findMany({
        where: whereClause,
        include: {
            station: true,
            trip: {
                include: { user: true }
            }
        },
        orderBy: { visitDate: 'desc' }
    })

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Field Visit Reports</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Completed Visits</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Station</TableHead>
                                <TableHead>Field Assistant</TableHead>
                                <TableHead>Photos</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visits.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">No reports found.</TableCell></TableRow>
                            ) : visits.map((visit) => {
                                const photoCount = JSON.parse(visit.images || "[]").length
                                return (
                                    <TableRow key={visit.id}>
                                        <TableCell>{format(new Date(visit.visitDate), "dd-MM-yyyy")}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{visit.station.stationNumber}</div>
                                            <div className="text-xs text-muted-foreground">{visit.station.district}</div>
                                        </TableCell>
                                        <TableCell>{visit.trip.user.name}</TableCell>
                                        <TableCell>{photoCount}</TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/reports/${visit.id}`}>
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="w-4 h-4 mr-2" /> View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
