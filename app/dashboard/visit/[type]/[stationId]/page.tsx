"use client"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Camera, MapPin, Save, ArrowLeft, Trash } from "lucide-react"
import { toast } from "sonner"

// --- Helper Components for cleaner code ---
function FormSelect({ id, label, value, onChange, options, error, required }: { id?: string, label: string, value: string, onChange: (val: string) => void, options: string[], error?: boolean, required?: boolean }) {
    return (
        <div className="space-y-1" id={id}>
            <Label className={`text-sm font-medium ${error ? "text-red-500" : ""}`}>
                {label} {required && <span className="text-black dark:text-white">*</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={error ? "border-red-500 ring-red-500" : ""}>
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                    {options.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

function FormInput({ id, label, value, onChange, type = "text", disabled = false, error, required }: { id?: string, label: string, value: string, onChange: (val: string) => void, type?: string, disabled?: boolean, error?: boolean, required?: boolean }) {
    return (
        <div className="space-y-1" id={id}>
            <Label className={`text-sm font-medium ${error ? "text-red-500" : ""}`}>
                {label} {required && <span className="text-black dark:text-white">*</span>}
            </Label>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`${disabled ? "bg-slate-100 font-mono" : ""} ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
        </div>
    )
}

export default function VisitPage({ params }: { params: Promise<{ type: string, stationId: string }> }) {
    const router = useRouter()
    const { type, stationId } = use(params)
    const isAWS = type.toLowerCase() === 'aws'

    const [submitting, setSubmitting] = useState(false)
    const [stationNum, setStationNum] = useState("") // Populated from fetch

    const [stationDetails, setStationDetails] = useState<any>(null)

    // --- Fetch Station Details (Non-blocking) ---
    const { data: session } = useSession()

    useEffect(() => {
        async function fetchDetails() {
            try {
                const res = await fetch(`/api/stations/${stationId}`)
                if (res.ok) {
                    const data = await res.json()
                    setStationDetails(data)
                    if (data.stationNumber) setStationNum(data.stationNumber)

                    if (data.vendorEngineerName) {
                        setStaffName(data.vendorEngineerName)
                    } else if (session?.user?.name) {
                        setStaffName(session.user.name)
                    }

                    if (data.lastVisitedDate) {
                        try {
                            const dateStr = new Date(data.lastVisitedDate).toISOString().split('T')[0]
                            setLastCalDate(dateStr)
                        } catch (e) { console.error("Invalid date") }
                    } else if (data.updatedAt) {
                        // Fallback to updatedAt if lastVisitedDate is missing
                        try {
                            const dateStr = new Date(data.updatedAt).toISOString().split('T')[0]
                            setLastCalDate(dateStr)
                        } catch (e) { console.error("Invalid date") }
                    }
                }
            } catch (e) {
                console.error("Failed to load station details")
            }
        }
        if (session) fetchDetails()
    }, [stationId, session])

    // Validation State
    const [errors, setErrors] = useState<Record<string, boolean>>({})

    // --- Data State ---
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
    const [staffName, setStaffName] = useState("")
    const [staffMob, setStaffMob] = useState("")

    // Premises
    const [premisesOn, setPremisesOn] = useState("")
    const [privateLandOwner, setPrivateLandOwner] = useState("")
    const [premisesCond, setPremisesCond] = useState("")
    const [installedPos, setInstalledPos] = useState("")
    const [fencing, setFencing] = useState("")
    const [fencingCond, setFencingCond] = useState("")
    const [gateLock, setGateLock] = useState("")
    const [gateLockCond, setGateLockCond] = useState("")
    const [painting, setPainting] = useState("")
    const [paintingCond, setPaintingCond] = useState("")
    const [signBoard, setSignBoard] = useState("")
    const [signBoardCond, setSignBoardCond] = useState("")
    const [exposureCond, setExposureCond] = useState("")
    const [surfaceCond, setSurfaceCond] = useState("")

    // Station Status
    const [civilWork, setCivilWork] = useState("")
    const [solarPanel, setSolarPanel] = useState("")
    const [solarClean, setSolarClean] = useState("")
    const [dlBoxAppear, setDlBoxAppear] = useState("")
    const [dlBoxCond, setDlBoxCond] = useState("")
    const [dlPresence, setDlPresence] = useState("")
    const [dlCond, setDlCond] = useState("")
    const [battPresence, setBattPresence] = useState("")
    const [battSignal, setBattSignal] = useState("")
    const [simProvider, setSimProvider] = useState("")
    const [simType, setSimType] = useState("")
    const [prevSim, setPrevSim] = useState("")
    const [signalStrength, setSignalStrength] = useState("")

    // Sensors - Rainfall (Common)
    const [rainBucket, setRainBucket] = useState("")
    const [rainFunnel, setRainFunnel] = useState("")
    const [rainLevel, setRainLevel] = useState("")
    const [rainCalBefore, setRainCalBefore] = useState("")
    const [rainCalAfter, setRainCalAfter] = useState("")

    // AWS Specific Sensors
    const [tempScreen, setTempScreen] = useState("")
    const [tempFunc, setTempFunc] = useState("")
    const [tempVal, setTempVal] = useState("")
    const [tempFault, setTempFault] = useState("")

    const [windFunc, setWindFunc] = useState("")
    const [windVal, setWindVal] = useState("")
    const [windFault, setWindFault] = useState("")

    const [pressFunc, setPressFunc] = useState("")
    const [pressVal, setPressVal] = useState("")
    const [pressFault, setPressFault] = useState("")

    const [solarFunc, setSolarFunc] = useState("")
    const [solarVal, setSolarVal] = useState("")
    const [solarFault, setSolarFault] = useState("")

    const [lastCalDate, setLastCalDate] = useState("")
    const [remarks, setRemarks] = useState("")

    const [images, setImages] = useState<string[]>([])


    // --- Photo Handler ---
    const fileInputRef = useState<HTMLInputElement | null>(null)

    const handlePhotoClick = () => {
        document.getElementById('photo-upload')?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (images.length >= 4) {
            toast.error("Maximum 4 photos allowed")
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Max dimension 1024px
                const MAX_DIM = 1024
                if (width > height) {
                    if (width > MAX_DIM) {
                        height *= MAX_DIM / width
                        width = MAX_DIM
                    }
                } else {
                    if (height > MAX_DIM) {
                        width *= MAX_DIM / height
                        height = MAX_DIM
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                // Compress to JPEG 0.7 quality
                const base64String = canvas.toDataURL('image/jpeg', 0.7)
                setImages(prev => [...prev, base64String])
                toast.success("Photo added")
            }
            img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)

        // Reset input
        e.target.value = ''
    }

    // --- SUBMISSION & VALIDATION ---
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const newErrors: Record<string, boolean> = {}
        let firstErrorId = ""

        // Helper to check required field
        const check = (field: string, value: string, id: string) => {
            if (!value || value.trim() === "") {
                newErrors[id] = true
                if (!firstErrorId) firstErrorId = id
            }
        }

        // 1. General
        check("visitDate", visitDate, "visitDate")

        // 2. Premises
        check("premisesOn", premisesOn, "premisesOn")
        if (premisesOn === "Private Land") check("privateLandOwner", privateLandOwner, "privateLandOwner")
        check("premisesCond", premisesCond, "premisesCond")
        check("installedPos", installedPos, "installedPos")

        check("gateLock", gateLock, "gateLock")
        if (gateLock === "Yes") check("gateLockCond", gateLockCond, "gateLockCond")

        check("painting", painting, "painting")

        check("signBoard", signBoard, "signBoard")
        check("signBoardCond", signBoardCond, "signBoardCond")
        check("exposureCond", exposureCond, "exposureCond")
        check("surfaceCond", surfaceCond, "surfaceCond")

        // 3. Station Status
        check("civilWork", civilWork, "civilWork")
        check("solarPanel", solarPanel, "solarPanel")

        check("dlBoxAppear", dlBoxAppear, "dlBoxAppear")
        check("dlBoxCond", dlBoxCond, "dlBoxCond")
        check("dlPresence", dlPresence, "dlPresence")
        check("dlCond", dlCond, "dlCond")

        check("battPresence", battPresence, "battPresence")
        check("battSignal", battSignal, "battSignal")

        check("simProvider", simProvider, "simProvider")
        check("simType", simType, "simType")
        check("signalStrength", signalStrength, "signalStrength")

        // 4. Sensors
        check("rainBucket", rainBucket, "rainBucket")
        check("rainFunnel", rainFunnel, "rainFunnel")
        check("rainLevel", rainLevel, "rainLevel")
        check("rainCalBefore", rainCalBefore, "rainCalBefore")
        check("rainCalAfter", rainCalAfter, "rainCalAfter")

        if (isAWS) {
            check("tempScreen", tempScreen, "tempScreen")
            check("tempFunc", tempFunc, "tempFunc")

            check("windFunc", windFunc, "windFunc")
            check("pressFunc", pressFunc, "pressFunc")
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error("Please fill all compulsory fields")
            const element = document.getElementById(firstErrorId)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            return
        }

        // Photos check
        if (images.length < 2) {
            toast.error("Please take at least 2 photos")
            return
        }

        setSubmitting(true)

        // Collect all data
        const formPayload = {
            meta: {
                staffName, staffMob, visitDate, stationNum, type: isAWS ? 'AWS' : 'ARG'
            },
            premises: {
                premisesOn, privateLandOwner, premisesCond, installedPos, fencing, fencingCond,
                gateLock, gateLockCond, painting, paintingCond, signBoard, signBoardCond,
                exposureCond, surfaceCond
            },
            stationStatus: {
                civilWork, solarPanel, solarClean, dlBoxAppear, dlBoxCond, dlPresence, dlCond,
                battPresence, battSignal, simProvider, simType, prevSim, signalStrength
            },
            sensors: {
                rainBucket, rainFunnel, rainLevel, rainCalBefore, rainCalAfter,
                ...(isAWS ? {
                    tempScreen, tempFunc, tempVal, tempFault,
                    windFunc, windVal, windFault,
                    pressFunc, pressVal, pressFault,
                    solarFunc, solarVal, solarFault
                } : {})
            },
            lastCalDate,
            remarks
        }

        try {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const payload = {
                        stationId,
                        visitDate: new Date(),
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        formData: JSON.stringify(formPayload),
                        images: images
                    }

                    const res = await fetch('/api/visits', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    })

                    if (res.ok) {
                        toast.success("Report submitted successfully")
                        router.push('/dashboard/trip/active')
                    } else {
                        const msg = await res.text()
                        toast.error("Submission failed: " + msg)
                        setSubmitting(false)
                    }
                } catch (err) {
                    console.error(err)
                    toast.error("Network or Server Error")
                    setSubmitting(false)
                }
            }, (err) => {
                toast.error("Location required: " + err.message)
                setSubmitting(false)
            }, { enableHighAccuracy: true })
        } catch (e) {
            toast.error("Submission Error")
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{isAWS ? "AWS" : "ARG"} Visit Form</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Station Details Header */}
                {stationDetails && (
                    <Card className="bg-muted/50 border-none shadow-none">
                        <CardContent className="flex items-center gap-4 py-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{stationDetails.stationNumber || "Unknown Station"}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {stationDetails.district}, {stationDetails.block} • {stationDetails.panchayat}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isAWS ? "AWS" : "ARG"} • {stationDetails.location}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 1. General Info */}
                <Card>
                    <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput id="visitDate" label="Field Visit Date" value={visitDate} onChange={setVisitDate} type="date" error={errors.visitDate} required />
                        <FormInput label="Station Number" value={stationNum} onChange={() => { }} disabled required />
                        <FormInput label="Agency Engineer Name" value={staffName} onChange={setStaffName} />
                        <FormInput label="Engineer Mobile No." value={staffMob} onChange={setStaffMob} />
                    </CardContent>
                </Card>

                {/* 2. Status of Premises */}
                <Card>
                    <CardHeader><CardTitle>Status of Premises</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect id="premisesOn" label="Station Premises On" value={premisesOn} onChange={setPremisesOn} options={["Government Land", "Private Land"]} error={errors.premisesOn} required />
                            {premisesOn === "Private Land" && (
                                <FormSelect id="privateLandOwner" label="If Private, Owner Type" value={privateLandOwner} onChange={setPrivateLandOwner} options={["Kisan Salahkar", "Progressive Farmer", "Owner"]} error={errors.privateLandOwner} required />
                            )}
                            <FormSelect id="premisesCond" label="Premises Condition" value={premisesCond} onChange={setPremisesCond} options={["Damaged", "Sub-merged", "Partially Sub-merged", "No-Issue"]} error={errors.premisesCond} required />
                            <FormSelect id="installedPos" label="Installed Position" value={installedPos} onChange={setInstalledPos} options={["Ground", "Rooftop"]} error={errors.installedPos} required />

                            {installedPos === "Ground" && (
                                <>
                                    <FormSelect label="Fencing?" value={fencing} onChange={setFencing} options={["Yes", "No"]} />
                                    {fencing === "Yes" && <FormSelect label="Fencing Condition" value={fencingCond} onChange={setFencingCond} options={["Good", "Bad", "Moderate"]} />}
                                </>
                            )}

                            <FormSelect id="gateLock" label="Gate & Lock?" value={gateLock} onChange={setGateLock} options={["Yes", "No"]} error={errors.gateLock} required />
                            {gateLock === "Yes" && <FormSelect id="gateLockCond" label="Condition" value={gateLockCond} onChange={setGateLockCond} options={["Good", "Bad", "Moderate"]} error={errors.gateLockCond} required />}

                            <FormSelect id="painting" label="Painting?" value={painting} onChange={setPainting} options={["Yes", "No"]} error={errors.painting} required />
                            {painting === "Yes" && <FormSelect label="Condition" value={paintingCond} onChange={setPaintingCond} options={["Good", "Rusted"]} />}

                            <FormSelect id="signBoard" label="Sign Board?" value={signBoard} onChange={setSignBoard} options={["Yes", "No"]} error={errors.signBoard} required />
                            {signBoard === "Yes" && <FormSelect id="signBoardCond" label="Condition" value={signBoardCond} onChange={setSignBoardCond} options={["Visible", "Not Visible"]} error={errors.signBoardCond} required />}

                            <FormSelect id="exposureCond" label="Exposure Condition" value={exposureCond} onChange={setExposureCond} options={["Good", "Bad", "Moderate"]} error={errors.exposureCond} required />
                            <FormSelect id="surfaceCond" label="Surface Condition" value={surfaceCond} onChange={setSurfaceCond} options={["Clean", "Grassy", "Water Logged"]} error={errors.surfaceCond} required />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Status of Station */}
                <Card>
                    <CardHeader><CardTitle>Status of Station</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect id="civilWork" label="Civil Work" value={civilWork} onChange={setCivilWork} options={["Proper", "Tilted", "Wobble"]} error={errors.civilWork} required />
                            <FormSelect id="solarPanel" label="Solar Panel" value={solarPanel} onChange={setSolarPanel} options={["Broken", "Stolen", "Good"]} error={errors.solarPanel} required />
                            {solarPanel === "Good" && <FormSelect label="Solar Cleanliness" value={solarClean} onChange={setSolarClean} options={["Clean", "Not Clean"]} />}

                            <FormSelect id="dlBoxAppear" label="Data Logger Box" value={dlBoxAppear} onChange={setDlBoxAppear} options={["Locked", "Open"]} error={errors.dlBoxAppear} required />
                            <FormSelect id="dlBoxCond" label="Data Logger Box Cond." value={dlBoxCond} onChange={setDlBoxCond} options={["Good", "Moderate", "Rusted"]} error={errors.dlBoxCond} required />

                            <FormSelect id="dlPresence" label="Logger Presence" value={dlPresence} onChange={setDlPresence} options={["Stolen", "Present"]} error={errors.dlPresence} required />
                            {dlPresence === "Present" && <FormSelect id="dlCond" label="Logger Condition" value={dlCond} onChange={setDlCond} options={["Good", "Working", "Not Working"]} error={errors.dlCond} required />}

                            <FormSelect id="battPresence" label="Battery Presence" value={battPresence} onChange={setBattPresence} options={["Stolen", "Present"]} error={errors.battPresence} required />
                            {battPresence === "Present" && <FormSelect id="battSignal" label="Battery Signal" value={battSignal} onChange={setBattSignal} options={["Strong", "Weak"]} error={errors.battSignal} required />}

                            <FormSelect id="simProvider" label="SIM Provider" value={simProvider} onChange={setSimProvider} options={["BSNL", "Jio", "Airtel", "Other"]} error={errors.simProvider} required />
                            <FormSelect id="simType" label="SIM Type" value={simType} onChange={setSimType} options={["2G", "3G", "4G", "5G"]} error={errors.simType} required />
                            <FormSelect label="Previous SIM (if changed)" value={prevSim} onChange={setPrevSim} options={["None", "BSNL", "Jio", "Airtel", "Other"]} />
                            <FormSelect id="signalStrength" label="Signal Strength" value={signalStrength} onChange={setSignalStrength} options={["Strong", "Weak", "No Signal"]} error={errors.signalStrength} required />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Sensor Status & Calibration */}
                <Card>
                    <CardHeader><CardTitle>Sensor Status & Calibration</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {/* Rainfall - Common */}
                        <div className="space-y-4 border-b pb-4">
                            <h4 className="font-semibold text-sm text-primary">Rainfall Sensor</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelect id="rainBucket" label="Tipping Bucket" value={rainBucket} onChange={setRainBucket} options={["Cleaned", "Dirty"]} error={errors.rainBucket} required />
                                <FormSelect id="rainFunnel" label="Funnel & Mesh" value={rainFunnel} onChange={setRainFunnel} options={["Cleaned", "Dirty"]} error={errors.rainFunnel} required />
                                <FormSelect id="rainLevel" label="Levelling Bubble" value={rainLevel} onChange={setRainLevel} options={["Centered", "Not Centered"]} error={errors.rainLevel} required />
                                <FormInput id="rainCalBefore" label="Calibration Before (ml)" value={rainCalBefore} onChange={setRainCalBefore} type="number" error={errors.rainCalBefore} required />
                                <FormInput id="rainCalAfter" label="Calibration After (ml)" value={rainCalAfter} onChange={setRainCalAfter} type="number" error={errors.rainCalAfter} required />
                            </div>
                        </div>

                        {/* AWS Specifics */}
                        {isAWS && (
                            <>
                                {/* Temperature */}
                                <div className="space-y-4 border-b pb-4">
                                    <h4 className="font-semibold text-sm text-primary">Temperature Sensor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormSelect id="tempScreen" label="Screen Condition" value={tempScreen} onChange={setTempScreen} options={["Clean", "Not Clean"]} error={errors.tempScreen} required />
                                        <FormSelect id="tempFunc" label="Functioning?" value={tempFunc} onChange={setTempFunc} options={["Proper", "Not Proper"]} error={errors.tempFunc} required />
                                        {tempFunc === "Proper" ? (
                                            <FormInput label="Value" value={tempVal} onChange={setTempVal} />
                                        ) : (
                                            <FormSelect label="Fault Type" value={tempFault} onChange={setTempFault} options={["Faulty Sensor", "Theft", "Damaged"]} />
                                        )}
                                    </div>
                                </div>

                                {/* Wind */}
                                <div className="space-y-4 border-b pb-4">
                                    <h4 className="font-semibold text-sm text-primary">Wind Sensor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormSelect id="windFunc" label="Functioning?" value={windFunc} onChange={setWindFunc} options={["Proper", "Not Proper"]} error={errors.windFunc} required />
                                        {windFunc === "Proper" ? (
                                            <FormInput label="Value" value={windVal} onChange={setWindVal} />
                                        ) : (
                                            <FormSelect label="Fault Type" value={windFault} onChange={setWindFault} options={["Faulty Sensor", "Theft", "Damaged"]} />
                                        )}
                                    </div>
                                </div>

                                {/* Pressure */}
                                <div className="space-y-4 border-b pb-4">
                                    <h4 className="font-semibold text-sm text-primary">Pressure Sensor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormSelect id="pressFunc" label="Functioning?" value={pressFunc} onChange={setPressFunc} options={["Proper", "Not Proper"]} error={errors.pressFunc} required />
                                        {pressFunc === "Proper" ? (
                                            <FormInput label="Value" value={pressVal} onChange={setPressVal} />
                                        ) : (
                                            <FormSelect label="Fault Type" value={pressFault} onChange={setPressFault} options={["Faulty Sensor", "Theft", "Damaged"]} />
                                        )}
                                    </div>
                                </div>

                                {/* Solar */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm text-primary">Solar Radiation Sensor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormSelect label="Functioning?" value={solarFunc} onChange={setSolarFunc} options={["Proper", "Not Proper"]} />
                                        {solarFunc === "Proper" ? (
                                            <FormInput label="Value" value={solarVal} onChange={setSolarVal} />
                                        ) : (
                                            <FormSelect label="Fault Type" value={solarFault} onChange={setSolarFault} options={["Faulty Sensor", "Theft", "Damaged"]} />
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-1 pt-4">
                            <FormInput label="Last Calibration Date" value={lastCalDate} onChange={setLastCalDate} type="date" />
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Remarks & Photos */}
                <Card>
                    <CardHeader><CardTitle>Finalize</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Remarks</Label>
                            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
                        </div>

                        <div className="space-y-2">
                            <Label>Geo-tagged Photos (Min 2, Max 4) <span className="text-black dark:text-white">*</span></Label>
                            <div className="grid grid-cols-2 gap-2">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-video bg-slate-100 rounded border overflow-hidden">
                                        <img src={img} className="object-cover w-full h-full" alt="evidence" />
                                        <button
                                            type="button"
                                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                        >
                                            <Trash className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {images.length < 4 && (
                                    <div
                                        onClick={handlePhotoClick}
                                        className="aspect-video border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50"
                                    >
                                        <Camera className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground mt-1">Add Photo</span>
                                        <input
                                            type="file"
                                            id="photo-upload"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Sticky Footer for Submit Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-950 border-t z-50">
                    <div className="max-w-3xl mx-auto">
                        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting Report...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Submit Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </form >
        </div >
    )
}
