
export const UOM_OPTIONS = [
  { label: "Piece (pc)", value: "pc" },
  { label: "Set", value: "set" },
  { label: "Box", value: "box" },
  { label: "Package (pkg)", value: "pkg" },
  { label: "Pair", value: "pair" },
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Liter (l)", value: "l" },
  { label: "Meter (m)", value: "m" },
  { label: "Square Meter (sqm)", value: "sqm" },
] as const;

export type UoM = typeof UOM_OPTIONS[number]["label"];

export type UserProfileStatus = "loading" | "not_exists" | "pending_approval" | "approved" | "rejected"

export const COMMON_REJECTION_REASONS = [
  "Insufficient budget allocation",
  "Item not available in inventory",
  "Request exceeds department quota",
  "Alternative solution recommended",
  "Requires additional approval",
  "Duplicate request already processed",
  "Item not essential for operations",
  "Vendor/supplier issues",
  "Policy violation",
  "Incomplete request information",
]

