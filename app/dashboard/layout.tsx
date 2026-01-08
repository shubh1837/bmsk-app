import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NavDrawer } from "@/components/nav-drawer"
import { UserNav } from "@/components/user-nav"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Simple Top Bar */}
            <header className="bg-white dark:bg-slate-900 border-b p-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <NavDrawer role={session.user.role} />
                    <h1 className="font-bold text-xl">BMSK Tracker</h1>
                </div>
                <div className="flex items-center gap-4">
                    <UserNav user={session.user} />
                </div>
            </header>
            <main className="p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    )
}
