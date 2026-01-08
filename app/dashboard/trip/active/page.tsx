"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Camera, CloudRain, Sun, ChevronRight, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ActiveTripPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [plan, setPlan] = useState<any>(null)
    const [selectedType, setSelectedType] = useState<'AWS' | 'ARG' | null>(null)

    useEffect(() => {
        async function loadPlan() {
            try {
                // Fetch active plan
                const res = await fetch('/api/plans/my')
                const plans = await res.json()

                // 1. Prioritize plan with ongoing trip
                let targetPlan = plans.find((p: any) => p.activeTrip && p.activeTrip.status === 'ONGOING')

                // 2. If no ongoing trip, find plan for TODAY
                if (!targetPlan) {
                    const todayStr = new Date().toISOString().split('T')[0]
                    targetPlan = plans.find((p: any) =>
                        new Date(p.date).toISOString().split('T')[0] === todayStr &&
                        p.status !== 'COMPLETED' &&
                        p.status !== 'CANCELLED'
                    )
                }

                // 3. Fallback: If literally no plan for today and no active trip, 
                // maybe show the *next* upcoming plan? Or just stay null (user sees "No Active Trip")
                // For now, let's keep it specific to Today or Active to avoid confusion.

                // 4. IMPORTANT: Filter items to ONLY show stations for TODAY
                if (targetPlan) {
                    const todayStr = format(new Date(), "yyyy-MM-dd")
                    targetPlan.items = targetPlan.items.filter((i: any) => {
                        if (!i.planDate) return true // Show if no specific date
                        return format(new Date(i.planDate), "yyyy-MM-dd") === todayStr
                    })
                }

                setPlan(targetPlan || null)
            } catch (e) {
                toast.error("Failed to load active plan")
            } finally {
                setLoading(false)
            }
        }
        loadPlan()
    }, [])

    if (loading) return <div>Loading trip details...</div>

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 pt-10">
                <h2 className="text-xl font-semibold">No Active Trip Found</h2>
                <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>
        )
    }

    const awsStations = plan.items.filter((i: any) => i.station.stationType === 'AWS')
    const argStations = plan.items.filter((i: any) => i.station.stationType === 'ARG')

    async function startTrip() {
        if (!confirm("Start the trip? This will enable station visits.")) return
        setLoading(true)
        try {
            // Get location (Timeout after 5s, if fails, proceed with 0,0)
            navigator.geolocation.getCurrentPosition(async (pos) => {
                await submitStartTrip(pos.coords.latitude, pos.coords.longitude)
            }, async (err) => {
                toast.warning("Location not available. Starting with default coordinates.")
                await submitStartTrip(0, 0)
            }, { timeout: 5000, enableHighAccuracy: true })
        } catch (e) { setLoading(false) }
    }

    async function submitStartTrip(lat: number, long: number) {
        const res = await fetch('/api/trip/start', {
            method: 'POST',
            body: JSON.stringify({
                planId: plan.id,
                lat,
                long
            })
        })
        if (res.ok) {
            toast.success("Trip Started!")
            const updated = { ...plan, activeTrip: { status: 'ONGOING' } }
            setPlan(updated)
        } else {
            toast.error("Failed to start trip")
        }
        setLoading(false)
    }

    async function endTrip() {
        if (!confirm("Are you sure you want to end this trip?")) return
        const res = await fetch('/api/plans/complete', { method: 'POST', body: JSON.stringify({}) }) // Re-using the logic we put in complete/route.ts
        if (res.ok) {
            router.push('/dashboard')
            toast.success("Trip ended successfully")
        } else {
            toast.error("Failed to end trip")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Active Trip</h2>
                    <p className="text-muted-foreground">
                        {format(new Date(plan.startDate), "dd-MM-yyyy")} - {format(new Date(plan.endDate), "dd-MM-yyyy")}
                    </p>
                    {plan.activeTrip && <Badge className="mt-1 bg-green-500">ONGOING</Badge>}
                </div>
                {!plan.activeTrip ? (
                    <Button onClick={startTrip} size="lg" className="bg-green-600 hover:bg-green-700">Start Activity</Button>
                ) : (
                    <Button variant="destructive" onClick={endTrip}>End Trip</Button>
                )}
            </div>

            {/* Main Category Selection */}
            {!selectedType && (
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                    <Card
                        className="cursor-pointer hover:border-blue-500 transition-all group"
                        onClick={() => setSelectedType('AWS')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-3xl text-blue-600">AWS</CardTitle>
                            <Sun className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-medium">{awsStations.filter((s: any) => !s.visited).length} Pending</div>
                            <p className="text-sm text-muted-foreground">Automatic Weather Stations</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer hover:border-teal-500 transition-all group"
                        onClick={() => setSelectedType('ARG')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-3xl text-teal-600">ARG</CardTitle>
                            <CloudRain className="h-8 w-8 text-teal-500 group-hover:scale-110 transition-transform" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-medium">{argStations.filter((s: any) => !s.visited).length} Pending</div>
                            <p className="text-sm text-muted-foreground">Automatic Rain Gauge</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Station List for Selected Type */}
            {selectedType && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground" onClick={() => setSelectedType(null)}>
                            Categories
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{selectedType} Stations</span>
                    </div>

                    {(selectedType === 'AWS' ? awsStations : argStations).length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground bg-slate-50 rounded-lg">
                            No {selectedType} stations in this plan.
                        </div>
                    ) : (
                        (selectedType === 'AWS' ? awsStations : argStations).map((item: any) => (
                            <Card key={item.id} className={item.visited ? "opacity-60 bg-slate-50" : ""}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        {item.visited ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <MapPin className="h-5 w-5 text-primary" />
                                        )}
                                        <div>
                                            <div className="font-semibold">{item.station.stationNumber}</div>
                                            <div className="text-sm text-muted-foreground">{item.station.district}, {item.station.block}</div>
                                        </div>
                                    </div>

                                    {!item.visited && plan.activeTrip && (
                                        <Link href={`/dashboard/visit/${selectedType!.toLowerCase()}/${item.station.id}`}>
                                            <Button size="sm">
                                                Visit <Camera className="ml-2 h-3 w-3" />
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
