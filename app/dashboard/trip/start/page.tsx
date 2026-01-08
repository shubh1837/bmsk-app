"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Play, Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"
// import { db } from "@/lib/db" // We might store trip locally first
// But for "Start Trip" we usually want server to know.
// If offline, store locally.

export default function StartTripPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [status, setStatus] = useState("Idle")

    function getLocation() {
        setStatus("Acquiring GPS...")
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                })
                setStatus("GPS Locked")
            },
            (err) => {
                toast.error("GPS Error: " + err.message)
                setStatus("GPS Error")
            },
            { enableHighAccuracy: true }
        )
    }

    async function handleStartTrip() {
        if (!location) {
            toast.error("Please enable GPS first")
            return
        }

        setLoading(true)
        try {
            // In a real app, calls API to create Trip record
            // For now, let's assume we create it in Local DB + Server if online
            // Simplification: Direct push to Trip Dashboard (mock ID)

            // TODO: Create Trip API call

            toast.success("Trip Started!")
            router.push(`/dashboard/trip/active`)
        } catch (e) {
            toast.error("Failed to start")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Start New Trip</CardTitle>
                    <CardDescription>Capture your starting location to begin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center p-6 bg-slate-100 dark:bg-slate-900 rounded-lg">
                        <MapPin className={`h-10 w-10 mb-2 ${location ? 'text-green-500' : 'text-slate-400'}`} />
                        <div className="text-sm font-mono">
                            {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "Waiting for GPS..."}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{status}</p>
                    </div>

                    {!location && (
                        <Button variant="outline" onClick={getLocation} className="w-full">
                            Request GPS Access
                        </Button>
                    )}

                    <Button
                        onClick={handleStartTrip}
                        className="w-full"
                        size="lg"
                        disabled={!location || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Start Journey
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
