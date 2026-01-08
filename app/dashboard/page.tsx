import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, MapPin } from "lucide-react"
import prisma from "@/lib/prisma"
import { UserManagement } from "@/components/admin/user-management"
import { FADashboard } from "@/components/fa/dashboard"
import { InchargeDashboard } from "@/components/incharge/dashboard"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session) redirect("/login")

    const role = session.user.role

    // Role-based Stats/Links

    if (role === 'ADMIN') {
        const userCount = await prisma.user.count()
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userCount}</div>
                        </CardContent>
                    </Card>
                </div>
                {/* User Management Component Inject Here */}
                <UserManagement />
            </div>
        )
    }

    if (role === 'FIELD_ASSISTANT') {
        return <FADashboard />
    }

    if (role === 'INCHARGE') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const totalFA = await prisma.user.count({
            where: { inchargeId: session.user.id }
        })

        const activePlans = await prisma.tourPlan.count({
            where: {
                user: { inchargeId: session.user.id },
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            }
        })

        const reportsToday = await prisma.visit.count({
            where: {
                trip: { user: { inchargeId: session.user.id } },
                visitDate: { gte: today }
            }
        })

        return <InchargeDashboard stats={{ totalFA, activePlans, reportsToday }} />
    }

    return (
        <div>
            <h2 className="text-2xl font-bold">Welcome, {session.user.name}</h2>
            <p className="text-muted-foreground">Logged in as {role}</p>
        </div>
    )
}
