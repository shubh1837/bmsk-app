"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, User, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"
import { PlanTable } from "@/components/PlanTable"

export default function AllPlansPage() {
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/plans')
            .then(async res => {
                if (!res.ok) throw new Error(await res.text())
                return res.json()
            })
            .then(data => setPlans(data))
            .catch(err => {
                console.error(err)
                // Don't setPlans([]) here to avoid wiping stale data if it's just a transient error, 
                // but for now let's just toast
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold">All Tour Plans</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.id} className="relative overflow-hidden hover:shadow-lg transition-all">
                        <div className={`absolute top-0 left-0 w-1 h-full ${plan.status === 'COMPLETED' ? 'bg-green-500' :
                            plan.status === 'PLANNED' ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <User className="h-3 w-3" />
                                        <div className="font-semibold">{plan.title || `Plan ${plan.id.slice(0, 8)}`}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {format(new Date(plan.startDate), "dd-MM-yyyy")} - {format(new Date(plan.endDate), "dd-MM-yyyy")}
                                    </div>
                                </div>
                                <Badge variant={plan.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                    {plan.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {plan.items?.length || 0} Stations Planned
                                </div>

                                <div className="p-4 pt-0">
                                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Plan Items</h4>
                                    <PlanTable items={plan.items} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {plans.length === 0 && (
                <div className="text-center text-muted-foreground py-10">No plans found.</div>
            )}
        </div>
    )
}
