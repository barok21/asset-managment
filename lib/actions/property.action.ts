"use server"

import { auth } from "@clerk/nextjs/server"
import { createSupaseClient } from "../supabase"
import { canApproveRejects } from "./user.action"
import type { CreateProperty, GetAllProperties, CreateDept, GetAllDepartment, RequestProperty } from "@/types" // Import necessary types

// Common rejection reasons

// Dashboard statistics interface
export interface DashboardStatistics {
  totalRequests: number
  totalApproved: number
  totalRejected: number
  totalPartial: number
  totalPending: number
  totalItems: number
  approvalRate: number
  rejectionRate: number
  pendingRate: number
  commonResources: Array<{
    name: string
    count: number
    departments: string[]
    totalQuantity: number
  }>
  departmentStats: Array<{
    department: string
    totalRequests: number
    approvedRequests: number
    rejectedRequests: number
    pendingRequests: number
  }>
  recentActivity: Array<{
    id: string
    type: "request" | "approval" | "rejection"
    requestorName: string
    department: string
    itemName?: string
    timestamp: string
  }>
}

// Get comprehensive dashboard statistics
export const getDashboardStatistics = async (): Promise<DashboardStatistics> => {
  const supabase = createSupaseClient()

  // Get all requests with their properties
  const { data: allRequests, error } = await supabase
    .from("request_property")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message || "Failed to fetch dashboard statistics")
  }

  // Group by request_batch_id to get unique requests
  const requestGroups = new Map()
  const allItems = allRequests || []

  allItems.forEach((item) => {
    const batchId = item.request_batch_id
    if (!requestGroups.has(batchId)) {
      requestGroups.set(batchId, {
        request_batch_id: batchId,
        department: item.department,
        requestor_full_name: item.requestor_full_name,
        created_at: item.created_at,
        properties: [],
      })
    }
    requestGroups.get(batchId).properties.push(item)
  })

  const requests = Array.from(requestGroups.values())

  // Calculate request statuses
  const requestStats = requests.map((request) => {
    const properties = request.properties
    const approvedCount = properties.filter((p: any) => p.status === "approved").length
    const rejectedCount = properties.filter((p: any) => p.status === "rejected").length
    const pendingCount = properties.filter((p: any) => !p.status || p.status === "pending").length

    let status: string
    if (pendingCount > 0) status = "pending"
    else if (approvedCount > 0 && rejectedCount > 0) status = "partial"
    else if (approvedCount === properties.length) status = "approved"
    else if (rejectedCount === properties.length) status = "rejected"
    else status = "pending"

    return { ...request, status }
  })

  // Basic statistics
  const totalRequests = requests.length
  const totalApproved = requestStats.filter((r) => r.status === "approved").length
  const totalRejected = requestStats.filter((r) => r.status === "rejected").length
  const totalPartial = requestStats.filter((r) => r.status === "partial").length
  const totalPending = requestStats.filter((r) => r.status === "pending").length
  const totalItems = allItems.length

  const approvalRate = totalRequests > 0 ? (totalApproved / totalRequests) * 100 : 0
  const rejectionRate = totalRequests > 0 ? (totalRejected / totalRequests) * 100 : 0
  const pendingRate = totalRequests > 0 ? (totalPending / totalRequests) * 100 : 0

  // Common resources analysis
  const resourceMap = new Map()
  allItems.forEach((item) => {
    const key = item.property_name
    if (!resourceMap.has(key)) {
      resourceMap.set(key, {
        name: key,
        count: 0,
        departments: new Set(),
        totalQuantity: 0,
      })
    }
    const resource = resourceMap.get(key)
    resource.count += 1
    resource.departments.add(item.department)
    resource.totalQuantity += item.quantity || 0
  })

  const commonResources = Array.from(resourceMap.values())
    .map((resource) => ({
      ...resource,
      departments: Array.from(resource.departments),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Department statistics
  const deptMap = new Map()
  requests.forEach((request) => {
    const dept = request.department
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        department: dept,
        totalRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        pendingRequests: 0,
      })
    }
    const deptStats = deptMap.get(dept)
    deptStats.totalRequests += 1

    const requestWithStatus = requestStats.find((r) => r.request_batch_id === request.request_batch_id)
    if (requestWithStatus) {
      switch (requestWithStatus.status) {
        case "approved":
          deptStats.approvedRequests += 1
          break
        case "rejected":
          deptStats.rejectedRequests += 1
          break
        default:
          deptStats.pendingRequests += 1
      }
    }
  })

  const departmentStats = Array.from(deptMap.values()).sort((a, b) => b.totalRequests - a.totalRequests)

  // Recent activity (last 20 activities)
const recentActivity = allItems.slice(0, 20).map((item) => ({
  id: item.id as string,
  type: item.status === "approved"
    ? "approval"
    : item.status === "rejected"
    ? "rejection"
    : "request" as "request" | "approval" | "rejection",
  requestorName: item.requestor_full_name as string,
  department: item.department as string,
  itemName: item.property_name,
  timestamp: (item.updated_at || item.created_at) as string,
}))

  return {
    totalRequests,
    totalApproved,
    totalRejected,
    totalPartial,
    totalPending,
    totalItems,
    approvalRate: Math.round(approvalRate * 100) / 100,
    rejectionRate: Math.round(rejectionRate * 100) / 100,
    pendingRate: Math.round(pendingRate * 100) / 100,
    commonResources,
    departmentStats,
    recentActivity,
  }
}

// Check user role - you'll need to implement this based on your user management system
export const getUserRole = async (): Promise<string> => {
  const { userId } = await auth()
  const supabase = createSupaseClient()

  // This is a placeholder - implement based on your user role system
  // You might have a users table with roles, or use Clerk's metadata
  const { data: userRole, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).single()

  if (error || !userRole) {
    return "department_user" // Default role
  }

  return userRole.role
}

export const createPropertiesBulk = async (properties: CreateProperty[]) => {
  const { userId: username } = await auth()
  const supabase = createSupaseClient()

  const names = properties.map((p) => p.name)

  const { data: existing, error: fetchError } = await supabase.from("property").select("name").in("name", names)

  if (fetchError) {
    throw new Error(fetchError.message || "Error checking for duplicates.")
  }

  const existingNames = new Set(existing?.map((item) => item.name))
  const filtered = properties.filter((p) => !existingNames.has(p.name))

  if (filtered.length === 0) {
    return {
      success: false,
      message: "All provided property names already exist.",
      skipped: names.length,
      duplicates: Array.from(existingNames),
    }
  }

  const payload = filtered.map((property) => ({
    ...property,
    username,
  }))

  const { data, error } = await supabase.from("property").insert(payload).select()

  if (error || !data) {
    throw new Error(error?.message || "Failed to create properties in bulk")
  }

  return {
    success: true,
    data,
    inserted: data.length,
    skipped: properties.length - data.length,
    duplicates: Array.from(existingNames),
  }
}

export const getAllProperties = async ({ limit = 10, page = 1, category, dept_user }: GetAllProperties) => {
  const supabase = createSupaseClient()

  let query = supabase.from("property").select("*", { count: "exact" }).order("created_at", { ascending: false })

  if (category) {
    query = query.eq("category", category)
  }

  if (dept_user) {
    query = query.eq("dept_user", dept_user)
  }

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data: property, count, error } = await query

  if (error) throw new Error(error.message)

  return {
    property,
    total: count,
  }
}

export const createDepartment = async (properties: CreateDept[]) => {
  const { userId: username } = await auth()
  const supabase = createSupaseClient()

  const names = properties.map((p) => p.name)

  const { data: existing, error: fetchError } = await supabase.from("departments").select("name")

  if (fetchError) {
    throw new Error(fetchError.message || "Error checking for duplicates.")
  }

  const existingNames = new Set(existing?.map((item) => item.name))
  const filtered = properties.filter((p) => !existingNames.has(p.name))

  if (filtered.length === 0) {
    return {
      success: false,
      message: "All provided property names already exist.",
      skipped: names.length,
      duplicates: Array.from(existingNames),
    }
  }

  const payload = filtered.map((property) => ({
    ...property,
    username,
  }))

  const { data, error } = await supabase.from("departments").insert(payload).select()

  if (error || !data) {
    throw new Error(error?.message || "Failed to create properties in bulk")
  }

  return {
    success: true,
    data,
    inserted: data.length,
    skipped: properties.length - data.length,
    duplicates: Array.from(existingNames),
  }
}

export const getDepartments = async () => {
  const supabase = createSupaseClient()
  const { data, error } = await supabase.from("departments").select("name")

  if (error) throw new Error(error.message)
  return data.map((d) => d.name)
}

export const getAllDepartment = async ({ limit = 10, page = 1 }: GetAllDepartment) => {
  const supabase = createSupaseClient()

  let query = supabase.from("departments").select("*", { count: "exact" }).order("created_at", { ascending: false })

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data: property, count, error } = await query

  if (error) throw new Error(error.message)

  return {
    property,
    total: count,
  }
}

export const requestProperties = async (properties: RequestProperty[]) => {
  const { userId: username } = await auth()
  const supabase = createSupaseClient()

  const payload = properties.map((property) => ({
    ...property,
    username,
  }))

  const { data, error } = await supabase.from("request_property").insert(payload).select()

  if (error || !data) {
    throw new Error(error?.message || "Failed to insert request properties")
  }

  return {
    success: true,
    data,
    inserted: data.length,
  }
}

export async function getRequestedProperties() {
  const supabase = createSupaseClient()

  const { data, error } = await supabase.from("request_property").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching requested properties:", error)
    throw new Error(error.message)
  }

  return data
}

// Update request status with reason
export const updateRequestStatus = async (
  batchId: string,
  status: "approved" | "rejected",
  rejectionReason?: string,
) => {
  const canApprove = await canApproveRejects()
  if (!canApprove) {
    throw new Error("You don't have permission to approve/reject requests")
  }

  const supabase = createSupaseClient()

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === "rejected" && rejectionReason) {
    updateData.overall_rejection_reason = rejectionReason
  }

  const { error } = await supabase.from("request_property").update(updateData).eq("request_batch_id", batchId)

  if (error) throw error
}

// Update individual request item status with reason
export const updateRequestItemStatus = async (
  id: string,
  status: "approved" | "rejected",
  rejectionReason?: string,
) => {
  const canApprove = await canApproveRejects()
  if (!canApprove) {
    throw new Error("You don't have permission to approve/reject items")
  }

  const supabase = createSupaseClient()

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === "rejected" && rejectionReason) {
    updateData.rejection_reason = rejectionReason
  }

  const { error } = await supabase.from("request_property").update(updateData).eq("id", id)

  if (error) throw new Error(error.message)
}

// Update approved quantity
export const updateApprovedQuantity = async (id: string, approved_quantity: number) => {
  const canApprove = await canApproveRejects()
  if (!canApprove) {
    throw new Error("You don't have permission to modify approved quantities")
  }

  const supabase = createSupaseClient()

  const { error } = await supabase
    .from("request_property")
    .update({
      approved_quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

// Fetch grouped requests with pagination
export const fetchGroupedRequestedPropertiesWithUsage = async (
  page = 1,
  limit = 10,
): Promise<{ data: any[]; total: number; hasMore: boolean }> => {
  
  const supabase = createSupaseClient()

  const { data: batchIds, error: batchError } = await supabase
    .from("request_property")
    .select("request_batch_id")
    .order("created_at", { ascending: false })

  if (batchError) {
    throw new Error(batchError.message)
  }

  const uniqueBatchIds = [...new Set(batchIds?.map((item) => item.request_batch_id) || [])]
  const total = uniqueBatchIds.length

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedBatchIds = uniqueBatchIds.slice(startIndex, endIndex)

  if (paginatedBatchIds.length === 0) {
    return { data: [], total, hasMore: false }
  }

  const { data: requested, error } = await supabase
    .from("request_property")
    .select("*")
    .in("request_batch_id", paginatedBatchIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  if (!requested) return { data: [], total, hasMore: false }

  // Group by request_batch_id
  const grouped: Record<string, any> = {}

  for (const item of requested) {
    const batchId = item.request_batch_id

    if (!grouped[batchId]) {
      grouped[batchId] = {
        request_batch_id: batchId,
        department: item.department,
        requestor_full_name: item.requestor_full_name,
        special_requirment: item.special_requirment,
        status: item.status ?? null,
        overall_rejection_reason: item.overall_rejection_reason ?? null,
        created_at: item.created_at,
        event_desc: item.event_desc,
        phone_number: item.phone_number,
        start_date: item.start_date,
        properties: [],
      }
    }

    grouped[batchId].properties.push(item)
  }

  const enriched = Object.values(grouped)
  enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const hasMore = endIndex < total

  return { data: enriched, total, hasMore }
}

// for only the department
// export const fetchGroupedRequestedPropertiesWithUsage = async (
//   page = 1,
//   limit = 10,
//   department?: string // 👈 optional filter
// ): Promise<{ data: any[]; total: number; hasMore: boolean }> => {
//   const supabase = createSupaseClient()

//   // Step 1: Filter batch IDs
//   let batchIdQuery = supabase
//     .from("request_property")
//     .select("request_batch_id")
//     .order("created_at", { ascending: false })

//   if (department) {
//     batchIdQuery = batchIdQuery.eq("department", department)
//   }

//   const { data: batchIds, error: batchError } = await batchIdQuery

//   if (batchError) {
//     throw new Error(batchError.message)
//   }

//   const uniqueBatchIds = [...new Set(batchIds?.map((item) => item.request_batch_id) || [])]
//   const total = uniqueBatchIds.length

//   const startIndex = (page - 1) * limit
//   const endIndex = startIndex + limit
//   const paginatedBatchIds = uniqueBatchIds.slice(startIndex, endIndex)

//   if (paginatedBatchIds.length === 0) {
//     return { data: [], total, hasMore: false }
//   }

//   // Step 2: Fetch full data for those batch IDs
//   const { data: requested, error } = await supabase
//     .from("request_property")
//     .select("*")
//     .in("request_batch_id", paginatedBatchIds)
//     .order("created_at", { ascending: false })

//   if (error) {
//     throw new Error(error.message)
//   }

//   if (!requested) return { data: [], total, hasMore: false }

//   // Step 3: Group by request_batch_id
//   const grouped: Record<string, any> = {}

//   for (const item of requested) {
//     const batchId = item.request_batch_id

//     if (!grouped[batchId]) {
//       grouped[batchId] = {
//         request_batch_id: batchId,
//         department: item.department,
//         requestor_full_name: item.requestor_full_name,
//         special_requirment: item.special_requirment,
//         status: item.status ?? null,
//         overall_rejection_reason: item.overall_rejection_reason ?? null,
//         created_at: item.created_at,
//         properties: [],
//       }
//     }

//     grouped[batchId].properties.push(item)
//   }

//   const enriched = Object.values(grouped)
//   enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

//   const hasMore = endIndex < total

//   return { data: enriched, total, hasMore }
// }