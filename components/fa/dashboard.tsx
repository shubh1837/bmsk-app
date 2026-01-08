"use client"

import { format } from "date-fns"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Calendar, Wifi, WifiOff, RefreshCw, MapPin, FileText } from "lucide-react"
import { syncMetaData, syncReports } from "@/lib/sync"
import { toast } from "sonner"
import Link from "next/link"

import { useOnlineStatus } from "@/hooks/use-online-status"

import { useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"

export function FADashboard() {
    const router = useRouter()
    const queryResult = useLiveQuery(() => db.reports.where('syncStatus').equals('PENDING').count())
    const pendingCount = (typeof queryResult === 'number') ? queryResult : 0
    const [stats, setStats] = useState({ pending: 0 }) // Keep for other stats if needed, or remove
    const [syncing, setSyncing] = useState(false)
    const [startingTrip, setStartingTrip] = useState(false)
    const isOnline = useOnlineStatus()

    async function handleSync() {
        setSyncing(true)
        toast.info("Syncing started...")
        try {
            await syncMetaData()
            const uploaded = await syncReports()
            toast.success(`Sync complete. Uploaded ${uploaded} reports.`)
        } catch (e) {
            toast.error("Sync failed")
        } finally {
            setSyncing(false)
        }
    }

    const [activePlans, setActivePlans] = useState<any[]>([])
    const [todaysPlan, setTodaysPlan] = useState<any>(null)
    const [fullPlan, setFullPlan] = useState<any>(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/plans/my')
                const plans = await res.json()
                // Get all active plans (not completed/cancelled)
                const active = plans.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
                setActivePlans(active)

                // Find plan for today
                const todayDate = new Date()
                todayDate.setHours(0, 0, 0, 0)

                // Helper to get local YYYY-MM-DD
                const toISO = (d: Date) => {
                    const offset = d.getTimezoneOffset()
                    const local = new Date(d.getTime() - (offset * 60 * 1000))
                    return local.toISOString().split('T')[0]
                }
                const todayStr = toISO(new Date())

                // Find a plan that covers today
                const activePlan = active.find((p: any) => {
                    const start = new Date(p.startDate)
                    const end = new Date(p.endDate)

                    const s = toISO(start)
                    const e = toISO(end)

                    return todayStr >= s && todayStr <= e
                })

                if (activePlan) {
                    setFullPlan(activePlan)

                    // Filter items for today
                    const todayItems = activePlan.items.filter((i: any) => {
                        const itemDate = new Date(i.planDate || activePlan.startDate)
                        return toISO(itemDate) === todayStr
                    })

                    // CONCEPT FIX: If we are in the date range, we should ALWAYS show the plan.
                    // If specific items are scheduled for today, show them.
                    // If NOT (e.g. catch up day, or user is ahead), show ALL unvisited items or just all items.
                    // This creates the "Robustness" requested.
                    const displayItems = todayItems.length > 0 ? todayItems : activePlan.items

                    setTodaysPlan({
                        ...activePlan,
                        items: displayItems,
                        displayMode: todayItems.length > 0 ? 'TODAY' : 'ALL_AVAILABLE', // efficient debugging hint
                        activeTrip: activePlan.activeTrip
                    })
                } else {
                    setTodaysPlan(null)
                    setFullPlan(null)
                }

            } catch (e) { console.error(e) }
        }
        load()
    }, [])

    async function handleStartTrip() {
        if (!todaysPlan) return
        setStartingTrip(true)
        toast.info("Acquiring GPS...")

        if (!navigator.geolocation) {
            toast.error("Geolocation not supported")
            setStartingTrip(false)
            return
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            toast.info("Starting Trip...")
            try {
                const res = await fetch('/api/trip/start', {
                    method: 'POST',
                    body: JSON.stringify({
                        planId: todaysPlan.id,
                        lat: pos.coords.latitude,
                        long: pos.coords.longitude
                    })
                })
                if (res.ok) {
                    toast.success("Trip Started!")
                    router.push('/dashboard/trip/active')
                } else {
                    const msg = await res.text()
                    if (res.status === 400 && msg.includes("already in progress")) {
                        toast.info("Resuming existing trip...")
                        router.push('/dashboard/trip/active')
                    } else {
                        toast.error("Failed start: " + msg)
                        setStartingTrip(false)
                    }
                }
            } catch (e) {
                toast.error("Network error")
                setStartingTrip(false)
            }
        }, (err) => {
            toast.error("GPS Access Denied: " + err.message)
            setStartingTrip(false)
        }, { enableHighAccuracy: true })
    }

    // Daily Progress (User Request: Show only current date plan progress)
    const totalItems = todaysPlan?.items?.length || 0
    const totalVisited = todaysPlan?.items?.filter((i: any) => i.visited).length || 0
    const progressPercent = totalItems > 0 ? (totalVisited / totalItems) * 100 : 0

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Field Assistant Dashboard</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync Data'}
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded text-sm">
                        {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                </div>
            </div>

            {/* Total Plan Progress (Multi-Day) */}
            {fullPlan && (
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between">
                            Current Plan Progress (Total)
                            <span className="text-sm font-normal text-muted-foreground">
                                {format(new Date(fullPlan.startDate), "dd-MM-yyyy")} - {format(new Date(fullPlan.endDate), "dd-MM-yyyy")}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm">
                                <span>Completed: {fullPlan.items.filter((i: any) => i.visited).length} / {fullPlan.items.length} Stations</span>
                                <span className="font-semibold text-purple-600">
                                    {Math.round((fullPlan.items.filter((i: any) => i.visited).length / fullPlan.items.length) * 100)}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500"
                                    style={{ width: `${(fullPlan.items.filter((i: any) => i.visited).length / fullPlan.items.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Daily Tour Plan Progress */}
            {todaysPlan && (
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between">
                            {todaysPlan.displayMode === 'ALL_AVAILABLE' ? 'Available Items (Flexible)' : "Today's Progress"}
                            <span className="text-sm font-normal text-muted-foreground">{format(new Date(), "dd-MM-yyyy")}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm">
                                <span>Completed: {totalVisited} / {totalItems} Stations</span>
                                <span className="font-semibold text-blue-600">{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                Next Station: {todaysPlan.items.find((i: any) => !i.visited)?.stationNumber || 'All Visited Today'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-100">Quick Actions</CardTitle>
                        <Play className="h-4 w-4 text-indigo-100" />
                    </CardHeader>
                    <CardContent>
                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {activePlans.length > 0 ? (
                                todaysPlan ? (
                                    todaysPlan.activeTrip ? (
                                        <Link href="/dashboard/trip/active" className="col-span-2">
                                            <Card className="bg-green-600 text-white hover:bg-green-700 transition-colors h-full border-0">
                                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                    <CardTitle className="text-lg">Active Trip</CardTitle>
                                                    <Play className="h-6 w-6 animate-pulse" />
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm opacity-90">Resume your ongoing journey</p>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ) : (
                                        <div onClick={startingTrip ? undefined : handleStartTrip} className="col-span-2 cursor-pointer">
                                            <Card className={`bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-full ${startingTrip ? 'opacity-70' : ''}`}>
                                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                    <CardTitle className="text-lg">
                                                        {startingTrip ? 'Starting Trip...' : 'Start New Trip'}
                                                    </CardTitle>
                                                    {startingTrip ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6" />}
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm opacity-90">Begin field visit for today</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )
                                ) : (
                                    <Card className="col-span-2 opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-dashed h-full">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-lg text-muted-foreground">No Trip Today</CardTitle>
                                            <Calendar className="h-6 w-6 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">You have plans for other days, but no tour scheduled for today.</p>
                                        </CardContent>
                                    </Card>
                                )
                            ) : (
                                <Link href="/dashboard/plan/create" className="col-span-2">
                                    <Card className="hover:bg-accent transition-colors bg-white/10 border-0 h-full text-white">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-lg">Create Plan</CardTitle>
                                            <MapPin className="h-6 w-6" />
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm opacity-90">Plan upcoming visits</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )}

                            {/* Current Plan Link */}
                            {activePlans.length > 0 ? (
                                <Link href="/dashboard/plan/current" className="col-span-2">
                                    <Card className="hover:bg-black/20 transition-colors bg-white/5 border-0 h-full text-white">
                                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                            <CardTitle className="text-base">Current Plan</CardTitle>
                                            <FileText className="h-5 w-5 opacity-70" />
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs opacity-70">View scheduled stations</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ) : (
                                <Card className="col-span-2 opacity-50 cursor-not-allowed bg-white/5 border-0 h-full text-white">
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                        <CardTitle className="text-base">Current Plan</CardTitle>
                                        <FileText className="h-5 w-5 opacity-70" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs opacity-70">No active plan</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Final Report Link - Only if ALL active plans are complete */}
                            {activePlans.length > 0 && activePlans.every((p: any) => p.items.every((i: any) => i.visited)) && (
                                <Link href="/dashboard/reports/final" className="col-span-2">
                                    <Card className="hover:bg-black/20 transition-colors bg-white/5 border-0 h-full text-white">
                                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                            <CardTitle className="text-base">Final Report</CardTitle>
                                            <FileText className="h-5 w-5 opacity-70" />
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs opacity-70">View travel summary</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )}

                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Offline Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground">Pending reports to sync</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center pt-8">
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive text-xs" onClick={async () => {
                    if (confirm("This will clear all local data and offline reports. Continue?")) {
                        await db.delete()
                        window.location.reload()
                    }
                }}>
                    Reset Local Data (Troubleshoot)
                </Button>
            </div>
        </div >
    )
}
