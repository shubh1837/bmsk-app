"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar, User, Search, Download } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PlanTable } from "@/components/PlanTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InchargePlansPage() {
    const [plans, setPlans] = useState<any[]>([])
    const [fas, setFas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedFaId, setSelectedFaId] = useState<string>("")

    async function loadData() {
        try {
            setLoading(true)
            const [plansRes, fasRes] = await Promise.all([
                fetch('/api/plans'),
                fetch('/api/users/fas')
            ])

            if (plansRes.ok) {
                const plansData = await plansRes.json()
                setPlans(plansData)
            }
            if (fasRes.ok) {
                const fasData = await fasRes.json()
                setFas(fasData)
            }
        } catch (e) {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    // Get Active Plan logic reuse
    // Get Active Plan logic reuse
    const isPlanActive = (p: any) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const start = new Date(p.startDate)
        start.setHours(0, 0, 0, 0)

        const end = new Date(p.endDate)
        end.setHours(0, 0, 0, 0)

        return today >= start && today <= end
    }

    const faPlans = (selectedFaId === 'all'
        ? plans
        : plans.filter(p => p.userId === selectedFaId))
        .filter(p => !isPlanActive(p))
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    // Single Active Plan (for specific FA)
    const activePlan = selectedFaId && selectedFaId !== 'all'
        ? plans.filter(p => p.userId === selectedFaId).find(isPlanActive) || plans.filter(p => p.userId === selectedFaId).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
        : null

    // Multiple Active Plans (for All FAs)
    const allActivePlans = selectedFaId === 'all'
        ? plans.filter(isPlanActive)
        : []

    // Download Plan as Word
    const downloadPlanAsWord = (plan: any) => {
        const userName = plan.user?.name || "Field Assistant"
        const dateRange = `${format(new Date(plan.startDate), "dd-MM-yyyy")} to ${format(new Date(plan.endDate), "dd-MM-yyyy")}`

        const tableRows = plan.items.map((item: any, idx: number) => `
            <tr>
                <td style="border: 1px solid black; padding: 5px;">${idx + 1}</td>
                <td style="border: 1px solid black; padding: 5px;">${format(new Date(item.planDate), "dd-MM-yyyy")}</td>
                <td style="border: 1px solid black; padding: 5px;">${item.station.stationNumber}</td>
                <td style="border: 1px solid black; padding: 5px;">${item.station.stationType}</td>
                <td style="border: 1px solid black; padding: 5px;">${item.station.district || '-'}</td>
                <td style="border: 1px solid black; padding: 5px;">${item.station.block || '-'}</td>
                <td style="border: 1px solid black; padding: 5px;">${item.station.panchayat || '-'}</td>
                <td style="border: 1px solid black; padding: 5px;">${item.station.location || '-'}</td>
                <td style="border: 1px solid black; padding: 5px;">${item.visited ? 'Yes' : 'No'}</td>
            </tr>
        `).join('')

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Plan Export</title></head>
            <body>
                <h2>Tour Plan for ${userName}</h2>
                <p><strong>Date:</strong> ${dateRange}</p>
                <p><strong>Status:</strong> ${plan.status}</p>
                <table style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">S.No</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">Date</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">Station No</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">Type</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">District</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">Block</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">Panchayat</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">Location</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #f0f0f0;">Visited</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `

        const blob = new Blob(['\ufeff', htmlContent], {
            type: 'application/msword'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Plan_${userName}_${dateRange}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold">Field Assistant Plans</h1>
                <p className="text-muted-foreground">Select a Field Assistant to view their plans.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Field Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-sm">
                        <Select onValueChange={setSelectedFaId} value={selectedFaId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Field Assistant..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Field Assistants</SelectItem>
                                {fas.map((fa: any) => (
                                    <SelectItem key={fa.id} value={fa.id}>
                                        {fa.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedFaId ? (
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                        <TabsTrigger value="active">Active Plan{selectedFaId === 'all' ? 's' : ''}</TabsTrigger>
                        <TabsTrigger value="all">All Plans (History)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                        {selectedFaId === 'all' ? (
                            <div className="mt-4 space-y-4">
                                {allActivePlans.length === 0 ? (
                                    <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">No active plans today.</div>
                                ) : (
                                    allActivePlans.map(plan => (
                                        <Card key={plan.id}>
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {plan.user?.name || 'Unknown FA'}
                                                        </CardTitle>
                                                        <CardDescription className="mt-1 flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            {format(new Date(plan.startDate), "dd-MM-yyyy")} - {format(new Date(plan.endDate), "dd-MM-yyyy")}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => downloadPlanAsWord(plan)}>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Word
                                                        </Button>
                                                        <Badge variant={plan.status === 'APPROVED' ? 'default' : 'secondary'}>
                                                            {plan.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="rounded border bg-muted/20">
                                                    <div className="p-4 pt-0 mt-4">
                                                        <PlanTable items={plan.items} />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        ) : activePlan ? (
                            <div className="mt-4 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle>Current Plan Details</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(activePlan.startDate), "dd-MM-yyyy")} - {format(new Date(activePlan.endDate), "dd-MM-yyyy")}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => downloadPlanAsWord(activePlan)}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Word
                                                </Button>
                                                <Badge variant={activePlan.status === 'APPROVED' ? 'default' : 'secondary'}>
                                                    {activePlan.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <PlanTable items={activePlan.items} />
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 mt-4 border rounded-lg border-dashed bg-slate-50 dark:bg-slate-900/50">
                                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground font-medium">No active plan found for this Field Assistant.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="all">
                        <div className="mt-4 space-y-4">
                            {faPlans.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground">No plan history found.</div>
                            ) : (
                                faPlans.map(plan => (
                                    <Card key={plan.id}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    {selectedFaId === 'all' && (
                                                        <CardTitle className="text-base flex items-center gap-2 mb-1">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {plan.user?.name || 'Unknown FA'}
                                                        </CardTitle>
                                                    )}
                                                    <div className="flex items-center gap-2 font-medium text-sm">
                                                        <Calendar className="h-4 w-4" />
                                                        {format(new Date(plan.startDate), "dd-MM-yyyy")} - {format(new Date(plan.endDate), "dd-MM-yyyy")}
                                                    </div>
                                                    <CardDescription className="mt-1">
                                                        {plan.items?.length || 0} Stations Planned
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => downloadPlanAsWord(plan)}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Word
                                                    </Button>
                                                    <Badge variant={plan.status === 'APPROVED' ? 'default' : 'secondary'}>
                                                        {plan.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="rounded border bg-muted/20">
                                                <div className="p-4 pt-0 mt-4">
                                                    <PlanTable items={plan.items} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            ) : null}
        </div>
    )
}
