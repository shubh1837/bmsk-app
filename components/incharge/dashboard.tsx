"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, CheckCircle } from "lucide-react"
import Link from "next/link"

interface InchargeStats {
    totalFA: number
    activePlans: number
    reportsToday: number
}

export function InchargeDashboard({ stats }: { stats: InchargeStats }) {

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Incharge Overview</h2>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Field Assistants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalFA}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activePlans}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reports Today</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{stats.reportsToday}</div>
                        <div className="flex flex-col gap-1">
                            <Link href="/dashboard/reports" className="text-xs text-blue-500 hover:underline">
                                View All Reports
                            </Link>
                            <Link href="/dashboard/reports/final" className="text-xs text-blue-500 hover:underline">
                                View Final Summary Table
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">No recent activity detected.</p>
                </CardContent>
            </Card>
        </div>
    )
}
