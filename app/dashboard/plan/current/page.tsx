"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, User, Calendar, MapPin, Check, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlanTable } from "@/components/PlanTable"

export default function CurrentPlanPage() {
    const [planItems, setPlanItems] = useState<any[]>([])
    const [dateRange, setDateRange] = useState<string>("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadPlan() {
            try {
                // Fetch active plan
                const res = await fetch('/api/plans/my')
                if (!res.ok) throw new Error("Failed to fetch")
                const plans = await res.json()

                // Filter all active plans
                const activePlans = plans.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')

                if (activePlans.length > 0) {
                    // API sorts by startDate desc, so [0] is latest
                    const latestPlan = activePlans[0]

                    // Sort items by planDate and order
                    const sortedItems = latestPlan.items.sort((a: any, b: any) => {
                        const dateDiff = new Date(a.planDate).getTime() - new Date(b.planDate).getTime()
                        if (dateDiff !== 0) return dateDiff
                        return a.order - b.order
                    })

                    setPlanItems(sortedItems)

                    // Set Date Range String
                    const start = format(new Date(latestPlan.startDate), "dd-MM-yyyy")
                    const end = format(new Date(latestPlan.endDate), "dd-MM-yyyy")
                    setDateRange(`${start} - ${end}`)

                } else {
                    setPlanItems([])
                }

            } catch (e) {
                toast.error("Failed to load active plan")
            } finally {
                setLoading(false)
            }
        }
        loadPlan()
    }, [])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    if (planItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 pt-10 text-center">
                <h2 className="text-xl font-semibold">No Current Active Plan</h2>
                <p className="text-muted-foreground">You don't have an active field visit plan at the moment.</p>
                <Link href="/dashboard/plan/create">
                    <Button>Create a Plan</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold">My Current Plan</h1>
                    <div className="text-sm text-muted-foreground mt-1">
                        Date: {dateRange}
                    </div>
                </div>
                {/* Export/Print Controls can go here */}
            </div>

            <PlanTable items={planItems} />
        </div>
    )
}
