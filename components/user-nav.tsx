"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { LogOut, Key, User as UserIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface UserNavProps {
    user: {
        name?: string | null
        email?: string | null
        role?: string
    }
}

export function UserNav({ user }: UserNavProps) {
    const [open, setOpen] = useState(false)

    // Password States
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [loading, setLoading] = useState(false)

    async function handlePasswordChange() {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill all fields")
            return
        }

        if (newPassword.length < 5) {
            toast.error("New password must be at least 5 chars")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/user/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg)
            }

            toast.success("Password changed successfully")
            setOpen(false)
            // Reset fields
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (e: any) {
            toast.error(e.message || "Failed to change password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-fit gap-2 px-3 text-left">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium leading-none">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.role}</span>
                        </div>
                        <UserIcon className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 p-1.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-950" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer">
                        <Key className="mr-2 h-4 w-4" />
                        <span>Change Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={(val) => {
                setOpen(val)
                if (!val) {
                    setCurrentPassword("")
                    setNewPassword("")
                    setConfirmPassword("")
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Please authenticate with your current password to continue.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="current">Current Password</Label>
                            <Input
                                id="current"
                                type="password"
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new">New Password</Label>
                            <Input
                                id="new"
                                type="text"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm">Re-enter New Password</Label>
                            <Input
                                id="confirm"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handlePasswordChange} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
