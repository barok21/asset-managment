"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Search, Shield, Users, Edit, Crown, Home } from 'lucide-react'
import { getAllUsers, updateUserRole, type UserProfile, type UserRole } from "@/lib/actions/user.action"
import Link from "next/link"
import { Separator } from "./ui/separator"

const roleHierarchy: Record<UserRole, number> = {
  department_user: 1,
  finance_manager: 2,
  property_manager: 2,
  higher_manager: 3,
  admin: 4,
}

const roleColors: Record<UserRole, string> = {
  department_user: "bg-gray-100 text-gray-800",
  finance_manager: "bg-blue-100 text-blue-800",
  property_manager: "bg-green-100 text-green-800",
  higher_manager: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
}

const roleLabels: Record<UserRole, string> = {
  department_user: "Department User",
  finance_manager: "Finance Manager",
  property_manager: "Property Manager",
  higher_manager: "Higher Manager",
  admin: "Administrator",
}

interface UserRoleManagementProps {
  currentUserRole: UserRole
}

export default function UserRoleManagement({ currentUserRole }: UserRoleManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [newRole, setNewRole] = useState<UserRole>("department_user")
  const [updating, setUpdating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const userData = await getAllUsers()
      setUsers(userData)
    } catch (error) {
      toast.error("Failed to load users")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleUpdate = async () => {
    if (!selectedUser) return

    // Check if current user can promote to this role
    const currentUserLevel = roleHierarchy[currentUserRole]
    const targetRoleLevel = roleHierarchy[newRole]

    if (targetRoleLevel >= currentUserLevel) {
      toast.error("You cannot promote users to a role equal or higher than yours")
      return
    }

    setUpdating(true)
    try {
      await updateUserRole(selectedUser.userId, newRole)
      toast.success(`User role updated to ${roleLabels[newRole]}`)
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.userId === selectedUser.userId 
            ? { ...user, role: newRole }
            : user
        )
      )
      
      setIsDialogOpen(false)
      setSelectedUser(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role")
    } finally {
      setUpdating(false)
    }
  }

  const canPromoteToRole = (role: UserRole): boolean => {
    const currentUserLevel = roleHierarchy[currentUserRole]
    const targetRoleLevel = roleHierarchy[role]
    return targetRoleLevel < currentUserLevel
  }

  const availableRoles = Object.keys(roleHierarchy).filter(role => 
    canPromoteToRole(role as UserRole)
  ) as UserRole[]

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-[400px]">
  //       <div className="flex items-center gap-2">
  //         <Loader2 className="h-6 w-6 animate-spin" />
  //         <span>Loading users...</span>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="">
          <Button variant={"outline"} size={"sm"} className="">
            <Link href="/dashboard" className="flex gap-3">
            <Home/> <p>Go to dashboard</p>
            </Link>
          </Button>
          <h2 className="text-2xl font-bold flex items-center gap-2 pt-20">
            <Crown className="h-6 w-6" />
            User Role Management
          </h2>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {roleLabels[currentUserRole]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({users.length})
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.position}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role as UserRole]}>
                      {roleLabels[user.role as UserRole]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog open={isDialogOpen && selectedUser?.userId === user.userId} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setNewRole(user.role as UserRole)
                            setIsDialogOpen(true)
                          }}
                          disabled={!canPromoteToRole(user.role as UserRole) && user.role !== "department_user"}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update User Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">User: {selectedUser?.fullName}</p>
                            <p className="text-sm text-muted-foreground ">Current Role: <Badge variant={"outline"} className="rounded-sm">{selectedUser && roleLabels[selectedUser.role as UserRole]}</Badge></p>
                          </div>
                            <Separator/>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Set new Role</label>
                            <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {roleLabels[role]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleRoleUpdate} 
                              disabled={updating || newRole === selectedUser?.role}
                            >
                              {updating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update Role"
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
