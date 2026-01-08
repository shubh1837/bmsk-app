"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, ArrowRight, RefreshCw, GripVertical, Check, Trash2, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { db, LocalStation } from "@/lib/db"
import { orderByDistance } from "geolib"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

export default function CreatePlanPage() {
    const router = useRouter()
    const [stations, setStations] = useState<LocalStation[]>([])

    // Staging State: activeDate -> List of Stations
    const [stagedPlans, setStagedPlans] = useState<Record<string, LocalStation[]>>({})
    const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]) // Default Today

    // Stations currently being edited for activeDate
    const [selected, setSelected] = useState<LocalStation[]>([])

    // Filters
    const [filterDistrict, setFilterDistrict] = useState("All")
    const [filterBlock, setFilterBlock] = useState("All")
    const [filterType, setFilterType] = useState("All")
    const [search, setSearch] = useState("")

    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)

    // Sync selected with stagedPlans when activeDate changes
    useEffect(() => {
        if (stagedPlans[activeDate]) {
            setSelected([...stagedPlans[activeDate]])
        } else {
            setSelected([])
        }
    }, [activeDate]) // When date changes, load that day's plan

    // Helper to normalize case
    const toTitleCase = (str: string) => {
        return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    // Derived Lists for Dropdowns
    const districts = useMemo(() => {
        const d = new Set(stations.map(s => s.district).filter(Boolean).map(s => toTitleCase(s)))
        return Array.from(d).sort()
    }, [stations])

    const blocks = useMemo(() => {
        let s = stations
        if (filterDistrict !== "All") {
            s = s.filter(st => toTitleCase(st.district) === filterDistrict)
        }
        const b = new Set(s.map(st => st.block).filter(Boolean).map(s => toTitleCase(s)))
        return Array.from(b).sort()
    }, [stations, filterDistrict])

    const types = useMemo(() => {
        const t = new Set(stations.map(s => s.stationType).filter(Boolean).map(s => s.toUpperCase()))
        return Array.from(t).sort()
    }, [stations])

    // Fetch implementation
    async function loadStations(force = false) {
        setSyncing(true)
        try {
            let local = await db.stations.toArray()
            if (local.length > 0) setStations(local)

            if (local.length === 0 || force) {
                const res = await fetch('/api/stations')
                if (res.ok) {
                    const remote = await res.json()
                    await db.stations.clear()
                    await db.stations.bulkPut(remote)
                    setStations(remote)
                    toast.success("Station list updated")
                }
            } else {
                fetch('/api/stations').then(async (res) => {
                    if (res.ok) {
                        const remote = await res.json()
                        if (remote.length !== local.length) {
                            await db.stations.clear()
                            await db.stations.bulkPut(remote)
                            setStations(remote)
                            toast.success("Refreshed station list")
                        }
                    }
                })
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to sync stations")
        } finally {
            setSyncing(false)
        }
    }

    useEffect(() => {
        loadStations()
    }, [])

    // Track used stations to remove them from list
    const usedStationIds = useMemo(() => {
        const ids = new Set<string>()
        selected.forEach(s => ids.add(s.id))
        Object.values(stagedPlans).forEach(dayList => {
            dayList.forEach(s => ids.add(s.id))
        })
        return ids
    }, [selected, stagedPlans])

    const filteredStations = useMemo(() => {
        return stations.filter(s => {
            // Filter out already used
            if (usedStationIds.has(s.id)) return false

            const matchesSearch = search === "" ||
                s.stationNumber.toLowerCase().includes(search.toLowerCase()) ||
                (s.location && s.location.toLowerCase().includes(search.toLowerCase()))

            const matchesDistrict = filterDistrict === "All" || toTitleCase(s.district) === filterDistrict
            const matchesBlock = filterBlock === "All" || toTitleCase(s.block) === filterBlock
            const matchesType = filterType === "All" || s.stationType.toUpperCase() === filterType

            return matchesSearch && matchesDistrict && matchesBlock && matchesType
        })
    }, [stations, search, filterDistrict, filterBlock, filterType, usedStationIds])


    // Purpose Selection State
    const [showPurposeDialog, setShowPurposeDialog] = useState(false)
    const [pendingStation, setPendingStation] = useState<LocalStation | null>(null)
    const [visitPurpose, setVisitPurpose] = useState<string>("Inspection and Calibration")

    function toggleSelection(station: LocalStation) {
        // If already selected, remove it
        if (selected.find(s => s.id === station.id)) {
            setSelected(selected.filter(s => s.id !== station.id))
            return
        }

        // If newly selected, ask for purpose
        setPendingStation(station)
        setVisitPurpose("Inspection and Calibration") // Default
        setShowPurposeDialog(true)
    }

    function confirmPurpose() {
        if (!pendingStation) return

        // Add to selected with purpose
        const stationWithPurpose = {
            ...pendingStation,
            purpose: visitPurpose
        }

        setSelected([...selected, stationWithPurpose])
        setShowPurposeDialog(false)
        setPendingStation(null)
    }

    function onDragEnd(result: DropResult) {
        if (!result.destination) return;
        const items = Array.from(selected);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSelected(items);
    }

    // "OK" Button Handler
    function confirmDay() {
        if (selected.length === 0) {
            // If empty, remove the day from plan?
            const newStaged = { ...stagedPlans }
            delete newStaged[activeDate]
            setStagedPlans(newStaged)
            toast.info(`Cleared plan for ${activeDate}`)
            return
        }

        setStagedPlans(prev => ({
            ...prev,
            [activeDate]: selected
        }))
        toast.success(`Plan set for ${activeDate}`)
    }

    async function handleSaveAll() {
        // Collect all days that have items
        const daysToSave = Object.entries(stagedPlans).filter(([_, items]) => items.length > 0)

        // Include current 'selected' if user forgot to click OK? 
        // Logic: if selected has items and they differ from staged, prompt or auto-save?
        // Let's safe-check: if selected > 0, ensure it's in stored
        let finalPlans = { ...stagedPlans }
        if (selected.length > 0) {
            finalPlans[activeDate] = selected
        }

        const payloads = Object.entries(finalPlans).filter(([_, items]) => items.length > 0)

        if (payloads.length === 0) {
            toast.error("No plans to save")
            return
        }

        const cleanupTimestamp = new Date().toISOString()
        setLoading(true)
        try {
            // Find start and end date
            const dates = payloads.map(p => p[0]).sort()
            const startDate = dates[0]
            const endDate = dates[dates.length - 1]

            // Flatten items
            const allItems = payloads.flatMap(([date, items]) =>
                items.map((s, idx) => ({
                    stationId: s.id,
                    planDate: date,
                    order: idx, // Order within the day? Or global? Ideally within day is fine if accompanied by date.
                    purpose: (s as any).purpose || "Inspection and Calibration"
                }))
            )

            const payload = {
                startDate,
                endDate,
                items: allItems,
                cleanupBefore: cleanupTimestamp
            }

            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(`Plan created successfully`)
                router.push('/dashboard')
            } else {
                const msg = await res.text()
                toast.error(`Failed to create plan: ${msg}`)
            }

        } catch (e) {
            toast.error("Error saving plans")
        } finally {
            setLoading(false)
        }
    }

    // DnD Strict Mode Fix
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    if (!enabled) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Create Tour Plan</h2>
                    <Button variant="ghost" size="sm" onClick={() => loadStations(true)} disabled={syncing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        Sync Stations
                    </Button>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-md px-3 border">
                        <span className="text-xs font-medium text-muted-foreground mr-1">Current Date:</span>
                        <Input
                            type="date"
                            value={activeDate}
                            onChange={e => setActiveDate(e.target.value)}
                            className="w-36 h-8 text-sm"
                        />
                    </div>

                    <Button onClick={handleSaveAll} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save All Plans
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 grow overflow-hidden">
                {/* Available Stations (2 cols wide) */}
                <Card className="flex flex-col h-full overflow-hidden lg:col-span-2">
                    <CardHeader className="py-3 px-4 bg-slate-50 dark:bg-slate-900 border-b shrink-0 space-y-3">
                        <div className="flex gap-2">
                            <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="District" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-950 max-h-[300px]">
                                    <SelectItem value="All">All Districts</SelectItem>
                                    {districts.map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterBlock} onValueChange={setFilterBlock} disabled={filterDistrict === 'All'}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Block" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-950 max-h-[300px]">
                                    <SelectItem value="All">All Blocks</SelectItem>
                                    {blocks.map(b => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-950 max-h-[300px]">
                                    <SelectItem value="All">All Types</SelectItem>
                                    {types.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder={`Search ${filteredStations.length} Stations...`}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 grow overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {filteredStations.map(station => {
                                    const isSelected = !!selected.find(s => s.id === station.id)
                                    return (
                                        <div
                                            key={station.id}
                                            className={`flex items-start space-x-3 p-3 rounded border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                                            onClick={() => toggleSelection(station)}
                                        >
                                            <Checkbox checked={isSelected} className="mt-1" />
                                            <div>
                                                <div className="font-medium">{station.stationNumber}</div>
                                                <div className="text-xs text-muted-foreground break-all">{station.location}</div>
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    {station.district} • {station.block}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Selected Stations / Day Stager (1 col wide) */}
                <Card className="flex flex-col h-full overflow-hidden border-2 border-primary/10">
                    <CardHeader className="py-2 px-3 bg-primary/5 border-b shrink-0 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                Planning For:
                            </div>
                            <Input
                                type="date"
                                value={activeDate}
                                onChange={e => setActiveDate(e.target.value)}
                                className="w-32 h-8 text-xs bg-white dark:bg-zinc-900"
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 grow overflow-hidden bg-slate-50/20 flex flex-col">
                        <div className="p-2 bg-yellow-50/50 text-[10px] text-center text-muted-foreground border-b uppercase tracking-wider">
                            {selected.length} Stations Selected
                        </div>

                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="selected-stations">
                                {(provided) => (
                                    <ScrollArea className="flex-1">
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="p-3 space-y-2"
                                        >
                                            {selected.length === 0 && (
                                                <div className="text-center text-muted-foreground py-10 text-sm">
                                                    Select stations from left<br />to add to {activeDate}
                                                </div>
                                            )}
                                            {selected.map((station, idx) => (
                                                <Draggable key={station.id} draggableId={station.id} index={idx}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="flex flex-col p-2 rounded border bg-background shadow-sm group relative"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <div {...provided.dragHandleProps} className="text-muted-foreground cursor-grab">
                                                                        <GripVertical className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <div className="truncate text-sm font-medium">
                                                                        {station.stationNumber}
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 absolute right-2 top-2" onClick={() => toggleSelection(station)}>
                                                                    <Trash2 className="w-3 h-3 text-red-500" />
                                                                </Button>
                                                            </div>
                                                            {(station as any).purpose && (
                                                                <div className="mt-1 ml-9 text-[10px] text-blue-600 font-medium">
                                                                    {(station as any).purpose}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </ScrollArea>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <div className="p-3 border-t bg-white dark:bg-zinc-900 shrink-0">
                            <Button className="w-full" size="sm" onClick={confirmDay} variant={selected.length > 0 ? "default" : "secondary"}>
                                <Check className="w-4 h-4 mr-2" />
                                {stagedPlans[activeDate] ? "Update Day" : "Confirm Day"}
                            </Button>
                        </div>

                        {/* Mini Summary of other days */}
                        <div className="max-h-[150px] overflow-y-auto border-t bg-slate-50 dark:bg-slate-950 p-2">
                            <div className="text-[10px] font-semibold text-muted-foreground mb-2 px-1">STAGED DAYS</div>
                            {Object.entries(stagedPlans).length === 0 && (
                                <div className="text-[10px] text-muted-foreground text-center py-2">No days confirmed yet</div>
                            )}
                            {Object.entries(stagedPlans).map(([date, items]) => (
                                <div
                                    key={date}
                                    className={`flex justify-between items-center p-2 rounded mb-1 text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 ${date === activeDate ? 'bg-primary/10 border border-primary/20' : 'bg-white border'}`}
                                    onClick={() => setActiveDate(date)}
                                >
                                    <span className="font-medium">{date}</span>
                                    <span className="bg-slate-200 dark:bg-slate-800 px-1.5 rounded-full">{items.length}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Purpose Selection Dialog */}
            {showPurposeDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg w-[400px] space-y-4">
                        <h3 className="text-lg font-semibold">Purpose of Visit</h3>
                        <p className="text-sm text-muted-foreground">Select the purpose for visiting {pendingStation?.stationNumber}</p>

                        <div className="space-y-2">
                            <div
                                className={`p-3 rounded border cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between ${visitPurpose === "Inspection and Calibration" ? 'border-primary bg-primary/5' : ''}`}
                                onClick={() => setVisitPurpose("Inspection and Calibration")}
                            >
                                <span className="text-sm font-medium">Inspection and Calibration</span>
                                {visitPurpose === "Inspection and Calibration" && <Check className="w-4 h-4 text-primary" />}
                            </div>
                            <div
                                className={`p-3 rounded border cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between ${visitPurpose === "Faulty Correction" ? 'border-primary bg-primary/5' : ''}`}
                                onClick={() => setVisitPurpose("Faulty Correction")}
                            >
                                <span className="text-sm font-medium">Faulty Correction</span>
                                {visitPurpose === "Faulty Correction" && <Check className="w-4 h-4 text-primary" />}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => {
                                setShowPurposeDialog(false)
                                setPendingStation(null)
                            }}>Cancel</Button>
                            <Button onClick={confirmPurpose}>Confirm</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
