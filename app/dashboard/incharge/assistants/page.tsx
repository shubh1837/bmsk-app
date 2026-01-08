import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User as UserIcon, MapPin, Phone, Mail } from "lucide-react"

export default async function FAManagementPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'INCHARGE') return <div>Unauthorized</div>

    const fas = await prisma.user.findMany({
        where: { inchargeId: session.user.id },
        include: {
            trips: {
                where: { status: 'ONGOING' },
                take: 1
            },
            _count: {
                select: { trips: true, tourPlans: true }
            }
        }
    })

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold">My Field Assistants</h1>
                <p className="text-muted-foreground">Manage and monitor your assigned team.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fas.map(fa => {
                    const activeTrip = fa.trips[0]
                    return (
                        <Card key={fa.id}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{fa.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>{fa.name}</CardTitle>
                                    <CardDescription>{fa.email}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Status:</span>
                                    {activeTrip ? (
                                        <Badge className="bg-green-500 hover:bg-green-600">Active Trip</Badge>
                                    ) : (
                                        <Badge variant="outline">Idle</Badge>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Trips:</span>
                                    <span>{fa._count.trips}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Plans Created:</span>
                                    <span>{fa._count.tourPlans}</span>
                                </div>

                                <div className="pt-2">
                                    <Button className="w-full" variant="secondary" disabled>
                                        view Details (Coming Soon)
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {fas.length === 0 && (
                    <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg">
                        <UserIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No Field Assistants Assigned</h3>
                        <p className="text-muted-foreground mt-1">Contact Admin to assign members to your team.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
