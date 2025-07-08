// types/index.ts — Cleaned and organized

export enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

export const UoM = [
  { label: "Piece (pc)", value: "pc" },
  { label: "Set", value: "set" },
  { label: "Box", value: "box" },
  { label: "Package (pkg)", value: "pkg" },
  { label: "Roll", value: "roll" },
  { label: "Pair", value: "pair" },
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Gram (g)", value: "g" },
  { label: "Liter (l)", value: "l" },
  { label: "Milliliter (ml)", value: "ml" },
  { label: "Meter (m)", value: "m" },
  { label: "Centimeter (cm)", value: "cm" },
  { label: "Foot (ft)", value: "ft" },
  { label: "Square Meter (sqm)", value: "sqm" },
  { label: "Cubic Meter (cbm)", value: "cbm" },
]

export interface PropertyItem {
  id: string
  property_name: string
  quantity: number
  approved_quantity?: number
  status?: "approved" | "rejected" | "pending"
  rejection_reason?: string
  usedInOtherDept: string[]
}

export interface RequestProperty {
  id?: string
  property_name: string
  quantity: string
  approved_quantity?: number
  department: string
  requestor_full_name: string
  special_requirment?: string
  request_batch_id: string
  created_at?: string
  status?: string
}

export interface GroupedRequest {
  request_batch_id: string
  requestor_full_name: string
  department: string
  special_requirment?: string
  status?: string | null
  overall_rejection_reason?: string | null
  created_at: string
  properties: PropertyItem[]
}

export interface RequestGroup {
  request_batch_id: string
  requestor_full_name: string
  department: string
  special_requirment?: string
  status?: "approved" | "rejected" | "pending" | "partial"
  overall_rejection_reason?: string
  created_at: string
  properties: PropertyItem[]
}

export interface CreateProperty {
  name: string
  quantity: number
  initial_price: number
  category: string
  dept_user: string
  UoM: string
}

export interface CreateDept {
  name: string
  dept_id: string
}

export interface GetAllProperties {
  limit?: number
  min_price?: number
  max_price?: number
  page?: number
  category?: string | string[]
  dept_user?: string | string[]
}

export interface GetAllDepartment {
  limit?: number
  page?: number
}

export interface BuildClient {
  key?: string
  sessionToken?: string
}

export interface CreateUser {
  email: string
  name: string
  image?: string
  accountId: string
}

export interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export interface Avatar {
  userName: string
  width: number
  height: number
  className?: string
}

export interface SavedMessage {
  role: "user" | "system" | "assistant"
  content: string
}

export interface CompanionComponentProps {
  companionId: string
  subject: string
  topic: string
  name: string
  userName: string
  userImage: string
  voice: string
  style: string
}

export interface DashboardStats {
  totalRequests: number
  totalApproved: number
  totalRejected: number
  totalPartial: number
  totalPending: number
  commonResources: Array<{ name: string; count: number; department: string }>
}

export interface RejectionDialogState {
  isOpen: boolean
  type: "item" | "batch"
  itemId?: string
  batchId?: string
  itemName?: string
}

// Optional: if needed later
// export type User = {
//   name: string
//   email: string
//   image?: string
//   accountId: string
// }

// export type Property = Models.DocumentList<Models.Document> & {
//   $id: string
//   name: string
//   quantity: number
//   initial_price: number
//   category: string
// }
