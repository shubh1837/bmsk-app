import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MapPin, ClipboardList, FileText, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function InchargeDashboard() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INCHARGE') {
        redirect('/dashboard') // Or some unauthorized page
    }

    // 1. Fetch Stats
    // Assuming 'inchargeId' on User model links FAs to this Incharge
    const totalFAs = await prisma.user.count({
        where: { inchargeId: session.user.id }
    })

    // Active Trips: Trips with status 'ONGOING' belonging to my FAs
    const activeTrips = await prisma.trip.count({
        where: {
            status: 'ONGOING',
            user: { inchargeId: session.user.id }
        }
    })

    // Pending Plans: Plans that might need attention (for now just count all PLANNED from my FAs)
    const pendingPlans = await prisma.tourPlan.count({
        where: {
            status: 'PLANNED',
            user: { inchargeId: session.user.id }
        }
    })

    // Reports Today: Visits created today by my FAs
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const reportsToday = await prisma.visit.count({
        where: {
            visitDate: { gte: today },
            trip: { user: { inchargeId: session.user.id } }
        }
    })

    // 2. Recent Activity (Last 5 visits)
    const recentVisits = await prisma.visit.findMany({
        where: {
            trip: { user: { inchargeId: session.user.id } }
        },
        orderBy: { visitDate: 'desc' },
        take: 5,
        include: {
            station: true,
            trip: { include: { user: true } }
        }
    })


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your assigned Field Assistants and their activities.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned FAs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFAs}</div>
                        <p className="text-xs text-muted-foreground">Field Assistants under you</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeTrips}</div>
                        <p className="text-xs text-muted-foreground">Currently in the field</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Plans</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingPlans}</div>
                        <p className="text-xs text-muted-foreground">Plans for review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reports Today</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportsToday}</div>
                        <p className="text-xs text-muted-foreground">Submitted today</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Visits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentVisits.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent activity.</p>
                            ) : (
                                recentVisits.map(visit => (
                                    <div key={visit.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {visit.station.stationNumber} - {visit.station.location}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Visited by {visit.trip.user.name}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-sm text-muted-foreground">
                                            {new Date(visit.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Map Placeholder */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/dashboard/incharge/plans">
                            <Button className="w-full justify-start" variant="outline">
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Review Plans
                            </Button>
                        </Link>
                        <Link href="/dashboard/reports">
                            <Button className="w-full justify-start" variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                View All Reports
                            </Button>
                        </Link>
                        <Link href="/dashboard/incharge/assistants">
                            <Button className="w-full justify-start" variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                Manage Field Assistants
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
