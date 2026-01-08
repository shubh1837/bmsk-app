"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Loader2, MoreVertical, Key, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type User = {
    id: string
    name: string
    email: string
    role: string
    incharge?: { name: string }
}

const formSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(5),
    role: z.enum(["INCHARGE", "FIELD_ASSISTANT", "ADMIN"]),
    inchargeId: z.string().optional()
})

interface UserManagementProps {
    incharges: { id: string, name: string }[]
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [incharges, setIncharges] = useState<{ id: string, name: string }[]>([])

    // Reset Password State
    const [resetOpen, setResetOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [resetLoading, setResetLoading] = useState(false)

    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: "FIELD_ASSISTANT",
        },
    })

    const selectedRole = form.watch("role")

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users")
            const data = await res.json()
            setUsers(data)

            // Extract incharges for dropdown
            const incs = data.filter((u: any) => u.role === 'INCHARGE').map((u: any) => ({
                id: u.id,
                name: u.name
            }))
            setIncharges(incs)
        } catch (e) {
            toast.error("Failed to fetch users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                body: JSON.stringify(values)
            })

            if (!res.ok) throw new Error(await res.text())

            toast.success("User created")
            setOpen(false)
            form.reset()
            fetchUsers()
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    async function deleteUser(id: string) {
        if (!confirm("Are you sure? This will delete all plans, trips, and reports associated with this user.")) return
        try {
            const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" })
            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || "Failed to delete")
            }
            toast.success("User deleted")
            fetchUsers()
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    async function handlePasswordReset() {
        if (!selectedUser || !newPassword) return
        if (newPassword.length < 5) {
            toast.error("Password too short")
            return
        }

        setResetLoading(true)
        try {
            const res = await fetch("/api/admin/users/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    password: newPassword
                })
            })

            if (!res.ok) throw new Error("Failed")

            toast.success(`Password updated for ${selectedUser.name}`)
            setResetOpen(false)
            setNewPassword("")
            setSelectedUser(null)
        } catch (e) {
            toast.error("Failed to update password")
        } finally {
            setResetLoading(false)
        }
    }

    return (
        <div className="space-y-4 pt-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">User Management</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Add User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl><Input type="text" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white dark:bg-zinc-950">
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                    <SelectItem value="INCHARGE">Incharge</SelectItem>
                                                    <SelectItem value="FIELD_ASSISTANT">Field Assistant</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {selectedRole === 'FIELD_ASSISTANT' && (
                                    <FormField
                                        control={form.control}
                                        name="inchargeId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Assign Incharge</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Incharge" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-white dark:bg-zinc-950">
                                                        {incharges.map(inc => (
                                                            <SelectItem key={inc.id} value={inc.id}>{inc.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <Button type="submit" className="w-full">Create User</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog open={resetOpen} onOpenChange={(val) => {
                    setResetOpen(val)
                    if (!val) {
                        setNewPassword("")
                        // We keep selectedUser for a moment to avoid UI flickering if needed, or clear it. 
                        // Clearing it is safer.
                        setSelectedUser(null)
                    }
                }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                                Enter a new password for <strong>{selectedUser?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handlePasswordReset} disabled={resetLoading}>
                                {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Report To</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="hover:underline cursor-pointer flex items-center gap-1 focus:outline-none">
                                            {user.name}
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-white dark:bg-zinc-950 align-start">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedUser(user)
                                                setResetOpen(true)
                                            }}>
                                                <Key className="mr-2 h-4 w-4" /> Change Password
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                                <TableCell>{user.incharge?.name || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => deleteUser(user.id)} className="text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
