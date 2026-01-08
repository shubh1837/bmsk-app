"use client"

import { useState, useEffect } from "react"
import { Menu, X, Home, MapPin, FileText, LayoutDashboard, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
    label: string
    href: string
    icon: any
    roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Assistants", href: "/dashboard/incharge/assistants", icon: Users, roles: ['INCHARGE'] },
    { label: "Plans", href: "/dashboard/incharge/plans", icon: MapPin, roles: ['INCHARGE'] },
    { label: "Create Plan", href: "/dashboard/plan/create", icon: MapPin, roles: ['FIELD_ASSISTANT'] },
    { label: "Active Trip", href: "/dashboard/trip/active", icon: Calendar, roles: ['FIELD_ASSISTANT'] },
    { label: "Current Plan", href: "/dashboard/plan/current", icon: MapPin, roles: ['FIELD_ASSISTANT'] },
    { label: "Final Report", href: "/dashboard/reports/final", icon: FileText, roles: ['INCHARGE', 'FIELD_ASSISTANT'] },
]

export function NavDrawer({ role }: { role: string }) {
    const [open, setOpen] = useState(false)
    const [hasActivePlan, setHasActivePlan] = useState(false)
    const [isPlanComplete, setIsPlanComplete] = useState(false)

    useEffect(() => {
        async function checkPlan() {
            try {
                const res = await fetch('/api/plans/my')
                const plans = await res.json()
                // Get all active plans
                const activePlans = plans.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')

                setHasActivePlan(activePlans.length > 0)

                // Check if ALL active plans are fully visited
                const allComplete = activePlans.length > 0 && activePlans.every((p: any) => p.items?.every((i: any) => i.visited))
                setIsPlanComplete(allComplete)

            } catch (e) {
                console.error(e)
            }
        }
        if (role === 'FIELD_ASSISTANT') checkPlan()
    }, [role, open]) // Re-check when menu opens

    // Filter items based on role
    const items = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role))

    return (
        <div className="relative z-50">
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
            </Button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={cn(
                "fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-950 border-r shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
                open ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <div className="font-bold text-lg">Menu</div>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-2">
                        {items.map((item) => {
                            // Logic for Create Plan: Disable if plan active
                            if (item.label === "Create Plan" && hasActivePlan) {
                                return (
                                    <li key={item.href} className="opacity-50 cursor-not-allowed relative group">
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-800">
                                            <item.icon className="h-5 w-5 text-muted-foreground" />
                                            <span>{item.label}</span>
                                        </div>
                                        <span className="absolute right-2 top-2 text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">Active</span>
                                    </li>
                                )
                            }

                            // Logic for Current Plan: Hide if no active plan
                            if (item.label === "Current Plan" && !hasActivePlan) {
                                return null
                            }

                            // Logic for Final Report: Hide for FA unless complete
                            if (item.label === "Final Report" && role === 'FIELD_ASSISTANT' && !isPlanComplete) {
                                return null
                            }

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                        onClick={() => setOpen(false)}
                                    >
                                        <item.icon className="h-5 w-5 text-muted-foreground" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t text-xs text-muted-foreground text-center bg-slate-50 dark:bg-slate-900">
                    BMSK Tracker v1.0
                </div>
            </div>
        </div>
    )
}
